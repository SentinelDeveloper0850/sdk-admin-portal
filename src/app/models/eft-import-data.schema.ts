import mongoose, { Schema } from "mongoose";

// Define the interface for TypeScript
export interface IEftImportData extends Document {
  _id?: string;
  uuid: string;
  date: string;
  numberOfTransactions: number;
  createdBy: string;
  created_at: Date;
}

// Define the schema
const IEftImportDataSchema: Schema = new Schema({
  uuid: { type: String, required: true, unique: true },
  date: { type: String, required: true },
  numberOfTransactions: { type: Number, required: true },
  createdBy: { type: String, required: true },
  created_at: {
    type: Date,
    default: Date.now(),
  },
});

// Check if the model is already compiled
// export const IEftImportDataModel = mongoose.models['eftImportData'] || mongoose.model<IEftImportData>("eftImportData", IEftImportDataSchema);
export const IEftImportDataModel = mongoose.models['eft-import-data'] || mongoose.model<IEftImportData>("eft-import-data", IEftImportDataSchema);
