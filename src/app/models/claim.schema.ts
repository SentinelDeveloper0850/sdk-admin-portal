// src/models/claim.schema.ts
import mongoose, { Schema, Document } from "mongoose";

export interface IClaim extends Document {
  policyId: string;
  claimantName: string;
  reason: string;
  status: "Draft" | "Submitted" | "In Review" | "Approved" | "Rejected";
  submittedBy: mongoose.Types.ObjectId;
  documents: Array<{ name: string; url: string }>;
  notes: Array<{ author: mongoose.Types.ObjectId; text: string; createdAt: Date }>;
  comments: Array<{ author: mongoose.Types.ObjectId; text: string; createdAt: Date }>;
  createdAt: Date;
  updatedAt: Date;
}

const claimSchema = new Schema<IClaim>(
  {
    policyId: { type: String, required: true },
    claimantName: { type: String, required: true },
    reason: { type: String, required: true },
    status: { type: String, default: "Draft", enum: ["Draft", "Submitted", "In Review", "Approved", "Rejected"] },
    submittedBy: { type: Schema.Types.ObjectId, ref: "users" },
    documents: [
      {
        name: String,
        url: String,
      },
    ],
    notes: [
      {
        author: { type: Schema.Types.ObjectId, ref: "users" },
        text: String,
        createdAt: { type: Date, default: Date.now },
      },
    ],
    comments: [
      {
        author: { type: Schema.Types.ObjectId, ref: "users" },
        text: String,
        createdAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

export const ClaimModel = mongoose.models.Claim || mongoose.model<IClaim>("Claim", claimSchema);
