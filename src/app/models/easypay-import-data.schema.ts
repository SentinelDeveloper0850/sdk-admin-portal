import mongoose, { Schema } from "mongoose";

// Define the interface for TypeScript
export interface IEasypayImportData extends Document {
  _id?: string;
  uuid: string;
  date: string;
  numberOfTransactions: number;
  createdBy: string;
  created_at: Date;
}

// Define the schema
const IEasypayImportDataSchema: Schema = new Schema({
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
export const EasypayImportDataModel =
  mongoose.models["easypay-import-data"] ||
  mongoose.model<IEasypayImportData>(
    "easypay-import-data",
    IEasypayImportDataSchema
  );
