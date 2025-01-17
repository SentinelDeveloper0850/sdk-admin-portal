"use server"

import { EasypayImportDataModel, IEasypayImportData } from "@/app/models/easypay-import-data.schema";
import { EasypayTransactionModel, IEasypayTransaction } from "@/app/models/easypay-transaction.schema";
import { connectToDatabase } from "@/lib/db";

export const fetchAll = async () => {
  try {
    await connectToDatabase();

    const numberOfTransactions = await EasypayTransactionModel.countDocuments();

    const transactions = await EasypayTransactionModel.find()
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
    console.error("Error fetching easypay transactions:", error.message);
    return {
      success: false,
      message: "Internal Server Error ~ Error fetching easypay transactions"
    };
  }
}

export const searchTransactions = async (searchText: string) => {
  try {
    await connectToDatabase();

    const transactions = await EasypayTransactionModel.find({
      $or: [
        { easypayNumber: { $regex: searchText, $options: "i" } },
      ],
    })
      .sort({ date: -1 });

    return {
      success: true,
      data: transactions,
    };
  } catch (error: any) {
    console.error("Error searching easypay transactions by text", error.message);
    return {
      success: false,
      message: "Internal Server Error ~ Error searching easypay transactions by text",
    };
  }
};


export const searchTransactionsByAmount = async (amount: number, filter: string) => {
  try {
    await connectToDatabase();

    const transactions = await EasypayTransactionModel.find({
      $or: [{ amount: filter === '>' ? { $gt: amount } : filter === '<' ? { $lt: amount } : { $eq: amount } }],
    })
      .sort({ amount: filter === '<' ? 'desc' : 'asc' });

    return {
      success: true,
      data: transactions
    };

  } catch (error: any) {
    console.error("Error searching easypay transactions by amount", error.message);
    return {
      success: false,
      message: "Internal Server Error ~ Error searching easypay transactions by amount"
    };
  }
}

export const fetchImportHistory = async () => {
  try {
    await connectToDatabase();

    const importHistory = await EasypayImportDataModel.find()
      .sort({ uuid: -1 });

    return {
      success: true,
      data: importHistory
    };

  } catch (error: any) {
    console.error("Error fetching easypay import history:", error.message);
    return {
      success: false,
      message: "Internal Server Error ~ Error fetching easypay import history"
    };
  }
}

export const findOne = async (id: string) => {
  try {
    await connectToDatabase();

    const transaction = await EasypayTransactionModel.findById(id);

    return {
      success: true,
      data: transaction
    };

  } catch (error: any) {
    console.error("Error fetching easypay transaction:", error.message);
    return {
      success: false,
      message: "Internal Server Error ~ Error fetching easypay transaction"
    };
  }
}

export const importTransactions = async (payload: any) => {
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

    const importDataList: IEasypayImportData[] = await EasypayImportDataModel.find();

    // console.log("importTransactions ~ payload", payload)

    const transactions = payload.transactions;
    const statementDate = payload.statementMonth;

    const importData = {
      uuid: payload.uuid,
      date: new Date(),
      numberOfTransactions: transactions.length,
      createdBy: 'Given Somdaka'
    }

    const _transactions: IEasypayTransaction[] = [];

    let existingImportData = importDataList.find((item: IEasypayImportData) => item.uuid === importData.uuid);

    const parseData = async () => {
      console.log('Transactions to parse: =>', transactions.length);
      try {
        for (let index = 0; index < transactions.length; index++) {
          const element = transactions[index];

          let _amount = `${element.Amount ?? element.amount}`;
          let _date = `${element.date}`;
          let _easypayNumber = `${element.EasypayNumber ?? element.easypayNumber}`;
          let _uuid = `${element.uuid}`;

          if (_amount !== undefined || _easypayNumber !== undefined) {
            _amount = _amount.replace(' Cr', '').replace('Cr', '').replace(',', '');
            _amount = _amount.toString().trim().replace(' ', '');

            // let _day = element.Date ? element.Date.substr(0, 2) : element.date ? element.date.substr(0, 2) : '00';
            // let _month = element.Date ? element.Date.substr(3, 3) : element.date ? element.date.substr(3, 3) : '00';

            // let _statementMonth = statementDate.split('-').pop();
            // let _statementYear = statementDate.substr(0, 4);

            // let _year = _statementYear;

            // for (let index = 0; index < MONTHS.length; index++) {
            //   if (_month === MONTHS[index].name) {
            //     _month = MONTHS[index].id;
            //   }
            // }

            // if (_month === '12' && _statementMonth === '01') _year = Number(_statementYear) - 1;

            // let _date = `${_year}/${_month}/${_day}`;

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
      }
    };

    if (!existingImportData) {
      await parseData().then(async () => {
        if (_transactions.length > 0) {
          await EasypayTransactionModel.insertMany([..._transactions]);
          importData.numberOfTransactions = _transactions.length;
          await new EasypayImportDataModel(importData).save();
          return { success: true, message: 'Transactions imported' };
        } else {
          return { success: false, message: 'Unable to import the transactions' };
        }
      });
    } else {
      return { success: true, message: `${statementDate} Transactions already imported` }
    }
    return { success: true, message: 'Transactions imported' };;
  } catch (error: any) {
    console.error("Error importing easypay transactions:", error.message);
    return {
      success: false,
      message: "Internal Server Error ~ Error importing easypay transactions"
    };
  }
}