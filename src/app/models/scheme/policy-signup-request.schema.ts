import mongoose, { Schema } from "mongoose";

// Define the interface for TypeScript
export interface IPolicySignUp extends Document {
  _id?: string;
  fullNames: string
  surname: string
  email?: string
  phone: string
  address?: string
  plan: string
  identificationNumber: string
  numberOfDependents: number
  message?: string
  status?: string
  created_by: string;
  created_at: Date;
}

// Define the schema
const PolicySignUpSchema: Schema = new Schema({
  fullNames: { type: String, required: true },
  surname: { type: String, required: true },
  email: { type: String, required: false },
  phone: { type: String, required: true },
  address: { type: String, required: false },
  plan: { type: String, required: true },
  identificationNumber: { type: String, required: true },
  numberOfDependents: { type: Number, required: true },
  message: { type: String, required: false },
  status: { type: String, required: false, default: "Submitted" },
  created_by: {
    type: String,
    required: false
  },
  created_at: {
    type: Date,
    default: Date.now(),
  },
});

export const PolicySignUpModel =
  mongoose.models["policy-signup-request"] ||
  mongoose.model<IPolicySignUp>("policy-signup-request", PolicySignUpSchema);
