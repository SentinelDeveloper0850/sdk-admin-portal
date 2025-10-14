import mongoose, { Document, Schema } from "mongoose";

// Define the interface for TypeScript
export interface ISchemeSociety extends Document {
  assitID: string;
  name: string;
  inceptionDate: string;
  address: string;
  phone: string;
  fax: string;
  chairmanFullNames: string;
  chairmanPhone: string;
  secretaryFullNames: string;
  secretaryPhone: string;
  treasurerFullNames: string;
  treasurerPhone: string;
  documentLinks: string[];
  planName: string;
  consultantId: string;
  consultantName: string;
  numberOfMembers: number;
}

// Define the schema
const SchemeSocietySchema: Schema = new Schema(
  {
    assitID: { type: String },
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
    documentLinks: [{ type: String }],
    planName: { type: String, required: true },
    consultantId: { type: String },
    consultantName: { type: String },
    numberOfMembers: { type: Number, default: 0 },
  },
  {
    timestamps: true,
  }
);

// Export the model
export const SchemeSocietyModel =
  mongoose.models["scheme-societies"] ||
  mongoose.model<ISchemeSociety>("scheme-societies", SchemeSocietySchema);
