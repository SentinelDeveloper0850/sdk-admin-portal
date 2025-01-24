import mongoose, { Schema } from "mongoose";

// Define the interface for TypeScript
export interface IEftTransaction extends Document {
  _id?: string;
  uuid: string;
  date: string;
  source: string;
  additionalInformation: string;
  description: string;
  amount: string;
  created_at: string;
}

// Define the schema
const EftTransactionSchema: Schema = new Schema({
  uuid: { type: String, required: true },
  date: { type: String, required: true },
  source: { type: String, required: true },
  additionalInformation: { type: String, required: false, default: "--" },
  description: { type: String, required: false, default: "--" },
  amount: { type: Number, required: true },
  created_at: {
    type: Date,
    default: Date.now(),
  },
});

// Check if the model is already compiled
export const EftTransactionModel = mongoose.models['eft-transactions'] || mongoose.model<IEftTransaction>("eft-transactions", EftTransactionSchema);
