"use server";

import { AssitPolicyModel } from "@/app/models/scheme/assit-policy.schema";
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

export const fetchAll = async (pageSize: number = 50, page: number = 1) => {
  try {
    await connectToDatabase();

    const skip = (page - 1) * pageSize;

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

    // Count unique EasyPay numbers without Policy numbers
    const uniqueEasyPayWithoutPolicyPromise = EasypayTransactionModel.aggregate([
      {
        $match: {
          $or: [
            { policyNumber: { $exists: false } },
            { policyNumber: null },
            { policyNumber: "" }
          ]
        }
      },
      {
        $group: {
          _id: "$easypayNumber"
        }
      },
      {
        $count: "uniqueCount"
      }
    ]);

    // Count transactions without Policy numbers (for backward compatibility)
    const withoutPolicyCountPromise = EasypayTransactionModel.countDocuments({
      $or: [
        { policyNumber: { $exists: false } },
        { policyNumber: null },
        { policyNumber: "" }
      ]
    });

    // Fetch transactions with pagination
    const transactionsPromise = EasypayTransactionModel.find()
      .sort({ date: -1 })
      .skip(skip)
      .limit(pageSize);

    const [count, toSync, withoutPolicy, uniqueEasyPayWithoutPolicy, transactions] = await Promise.all([
      totalCountPromise,
      toSyncCountPromise,
      withoutPolicyCountPromise,
      uniqueEasyPayWithoutPolicyPromise,
      transactionsPromise
    ]);

    return {
      success: true,
      data: {
        count,
        toSync,
        withoutPolicy,
        uniqueEasyPayWithoutPolicy: uniqueEasyPayWithoutPolicy[0]?.uniqueCount || 0,
        transactions,
        pagination: {
          current: page,
          pageSize: pageSize,
          total: count,
          totalPages: Math.ceil(count / pageSize)
        }
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

export const fetchToSync = async (pageSize: number = 50, page: number = 1) => {
  try {
    await connectToDatabase();

    const skip = (page - 1) * pageSize;

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

    // Count unique EasyPay numbers without Policy numbers
    const uniqueEasyPayWithoutPolicyPromise = EasypayTransactionModel.aggregate([
      {
        $match: {
          $or: [
            { policyNumber: { $exists: false } },
            { policyNumber: null },
            { policyNumber: "" }
          ]
        }
      },
      {
        $group: {
          _id: "$easypayNumber"
        }
      },
      {
        $count: "uniqueCount"
      }
    ]);

    // Count transactions without Policy numbers (for backward compatibility)
    const withoutPolicyCountPromise = EasypayTransactionModel.countDocuments({
      $or: [
        { policyNumber: { $exists: false } },
        { policyNumber: null },
        { policyNumber: "" }
      ]
    });

    // Fetch transactions to sync with pagination
    const transactionsPromise = EasypayTransactionModel.find({
      $or: [
        { policyNumber: { $exists: false } },
        { policyNumber: null },
        { policyNumber: "" }
      ]
    })
      .sort({ date: -1 })
      .skip(skip)
      .limit(pageSize);

    const [count, toSync, withoutPolicy, uniqueEasyPayWithoutPolicy, transactions] = await Promise.all([
      totalCountPromise,
      toSyncCountPromise,
      withoutPolicyCountPromise,
      uniqueEasyPayWithoutPolicyPromise,
      transactionsPromise
    ]);

    return {
      success: true,
      data: {
        count,
        toSync,
        withoutPolicy,
        uniqueEasyPayWithoutPolicy: uniqueEasyPayWithoutPolicy[0]?.uniqueCount || 0,
        transactions,
        pagination: {
          current: page,
          pageSize: pageSize,
          total: toSync,
          totalPages: Math.ceil(toSync / pageSize)
        }
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

export const searchTransactions = async (searchText: string, page = 1, pageSize = 50) => {
  try {
    await connectToDatabase();

    const skip = (page - 1) * pageSize;

    // Count total matching documents
    const totalCount = await EasypayTransactionModel.countDocuments({
      $or: [
        { easypayNumber: { $regex: searchText, $options: "i" } },
        { policyNumber: { $regex: searchText, $options: "i" } },
        { uuid: { $regex: searchText, $options: "i" } }
      ],
    });

    // Get paginated results
    const transactions = await EasypayTransactionModel.find({
      $or: [
        { easypayNumber: { $regex: searchText, $options: "i" } },
        { policyNumber: { $regex: searchText, $options: "i" } },
        { uuid: { $regex: searchText, $options: "i" } }
      ],
    })
      .sort({ date: -1 })
      .skip(skip)
      .limit(pageSize);

    return {
      success: true,
      data: {
        transactions,
        total: totalCount,
        pagination: {
          current: page,
          pageSize: pageSize,
          total: totalCount,
          totalPages: Math.ceil(totalCount / pageSize)
        }
      },
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

export const searchTransactionsByPolicyNumber = async (searchText: string, page = 1, pageSize = 50) => {
  try {
    await connectToDatabase();

    const skip = (page - 1) * pageSize;

    // Count total matching documents - only search policyNumber field
    const totalCount = await EasypayTransactionModel.countDocuments({
      policyNumber: { $regex: searchText, $options: "i" }
    });

    // Get paginated results - only search policyNumber field
    const transactions = await EasypayTransactionModel.find({
      policyNumber: { $regex: searchText, $options: "i" }
    })
      .sort({ date: -1 })
      .skip(skip)
      .limit(pageSize);

    return {
      success: true,
      data: {
        transactions,
        total: totalCount,
        pagination: {
          current: page,
          pageSize: pageSize,
          total: totalCount,
          totalPages: Math.ceil(totalCount / pageSize)
        }
      },
    };
  } catch (error: any) {
    console.error(
      "Error searching easypay transactions by policy number",
      error.message
    );
    return {
      success: false,
      message:
        "Internal Server Error ~ Error searching easypay transactions by policy number",
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
      'easypayNumber policyNumber'
    );

    // console.log("🚀 ~ syncPolicyNumbers ~ transaction count:", transactions.length)

    // Step 3: Group transactions by easypayNumber
    const groups: Record<string, string[]> = {}; // easypayNumber → [transaction._id]

    for (const txn of transactions) {
      const epNum = txn.easypayNumber;
      if (!epNum) continue;
      if (!groups[epNum]) groups[epNum] = [];
      groups[epNum].push(txn._id.toString());
    }

    // console.log("🚀 ~ syncPolicyNumbers ~ groups:", groups)

    // Step 4: Bulk update transactions per group
    let updatedCount = 0;
    for (const [easypayNumber, txnIds] of Object.entries(groups)) {
      let policyNumber = policyMap.get(easypayNumber);
      const linkedAssitPolicy = await AssitPolicyModel.findOne({ linkedEasipolPolicyNumber: policyNumber });

      if (linkedAssitPolicy) {
        policyNumber = linkedAssitPolicy.membershipID;
      }

      if (!policyNumber) continue;

      const result = await EasypayTransactionModel.updateMany(
        { _id: { $in: txnIds } },
        { $set: { policyNumber } }
      );

      updatedCount += result.modifiedCount;
      // console.log(`✅ Updated ${result.modifiedCount} transaction(s) for easypayNumber ${easypayNumber}`);
    }

    return {
      success: true,
      message: `Updated ${updatedCount} transactions with policy numbers.`,
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
  filter: string,
  page = 1,
  pageSize = 50
) => {
  try {
    await connectToDatabase();

    const skip = (page - 1) * pageSize;

    // Count total matching documents
    const totalCount = await EasypayTransactionModel.countDocuments({
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
    });

    // Get paginated results
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
    })
      .sort({ amount: filter === "<" ? "desc" : "asc" })
      .skip(skip)
      .limit(pageSize);

    return {
      success: true,
      data: {
        transactions,
        total: totalCount,
        pagination: {
          current: page,
          pageSize: pageSize,
          total: totalCount,
          totalPages: Math.ceil(totalCount / pageSize)
        }
      },
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
  date: string,
  page = 1,
  pageSize = 50
) => {
  try {
    await connectToDatabase();

    const skip = (page - 1) * pageSize;

    // Count total matching documents
    const totalCount = await EasypayTransactionModel.countDocuments({ date });

    // Get paginated results
    const transactions = await EasypayTransactionModel.find({ date })
      .sort({ date: -1 })
      .skip(skip)
      .limit(pageSize);

    return {
      success: true,
      data: {
        transactions,
        total: totalCount,
        pagination: {
          current: page,
          pageSize: pageSize,
          total: totalCount,
          totalPages: Math.ceil(totalCount / pageSize)
        }
      },
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

export const updateTransactionPolicyNumbers = async (transactions: Array<{
  transactionId: string;
  policyNumber: string;
}>) => {
  await connectToDatabase();

  try {
    let updatedCount = 0;
    const results = [];

    for (const item of transactions) {
      try {
        const result = await EasypayTransactionModel.findByIdAndUpdate(
          item.transactionId,
          {
            policyNumber: item.policyNumber,
            updatedAt: new Date()
          },
          { new: true }
        );

        if (result) {
          updatedCount++;
          results.push({
            transactionId: item.transactionId,
            policyNumber: item.policyNumber,
            success: true
          });
        } else {
          results.push({
            transactionId: item.transactionId,
            policyNumber: item.policyNumber,
            success: false,
            error: 'Transaction not found'
          });
        }
      } catch (error: any) {
        results.push({
          transactionId: item.transactionId,
          policyNumber: item.policyNumber,
          success: false,
          error: error.message
        });
      }
    }

    return {
      success: true,
      data: {
        updatedCount,
        totalProcessed: transactions.length,
        results
      },
      message: `Successfully updated ${updatedCount} out of ${transactions.length} transactions`
    };
  } catch (error: any) {
    console.error("Error updating transaction policy numbers:", error.message);
    return {
      success: false,
      message: "Internal Server Error ~ Error updating transaction policy numbers",
    };
  }
};
