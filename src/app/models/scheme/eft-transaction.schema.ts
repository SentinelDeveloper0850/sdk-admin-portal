import mongoose, { Schema } from "mongoose";

// Define the interface for TypeScript
export interface IEftTransaction extends Document {
  _id?: mongoose.Types.ObjectId;
  uuid: string;
  date: string;
  source: string;
  additionalInformation: string;
  description: string;
  amount: number;
  created_at: Date;
  allocationRequests?: mongoose.Types.ObjectId[];
}

const EftTransactionSchema: Schema = new Schema({
  uuid: { type: String, required: true },
  date: { type: String, required: true },
  source: { type: String, required: true },
  additionalInformation: { type: String, default: "--" },
  description: { type: String, default: "--" },
  amount: { type: Number, required: true },
  created_at: { type: Date, default: Date.now },            // <- function, not call
  allocationRequests: [{ type: Schema.Types.ObjectId, ref: "AllocationRequest", default: [] }], // <- ObjectId + ref works
});

// Check if the model is already compiled
export const EftTransactionModel =
  mongoose.models.EftTransaction || mongoose.model<IEftTransaction>("EftTransaction", EftTransactionSchema, "eft-transactions");

export default EftTransactionModel;