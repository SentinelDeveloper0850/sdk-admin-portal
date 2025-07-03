import mongoose, { Schema } from "mongoose";

// Define the interface for TypeScript
export interface IEasypayTransaction extends Document {
  _id?: string;
  uuid: string;
  date: string;
  easypayNumber: string;
  policyNumber?: string;
  amount: string;
  created_at: string;
}

// Define the schema
const EasypayTransactionSchema: Schema = new Schema({
  uuid: { type: String, required: true },
  date: { type: String, required: true },
  easypayNumber: { type: String, required: false, default: "--" },
  policyNumber: { type: String, required: false },
  amount: { type: Number, required: true },
  created_at: {
    type: Date,
    default: Date.now(),
  },
});

// Check if the model is already compiled
export const EasypayTransactionModel =
  mongoose.models["easypay-transactions"] ||
  mongoose.model<IEasypayTransaction>(
    "easypay-transactions",
    EasypayTransactionSchema
  );
