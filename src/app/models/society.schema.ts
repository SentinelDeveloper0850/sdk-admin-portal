import mongoose, { Schema, Document } from "mongoose";

// Define the interface for TypeScript
export interface ISociety extends Document {
  societyId: string;
  name: string;
  inceptionDate?: string;
  address?: string;
  phone?: string;
  fax?: string;
  chairmanFullNames?: string;
  chairmanPhone?: string;
  secretaryFullNames?: string;
  secretaryPhone?: string;
  treasurerFullNames?: string;
  treasurerPhone?: string;
  balance?: number;
  documentLinks?: string[];
}

// Define the schema
const SocietySchema: Schema = new Schema(
  {
    societyId: { type: String },
    name: { type: String, required: true },
    inceptionDate: { type: String },
    address: { type: String },
    phone: { type: String },
    fax: { type: String },
    chairmanFullNames: { type: String },
    chairmanPhone: { type: String },
    secretaryFullNames: { type: String },
    secretaryPhone: { type: String },
    treasurerFullNames: { type: String },
    treasurerPhone: { type: String },
    balance: { type: Number },
    documentLinks: [{ type: String }],
  },
  {
    timestamps: true,
  }
);

// Export the model
export const SocietyModel =
  mongoose.models["societies"] || mongoose.model<ISociety>("societies", SocietySchema);
