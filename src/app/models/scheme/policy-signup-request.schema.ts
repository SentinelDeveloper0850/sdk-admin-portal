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

  // New fields for action system
  assignedConsultant?: string; // User ID of assigned consultant
  assignedConsultantName?: string; // Name for display purposes
  assignedAt?: Date;

  // Status and workflow
  currentStatus: "submitted" | "reviewed" | "approved" | "rejected" | "pending_info" | "escalated" | "archived" | "deleted";
  statusHistory: Array<{
    status: string;
    changedBy: string;
    changedAt: Date;
    notes?: string;
  }>;

  // Notes and comments
  internalNotes: Array<{
    author: string;
    authorName: string;
    text: string;
    createdAt: Date;
    isPrivate?: boolean; // Internal notes not visible to applicant
  }>;

  // Rejection and escalation details
  rejectionReason?: string;
  rejectionNotes?: string;
  escalatedTo?: string; // User ID
  escalatedToName?: string;
  escalatedAt?: Date;
  escalationReason?: string;

  // Policy creation details (when approved)
  generatedPolicyNumber?: string;
  policyCreatedAt?: Date;
  policyCreatedBy?: string;

  // Request for more info
  requestedInfo?: Array<{
    field: string;
    description: string;
    requestedAt: Date;
    requestedBy: string;
    providedAt?: Date;
    providedValue?: string;
  }>;

  // Deletion details
  deletedAt?: Date;
  deletedBy?: string;

  // Timestamps
  updated_at?: Date;
  updated_by?: string;
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

  // New fields for action system
  assignedConsultant: { type: String, required: false },
  assignedConsultantName: { type: String, required: false },
  assignedAt: { type: Date, required: false },

  // Status and workflow
  currentStatus: {
    type: String,
    enum: ["submitted", "reviewed", "approved", "rejected", "pending_info", "escalated", "archived", "deleted"],
    default: "submitted"
  },
  statusHistory: [{
    status: { type: String, required: true },
    changedBy: { type: String, required: true },
    changedAt: { type: Date, default: Date.now },
    notes: { type: String, required: false }
  }],

  // Notes and comments
  internalNotes: [{
    author: { type: String, required: true },
    authorName: { type: String, required: true },
    text: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    isPrivate: { type: Boolean, default: true }
  }],

  // Rejection and escalation details
  rejectionReason: { type: String, required: false },
  rejectionNotes: { type: String, required: false },
  escalatedTo: { type: String, required: false },
  escalatedToName: { type: String, required: false },
  escalatedAt: { type: Date, required: false },
  escalationReason: { type: String, required: false },

  // Policy creation details
  generatedPolicyNumber: { type: String, required: false },
  policyCreatedAt: { type: Date, required: false },
  policyCreatedBy: { type: String, required: false },

  // Request for more info
  requestedInfo: [{
    field: { type: String, required: true },
    description: { type: String, required: true },
    requestedAt: { type: Date, default: Date.now },
    requestedBy: { type: String, required: true },
    providedAt: { type: Date, required: false },
    providedValue: { type: String, required: false }
  }],

  // Deletion details
  deletedAt: { type: Date, required: false },
  deletedBy: { type: String, required: false },

  // Timestamps
  updated_at: { type: Date, default: Date.now },
  updated_by: { type: String, required: false }
});

export const PolicySignUpModel =
  mongoose.models["policy-signup-request"] ||
  mongoose.model<IPolicySignUp>("policy-signup-request", PolicySignUpSchema);
