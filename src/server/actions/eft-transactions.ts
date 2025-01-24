"use server"

import { IEftImportData, IEftImportDataModel } from "@/app/models/eft-import-data.schema";
import { EftTransactionModel, IEftTransaction } from "@/app/models/eft-transaction.schema";
import { connectToDatabase } from "@/lib/db";

export const fetchAll = async () => {
  try {
    await connectToDatabase();

    const numberOfTransactions = await EftTransactionModel.countDocuments();

    const transactions = await EftTransactionModel.find()
      .sort({ date: -1 })
      .limit(1000);

    return {
      success: true,
      data: {
        count: numberOfTransactions,
        transactions: transactions,
      }
    };

  } catch (error: any) {
    console.error("Error fetching eft transactions:", error.message);
    return {
      success: false,
      message: "Internal Server Error ~ Error fetching eft transactions"
    };
  }
}

export const searchTransactions = async (searchText: string) => {
  try {
    await connectToDatabase();

    const transactions = await EftTransactionModel.find({
      $or: [
        { description: { $regex: searchText, $options: "i" } },
        { additionalInformation: { $regex: searchText, $options: "i" } },
      ],
    })
      .sort({ date: -1 });

    return {
      success: true,
      data: transactions,
    };
  } catch (error: any) {
    console.error("Error searching eft transactions by text", error.message);
    return {
      success: false,
      message: "Internal Server Error ~ Error searching eft transactions by text",
    };
  }
};


export const searchTransactionsByAmount = async (amount: number, filter: string) => {
  try {
    await connectToDatabase();

    const transactions = await EftTransactionModel.find({
      $or: [{ amount: filter === '>' ? { $gt: amount } : filter === '<' ? { $lt: amount } : { $eq: amount } }],
    })
      .sort({ amount: filter === '<' ? 'desc' : 'asc' });

    return {
      success: true,
      data: transactions
    };

  } catch (error: any) {
    console.error("Error searching eft transactions by amount", error.message);
    return {
      success: false,
      message: "Internal Server Error ~ Error searching eft transactions by amount"
    };
  }
}

export const fetchImportHistory = async () => {
  try {
    await connectToDatabase();

    const importHistory = await IEftImportDataModel.find()
      .sort({ uuid: -1 });

    return {
      success: true,
      data: importHistory
    };

  } catch (error: any) {
    console.error("Error fetching eft import history:", error.message);
    return {
      success: false,
      message: "Internal Server Error ~ Error fetching eft import history"
    };
  }
}

export const findOne = async (id: string) => {
  try {
    await connectToDatabase();

    const transaction = await EftTransactionModel.findById(id);

    return {
      success: true,
      data: transaction
    };

  } catch (error: any) {
    console.error("Error fetching eft transaction:", error.message);
    return {
      success: false,
      message: "Internal Server Error ~ Error fetching eft transaction"
    };
  }
}

