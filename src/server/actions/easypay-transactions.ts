"use server";

import {
  EasypayImportDataModel,
  IEasypayImportData,
} from "@/app/models/scheme/easypay-import-data.schema";
import {
  EasypayTransactionModel,
  IEasypayTransaction,
} from "@/app/models/scheme/easypay-transaction.schema";
import { PolicyModel } from "@/app/models/scheme/policy.schema";
import { connectToDatabase } from "@/lib/db";

export const fetchAll = async () => {
  try {
    await connectToDatabase();

    // Count all transactions
    const totalCountPromise = EasypayTransactionModel.countDocuments();

    // Count only those needing sync
    const toSyncCountPromise = EasypayTransactionModel.countDocuments({
      $or: [
        { policyNumber: { $exists: false } },
        { policyNumber: null },
        { policyNumber: "" }
      ]
    });

    // Fetch recent 1000 transactions
    const recentTransactionsPromise = EasypayTransactionModel.find()
      .sort({ date: -1 })
      .limit(1000);

    const [count, toSync, transactions] = await Promise.all([
      totalCountPromise,
      toSyncCountPromise,
      recentTransactionsPromise
    ]);

    return {
      success: true,
      data: {
        count,
        toSync,
        transactions,
      },
    };
  } catch (error: any) {
    console.error("Error fetching easypay transactions:", error.message);
    return {
      success: false,
      message: "Internal Server Error ~ Error fetching easypay transactions",
    };
  }
};

export const searchTransactions = async (searchText: string) => {
  try {
    await connectToDatabase();

    const transactions = await EasypayTransactionModel.find({
      $or: [{ easypayNumber: { $regex: searchText, $options: "i" } }],
    }).sort({ date: -1 });

    return {
      success: true,
      data: transactions,
    };
  } catch (error: any) {
    console.error(
      "Error searching easypay transactions by text",
      error.message
    );
    return {
      success: false,
      message:
        "Internal Server Error ~ Error searching easypay transactions by text",
    };
  }
};

export const syncPolicyNumbers = async () => {
  try {
    await connectToDatabase();

    // Step 1: Build map of easypayNumber -> policyNumber
    const policies = await PolicyModel.find({}, 'policyNumber easypayNumber');
    const policyMap = new Map(policies.map(p => [p.easypayNumber, p.policyNumber]));

    // Step 2: Find only transactions missing a policyNumber
    const transactions = await EasypayTransactionModel.find(
      {
        $or: [
          { policyNumber: { $exists: false } },
          { policyNumber: null },
          { policyNumber: "" }
        ]
      },
      'easypayNumber'
    );

    // Step 3: Group transactions by easypayNumber
    const groups: Record<string, string[]> = {}; // easypayNumber → [transaction._id]
    for (const txn of transactions) {
      const epNum = txn.easypayNumber;
      if (!epNum) continue;
      if (!groups[epNum]) groups[epNum] = [];
      groups[epNum].push(txn._id.toString());
    }

    // Step 4: Bulk update transactions per group
    let updatedCount = 0;
    for (const [easypayNumber, txnIds] of Object.entries(groups)) {
      const policyNumber = policyMap.get(easypayNumber);
      if (!policyNumber) continue;

      const result = await EasypayTransactionModel.updateMany(
        { _id: { $in: txnIds } },
        { $set: { policyNumber } }
      );

      updatedCount += result.modifiedCount;
      console.log(`✅ Updated ${result.modifiedCount} transaction(s) for easypayNumber ${easypayNumber}`);
    }

    return {
      success: true,
      message: `Updated ${updatedCount} transaction(s) with policy numbers.`,
    };
  } catch (error: any) {
    console.error("Error syncing policy numbers", error.message);
    return {
      success: false,
      message: "Internal Server Error ~ Error syncing policy numbers",
    };
  }
};

