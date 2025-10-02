import mongoose, { Document, Schema } from "mongoose";
import { ISociety } from "./society.schema";

// Define the interface for TypeScript
export interface ISchemeSociety extends ISociety {
  planName: string;
  consultantId: string;
  consultantName: string;
}

// Define the schema
const SchemeSocietySchema: Schema = new Schema(
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
    planName: { type: String },
    consultantId: { type: String },
    consultantName: { type: String },
  },
  {
    timestamps: true,
  }
);

// Export the model
export const SchemeSocietyModel =
  mongoose.models["scheme-societies"] ||
  mongoose.model<ISchemeSociety>("scheme-societies", SchemeSocietySchema);