export const importFromBankStatement = async (payload: any) => {
  await connectToDatabase();

  try {
    const MONTHS = [
      { id: '01', name: 'Jan' },
      { id: '02', name: 'Feb' },
      { id: '03', name: 'Mar' },
      { id: '04', name: 'Apr' },
      { id: '05', name: 'May' },
      { id: '06', name: 'Jun' },
      { id: '07', name: 'Jul' },
      { id: '08', name: 'Aug' },
      { id: '09', name: 'Sep' },
      { id: '10', name: 'Oct' },
      { id: '11', name: 'Nov' },
      { id: '12', name: 'Dec' },
    ];

    const importDataList: IEftImportData[] = await IEftImportDataModel.find();

    const transactions = payload.transactions;
    const statementDate = payload.statementMonth;

    const importData = {
      uuid: payload.uuid,
      date: new Date(),
      numberOfTransactions: transactions.length,
      source: payload.source,
      createdBy: 'Given Somdaka'
    }

    const _transactions: IEftTransaction[] = [];

    let existingImportData = importDataList.find((item: IEftImportData) => item.uuid === importData.uuid);

    const parseData = async () => {
      // console.log('Transactions to parse: =>', transactions.length);
      try {
        for (let index = 0; index < transactions.length; index++) {
          const element = transactions[index];

          let _amount = `${element.Amount ?? element.amount}`;
          let _description = `${element.Description ?? element.description}`;
          let _additionalInformation = `${element.__EMPTY ?? element.__EMPTY1 ?? element.additionalInformation ?? ''}`;

          if (_amount !== undefined || _description !== undefined) {
            if ((_amount.toString().includes(' Cr')) || _amount.toString().includes('Cr')) {
              _amount = _amount.replace(' Cr', '').replace('Cr', '').replace(',', '');
              _description = _description.toString().trim().replace('  ', ' ');
              _additionalInformation = _additionalInformation.trim().replace('  ', ' ');
              _amount = _amount.toString().trim().replace(' ', '');

              let _day = element.Date ? element.Date.substr(0, 2) : element.date ? element.date.substr(0, 2) : '00';
              let _month = element.Date ? element.Date.substr(3, 3) : element.date ? element.date.substr(3, 3) : '00';

              let _statementMonth = statementDate.split('-').pop();
              let _statementYear = statementDate.substr(0, 4);

              let _year = _statementYear;

              for (let index = 0; index < MONTHS.length; index++) {
                if (_month === MONTHS[index].name) {
                  _month = MONTHS[index].id;
                }
              }

              if (_month === '12' && _statementMonth === '01') _year = Number(_statementYear) - 1;

              let _date = `${_year}/${_month}/${_day}`;

              const transaction: any = {
                amount: Number(_amount),
                description: _description.replace('  ', ' '),
                additionalInformation: _additionalInformation.replace('  ', ' '),
                date: _date,
                uuid: importData.uuid,
                source: payload.source
              };

              // console.log(`Transaction to import #${index + 1}`, transaction)

              _transactions.push(transaction);
            }
          }
        }
      } catch (exception) {
        console.error(exception);
      }
    };

    if (!existingImportData) {
      await parseData().then(async () => {
        if (_transactions.length > 0) {
          await EftTransactionModel.insertMany([..._transactions]);
          importData.numberOfTransactions = _transactions.length;
          await new IEftImportDataModel(importData).save();
          return { success: true, message: 'Transactions imported' };
        } else {
          // console.log('Transactions parsed: => ', _transactions);
          return { success: false, message: 'Unable to import the transactions' };
        }
      });
    } else {
      return { success: true, message: `${statementDate} Transactions already imported` }
    }
    return {
      success: false,
      message: "Internal Server Error ~ Error importing eft transactions"
    };
  } catch (error: any) {
    console.error("Error importing eft transactions:", error.message);
    return {
      success: false,
      message: "Internal Server Error ~ Error importing eft transactions"
    };
  }
}

export const importFromTransactionHistory = async (payload: any) => {
  await connectToDatabase();

  try {
    const importDataList: IEftImportData[] = await IEftImportDataModel.find();

    const transactions = payload.transactions.map((item: any) => ({ ...item, source: payload.source }));
    const statementDate = payload.statementMonth;

    const importData = { ...payload.importData, source: payload.source };

    let existingImportData = importDataList.find((item: IEftImportData) => item.uuid === importData.uuid);

    if (!existingImportData) {
      if (transactions.length > 0) {
        await EftTransactionModel.insertMany(transactions);
        await new IEftImportDataModel(importData).save();
        return { success: true, message: 'Transactions imported' };
      } else {
        return { success: false, message: 'Unable to import the transactions' };
      }
    } else {
      return { success: true, message: `${statementDate} Transactions already imported` }
    }
  } catch (error: any) {
    console.error("Error importing eft transactions from the Transaction History:", error.message);
    return {
      success: false,
      message: "Internal Server Error ~ Error importing eft transactions from the Transaction History"
    };
  }
}