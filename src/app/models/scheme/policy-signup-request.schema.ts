import { createSystemNotification, getDiscordWebhookUrl, sendDiscordNotification } from "@/lib/discord";
import { sendPolicySignupConfirmationEmail } from "@/lib/email";
import mongoose, { Schema } from "mongoose";

// Define interfaces for the new data structure
interface IDependent {
  id: string;
  fullNames: string;
  surname: string;
  identificationNumber: string;
  dateOfBirth: string;
  isChild: boolean;
}

interface IFileUpload {
  originalName: string;
  type: 'id' | 'passport' | 'birth-certificate';
  personName: string;
  personType: 'main-member' | 'dependent';
  cloudinaryUrl?: string;
  cloudinaryPublicId?: string;
  tempPath?: string;
}

interface IPlanInfo {
  name: string;
  id: string;
}

// Define the interface for TypeScript
export interface IPolicySignUp extends Document {
  _id?: string;

  // Basic applicant information
  fullNames: string;
  surname: string;
  email?: string;
  phone: string;
  address?: string;
  identificationNumber: string;
  message?: string;

  // Plan information
  plan: IPlanInfo;

  // Dependents information (new structure)
  dependents: IDependent[];
  numberOfDependents: number;

  // File uploads (new structure)
  uploadedFiles: IFileUpload[];

  // Request tracking
  requestId: string;
  status?: string;
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

  // Methods
  sendCreationNotifications?: () => Promise<void>;
}

// Define the schema
const PolicySignUpSchema: Schema = new Schema({
  // Basic applicant information
  fullNames: { type: String, required: true },
  surname: { type: String, required: true },
  email: { type: String, required: false },
  phone: { type: String, required: true },
  address: { type: String, required: false },
  identificationNumber: { type: String, required: true },
  message: { type: String, required: false },

  // Plan information (updated structure)
  plan: {
    name: { type: String, required: true },
    id: { type: String, required: true }
  },

  // Dependents information (new detailed structure)
  dependents: [{
    id: { type: String, required: true },
    fullNames: { type: String, required: true },
    surname: { type: String, required: true },
    identificationNumber: { type: String, required: false }, // For adults
    dateOfBirth: { type: String, required: false }, // For children
    isChild: { type: Boolean, required: true }
  }],
  numberOfDependents: { type: Number, required: true },

  // File uploads (new structure)
  uploadedFiles: [{
    originalName: { type: String, required: true },
    type: {
      type: String,
      enum: ['id', 'passport', 'birth-certificate'],
      required: true
    },
    personName: { type: String, required: true },
    personType: {
      type: String,
      enum: ['main-member', 'dependent'],
      required: true
    },
    cloudinaryUrl: { type: String, required: false },
    cloudinaryPublicId: { type: String, required: false },
    tempPath: { type: String, required: false }
  }],

  // Request tracking
  requestId: { type: String, required: true, unique: true },
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

// Instance method: send notifications on creation
PolicySignUpSchema.methods.sendCreationNotifications = async function (): Promise<void> {
  try {
    const doc = this as any as IPolicySignUp & { _id: string };

    // Send applicant confirmation email if email provided
    if (doc.email) {
      await sendPolicySignupConfirmationEmail({
        to: doc.email,
        applicantName: `${doc.fullNames} ${doc.surname}`.trim(),
        requestId: doc.requestId,
        planName: (doc as any).plan?.name || (doc as any).plan,
        numberOfDependents: doc.numberOfDependents || (Array.isArray(doc.dependents) ? doc.dependents.length : 0),
        submittedAt: doc.created_at || new Date(),
        status: doc.currentStatus || "submitted",
        message: doc.message,
      });
    }

    // Send Discord notification to team channel
    const webhookUrl = getDiscordWebhookUrl();
    if (webhookUrl) {
      const fields = [
        { name: "Applicant", value: `${doc.fullNames} ${doc.surname}`.trim(), inline: true },
        { name: "Request ID", value: doc.requestId, inline: true },
        { name: "Plan", value: ((doc as any).plan?.name || (doc as any).plan || "-") as string, inline: true },
        { name: "Dependents", value: `${doc.numberOfDependents || (Array.isArray(doc.dependents) ? doc.dependents.length : 0)}`, inline: true },
        { name: "Phone", value: doc.phone || "-", inline: true },
        { name: "Email", value: doc.email || "-", inline: true },
      ];

      const payload = createSystemNotification(
        "📝 New Policy Signup Request",
        "A new policy signup request has been submitted.",
        "success",
        fields as any
      );

      await sendDiscordNotification(webhookUrl, payload, "policy-signup-create");
    }
  } catch (error) {
    console.error("Error sending policy signup creation notifications:", error);
  }
};

// Track if document is new across hooks
PolicySignUpSchema.pre("save", function (next) {
  (this as any)._wasNew = this.isNew;
  next();
});

// Post-save hook to trigger notifications only on creation
PolicySignUpSchema.post("save", async function (doc) {
  try {
    if ((this as any)._wasNew && typeof (doc as any).sendCreationNotifications === "function") {
      await (doc as any).sendCreationNotifications();
    }
  } catch (err) {
    console.error("Post-save notification hook failed:", err);
  }
});

export const PolicySignUpModel =
  mongoose.models["policy-signup-request"] ||
  mongoose.model<IPolicySignUp>("policy-signup-request", PolicySignUpSchema);
