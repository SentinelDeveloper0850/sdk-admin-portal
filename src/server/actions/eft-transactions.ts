"use server";

import { AllocationRequestModel } from "@/app/models/hr/allocation-request.schema";
import {
  IEftImportData,
  IEftImportDataModel,
} from "@/app/models/scheme/eft-import-data.schema";
import {
  EftTransactionModel,
  IEftTransaction,
} from "@/app/models/scheme/eft-transaction.schema";
import { connectToDatabase } from "@/lib/db";

export const fetchAll = async (limit?: number) => {
  try {
    await connectToDatabase();

    const numberOfTransactions = await EftTransactionModel.countDocuments();

    const totalAllocationRequestsCount =
      await AllocationRequestModel.countDocuments({ type: "EFT" });
    const pendingAllocationRequestsCount =
      await AllocationRequestModel.countDocuments({
        status: "PENDING",
        type: "EFT",
      });
    const submittedAllocationRequestsCount =
      await AllocationRequestModel.countDocuments({
        status: "SUBMITTED",
        type: "EFT",
      });
    const approvedAllocationRequestsCount =
      await AllocationRequestModel.countDocuments({
        status: "APPROVED",
        type: "EFT",
      });
    const rejectedAllocationRequestsCount =
      await AllocationRequestModel.countDocuments({
        status: "REJECTED",
        type: "EFT",
      });
    const cancelledAllocationRequestsCount =
      await AllocationRequestModel.countDocuments({
        status: "CANCELLED",
        type: "EFT",
      });
    const duplicateAllocationRequestsCount =
      await AllocationRequestModel.countDocuments({
        status: "DUPLICATE",
        type: "EFT",
      });

    let transactionsQuery = EftTransactionModel.find()
      .sort({ date: -1 })
      .populate({ path: "allocationRequests", strictPopulate: false });

    if (limit) {
      transactionsQuery = transactionsQuery.limit(limit);
    }

    const transactions = await transactionsQuery;

    return {
      success: true,
      data: {
        stats: {
          count: numberOfTransactions,
          totalAllocationRequestsCount: totalAllocationRequestsCount,
          pendingAllocationRequestsCount: pendingAllocationRequestsCount,
          submittedAllocationRequestsCount: submittedAllocationRequestsCount,
          approvedAllocationRequestsCount: approvedAllocationRequestsCount,
          rejectedAllocationRequestsCount: rejectedAllocationRequestsCount,
          cancelledAllocationRequestsCount: cancelledAllocationRequestsCount,
          duplicateAllocationRequestsCount: duplicateAllocationRequestsCount,
        },
        transactions: transactions,
      },
    };
  } catch (error: any) {
    console.error("Error fetching eft transactions:", error.message);
    return {
      success: false,
      message: "Internal Server Error ~ Error fetching eft transactions",
    };
  }
};

export const searchTransactions = async (searchText: string) => {
  try {
    await connectToDatabase();

    const transactions = await EftTransactionModel.find({
      $or: [
        { description: { $regex: searchText, $options: "i" } },
        { additionalInformation: { $regex: searchText, $options: "i" } },
      ],
    }).sort({ date: -1 });
    // .populate({ path: "allocationRequests", strictPopulate: false });

    return {
      success: true,
      data: transactions,
    };
  } catch (error: any) {
    console.error("Error searching eft transactions by text", error.message);
    return {
      success: false,
      message:
        "Internal Server Error ~ Error searching eft transactions by text",
    };
  }
};