export const searchTransactionsByAmount = async (
  amount: number,
  filter: string
) => {
  try {
    await connectToDatabase();

    const transactions = await EasypayTransactionModel.find({
      $or: [
        {
          amount:
            filter === ">"
              ? { $gt: amount }
              : filter === "<"
                ? { $lt: amount }
                : { $eq: amount },
        },
      ],
    }).sort({ amount: filter === "<" ? "desc" : "asc" });

    return {
      success: true,
      data: transactions,
    };
  } catch (error: any) {
    console.error(
      "Error searching easypay transactions by amount",
      error.message
    );
    return {
      success: false,
      message:
        "Internal Server Error ~ Error searching easypay transactions by amount",
    };
  }
};

export const searchTransactionsByDate = async (
  date: string
) => {
  try {
    await connectToDatabase();

    const transactions = await EasypayTransactionModel.find({ date });

    return {
      success: true,
      data: transactions,
    };
  } catch (error: any) {
    console.error(
      "Error searching easypay transactions by date",
      error.message
    );
    return {
      success: false,
      message:
        "Internal Server Error ~ Error searching easypay transactions by date",
    };
  }
};

export const fetchImportHistory = async () => {
  try {
    await connectToDatabase();

    const importHistory = await EasypayImportDataModel.find().sort({
      uuid: -1,
    });

    return {
      success: true,
      data: importHistory,
    };
  } catch (error: any) {
    console.error("Error fetching easypay import history:", error.message);
    return {
      success: false,
      message: "Internal Server Error ~ Error fetching easypay import history",
    };
  }
};

export const findOne = async (id: string) => {
  try {
    await connectToDatabase();

    const transaction = await EasypayTransactionModel.findById(id);

    return {
      success: true,
      data: transaction,
    };
  } catch (error: any) {
    console.error("Error fetching easypay transaction:", error.message);
    return {
      success: false,
      message: "Internal Server Error ~ Error fetching easypay transaction",
    };
  }
};

export const importTransactions = async (payload: any) => {
  await connectToDatabase();

  try {
    const importDataList: IEasypayImportData[] =
      await EasypayImportDataModel.find();

    const transactions = payload.transactions;
    const statementDate = payload.statementMonth;

    const importData = {
      uuid: payload.uuid,
      date: new Date(),
      numberOfTransactions: transactions.length,
      createdBy: "Given Somdaka",
    };

    const _transactions: IEasypayTransaction[] = [];

    let existingImportData = importDataList.find(
      (item: IEasypayImportData) => item.uuid === importData.uuid
    );

    const parseData = async () => {
      try {
        for (let index = 0; index < transactions.length; index++) {
          const element = transactions[index];

          let _amount = `${element.Amount ?? element.amount}`;
          let _date = `${element.date}`;
          let _easypayNumber = `${element.EasypayNumber ?? element.easypayNumber}`;
          let _uuid = `${element.uuid}`;

          if (_amount !== undefined || _easypayNumber !== undefined) {
            _amount = _amount.replace(",", "");
            _amount = _amount.toString().trim().replace(" ", "");

            const transaction: any = {
              amount: Number(_amount),
              easypayNumber: _easypayNumber,
              date: _date,
              uuid: _uuid,
            };

            _transactions.push(transaction);
          }
        }
      } catch (exception) {
        console.log(exception);
        return {
          success: false,
          message:
            "Something went wrong - Unable to parse the transaction data",
        };
      }
    };

    if (!existingImportData) {
      await parseData().then(async () => {
        if (_transactions.length > 0) {
          await EasypayTransactionModel.insertMany([..._transactions]);
          importData.numberOfTransactions = _transactions.length;
          await new EasypayImportDataModel(importData).save();
          return { success: true, message: "Transactions imported" };
        } else {
          return {
            success: false,
            message: "Unable to import the transactions",
          };
        }
      });
    } else {
      return {
        success: true,
        message: `${statementDate} Transactions already imported`,
      };
    }
    return { success: true, message: "Transactions imported" };
  } catch (error: any) {
    console.error("Error importing easypay transactions:", error.message);
    return {
      success: false,
      message: "Internal Server Error ~ Error importing easypay transactions",
    };
  }
};
