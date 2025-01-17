import { IEasypayImportData } from "./easypay-import-data.interface";
import { IEasypayTransaction } from "./easypay-transaction.interface";

export interface IEasypayImport {
  importData: IEasypayImportData;
  transactions: IEasypayTransaction[];
}