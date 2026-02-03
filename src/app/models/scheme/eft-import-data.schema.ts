import mongoose, { Schema } from "mongoose";

// Define the interface for TypeScript
export interface IEftImportData extends Document {
  _id?: string;
  uuid: string;
  date: string;
  source: string;
  numberOfTransactions: number;
  createdBy: string;
  created_at: Date;
  // Enhanced fields for better import tracking (optional)
  contentHash?: string;
  dateRange?: {
    start: string;
    end: string;
  };
  importType?: string;
}

// Define the schema
const IEftImportDataSchema: Schema = new Schema({
  uuid: { type: String, required: true, unique: true },
  date: { type: String, required: true },
  source: { type: String, required: true },
  numberOfTransactions: { type: Number, required: true },
  createdBy: { type: String, required: true },
  created_at: {
    type: Date,
    default: Date.now,
  },
  // Enhanced fields (optional for backward compatibility)
  contentHash: { type: String, required: false },
  dateRange: {
    start: { type: String, required: false },
    end: { type: String, required: false },
  },
  importType: { type: String, required: false },
});

// Check if the model is already compiled
export const IEftImportDataModel =
  mongoose.models?.eft_import_data ||
  mongoose.model<IEftImportData>(
    "eft_import_data",
    IEftImportDataSchema,
    "eft_import_data"
  );