export const searchTransactionsByAmount = async (
  amount: number,
  filter: string
) => {
  try {
    await connectToDatabase();

    const transactions = await EftTransactionModel.find({
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
    // .populate({ path: "allocationRequests", strictPopulate: false });

    return {
      success: true,
      data: transactions,
    };
  } catch (error: any) {
    console.error("Error searching eft transactions by amount", error.message);
    return {
      success: false,
      message:
        "Internal Server Error ~ Error searching eft transactions by amount",
    };
  }
};

export const fetchImportHistory = async () => {
  try {
    await connectToDatabase();

    const importHistory = await IEftImportDataModel.find().sort({ uuid: -1 });

    return {
      success: true,
      data: importHistory,
    };
  } catch (error: any) {
    console.error("Error fetching eft import history:", error.message);
    return {
      success: false,
      message: "Internal Server Error ~ Error fetching eft import history",
    };
  }
};

export const findOne = async (id: string) => {
  try {
    await connectToDatabase();

    const transaction = await EftTransactionModel.findById(id).populate({
      path: "allocationRequests",
      strictPopulate: false,
    });

    return {
      success: true,
      data: transaction,
    };
  } catch (error: any) {
    console.error("Error fetching eft transaction:", error.message);
    return {
      success: false,
      message: "Internal Server Error ~ Error fetching eft transaction",
    };
  }
};

export const importFromBankStatement = async (payload: any) => {
  await connectToDatabase();

  try {
    const MONTHS = [
      { id: "01", name: "Jan" },
      { id: "02", name: "Feb" },
      { id: "03", name: "Mar" },
      { id: "04", name: "Apr" },
      { id: "05", name: "May" },
      { id: "06", name: "Jun" },
      { id: "07", name: "Jul" },
      { id: "08", name: "Aug" },
      { id: "09", name: "Sep" },
      { id: "10", name: "Oct" },
      { id: "11", name: "Nov" },
      { id: "12", name: "Dec" },
    ];

    const importDataList: IEftImportData[] = await IEftImportDataModel.find();
    const transactions = payload.transactions;
    const statementDate = payload.statementMonth;

    const importData = {
      uuid: payload.uuid,
      date: new Date(),
      numberOfTransactions: transactions.length,
      source: payload.source,
      createdBy: "Given Somdaka",
    };

    const _transactions: IEftTransaction[] = [];

    let existingImportData = importDataList.find(
      (item: IEftImportData) => item.uuid === importData.uuid
    );

    if (!existingImportData) {
      try {
        for (let index = 0; index < transactions.length; index++) {
          const element = transactions[index];

          let _amount = `${element.Amount ?? element.amount}`;
          let _description = `${element.Description ?? element.description}`;
          let _additionalInformation = `${element.__EMPTY ?? element.__EMPTY1 ?? element.additionalInformation ?? ""}`;

          if (_amount !== undefined || _description !== undefined) {
            if (
              _amount.toString().includes(" Cr") ||
              _amount.toString().includes("Cr")
            ) {
              _amount = _amount
                .replace(" Cr", "")
                .replace("Cr", "")
                .replace(",", "");
              _description = _description.toString().trim().replace("  ", " ");
              _additionalInformation = _additionalInformation
                .trim()
                .replace("  ", " ");
              _amount = _amount.toString().trim().replace(" ", "");

              let _day = element.Date
                ? element.Date.substring(0, 2)
                : element.date
                  ? element.date.substring(0, 2)
                  : "00";
              let _month = element.Date
                ? element.Date.substring(3, 6)
                : element.date
                  ? element.date.substring(3, 6)
                  : "00";

              let _statementMonth = statementDate.split("-").pop();
              let _statementYear = statementDate.substring(0, 4);

              let _year = _statementYear;

              for (let index = 0; index < MONTHS.length; index++) {
                if (_month === MONTHS[index].name) {
                  _month = MONTHS[index].id;
                }
              }

              if (_month === "12" && _statementMonth === "01")
                _year = Number(_statementYear) - 1;

              let _date = `${_year}/${_month}/${_day}`;

              const transaction: any = {
                amount: Number(_amount),
                description: _description.replace("  ", " "),
                additionalInformation: _additionalInformation.replace(
                  "  ",
                  " "
                ),
                date: _date,
                uuid: importData.uuid,
                source: payload.source,
              };

              _transactions.push(transaction);
            }
          }
        }
      } catch (exception) {
        console.error(exception);
      }

      if (_transactions.length > 0) {
        const validTransactions = [];
        const invalidTransactions = [];

        for (const txn of _transactions) {
          const parsedAmount = Number(txn.amount);
          if (isNaN(parsedAmount)) {
            console.warn("⚠️ Invalid transaction amount:", txn);
            invalidTransactions.push(txn);
          } else {
            validTransactions.push(txn); // keep original string format
          }
        }

        if (validTransactions.length > 0) {
          await EftTransactionModel.insertMany(validTransactions);
          importData.numberOfTransactions = validTransactions.length;
          await new IEftImportDataModel(importData).save();

          return {
            success: true,
            message: `Transactions imported (${validTransactions.length})`,
            invalidCount: invalidTransactions.length,
            invalidTransactions,
          };
        } else {
          return {
            success: false,
            message: "No valid transactions to import",
            invalidCount: invalidTransactions.length,
            invalidTransactions,
          };
        }
      } else {
        return { success: false, message: "Unable to import the transactions" };
      }
    } else {
      return {
        success: false,
        message: `${statementDate} Transactions already imported`,
      };
    }
  } catch (error: any) {
    console.error("Error importing eft transactions:", error.message);
    return {
      success: false,
      message: "Internal Server Error ~ Error importing eft transactions",
    };
  }
};

export const importFromTransactionHistory = async (payload: any) => {
  await connectToDatabase();

  try {
    const importDataList: IEftImportData[] = await IEftImportDataModel.find();

    const transactions = payload.transactions.map((item: any) => ({
      ...item,
      source: payload.source,
    }));
    const statementDate = payload.statementMonth;

    const importData = { ...payload.importData, source: payload.source };

    let existingImportData = importDataList.find(
      (item: IEftImportData) => item.uuid === importData.uuid
    );

    if (!existingImportData) {
      if (transactions.length > 0) {
        await EftTransactionModel.insertMany(transactions);
        await new IEftImportDataModel(importData).save();
        return { success: true, message: "Transactions imported" };
      } else {
        return { success: false, message: "Unable to import the transactions" };
      }
    } else {
      return {
        success: true,
        message: `${statementDate} Transactions already imported`,
      };
    }
  } catch (error: any) {
    console.error(
      "Error importing eft transactions from the Transaction History:",
      error.message
    );
    return {
      success: false,
      message:
        "Internal Server Error ~ Error importing eft transactions from the Transaction History",
    };
  }
};

export const reverseImport = async (uuid: string) => {
  try {
    await connectToDatabase();

    if (!uuid || typeof uuid !== "string") {
      return { success: false, message: "Invalid import uuid" };
    }

    // Delete transactions first
    const txnResult = await EftTransactionModel.deleteMany({ uuid });
    // Delete import metadata
    const importResult = await IEftImportDataModel.deleteOne({ uuid });

    const deletedTransactions = txnResult?.deletedCount || 0;
    const deletedImport = importResult?.deletedCount || 0;

    if (deletedTransactions === 0 && deletedImport === 0) {
      return {
        success: false,
        message: "No records found for the provided uuid",
        deletedTransactions,
        deletedImport,
      };
    }

    return {
      success: true,
      message: `Reversed import. Deleted ${deletedTransactions} transaction(s).`,
      deletedTransactions,
      deletedImport,
    };
  } catch (error: any) {
    console.error("Error reversing eft import:", error.message);
    return {
      success: false,
      message: "Internal Server Error ~ Error reversing eft import",
    };
  }
};
