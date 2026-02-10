import mongoose, { Schema } from "mongoose";

export interface ICashUpSubmissionReceipt {
  files: any[]; // Temporary until we know the type that is returned from cloudinary upload
  invoiceNumber?: string;
  submittedAmount: number;
  paymentMethod?: "cash" | "card" | "both" | "bank_deposit";
  cashAmount?: number;
  cardAmount?: number;
  bankDepositReference?: string;
  bankName?: string;
  depositorName?: string;
  reasonForCashTransactions?: string;
  receiptType?: "policy" | "funeral" | "sales";
  notes: string;
  submittedAt: string;
}

export interface ICashUpSubmission {
  _id?: string;
  submissionIdentifier: string;
  submissions: ICashUpSubmissionReceipt[];
  date: string;
  totalAmount: number;
  reviewNotes: string[];
  status: string;
  isLateSubmission: boolean;
  comments: string[];
  userId: string;
  submittedAt?: string;
  submittedById?: string;
  submittedByName?: string;
  reviewedAt?: string;
  reviewedById?: string;
  reviewedByName?: string;
  auditReport?: {
    fileUrl?: string;
    fileName?: string;
    incomeTotal?: number;
    expenseTotal?: number;
    netTotal?: number;
    cashupTotal?: number;
    delta?: number;
    balanced?: boolean;
    uploadedAt?: string;
    uploadedById?: string;
    uploadedByName?: string;
  };
}

const cashUpSubmissionSchema = new Schema(
  {
    userId: {
      type: String,
      required: true,
    },
    submissionIdentifier: {
      type: String,
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    totalAmount: {
      type: Number,
      required: true,
    },
    reviewNotes: {
      type: [String],
      default: [],
    },
    submissions: {
      type: [
        new Schema({
          files: { type: [Schema.Types.Mixed], required: true },
          invoiceNumber: {
            type: String,
            required: false,
            trim: true,
            default: null,
          },
          submittedAmount: {
            type: Number,
            required: true,
            min: [0, "Submitted amount cannot be negative"],
          },
          paymentMethod: {
            type: String,
            required: false,
            enum: ["cash", "card", "both", "bank_deposit"],
            default: null,
          },
          cashAmount: {
            type: Number,
            required: false,
            min: [0, "Cash amount cannot be negative"],
            default: null,
          },
          cardAmount: {
            type: Number,
            required: false,
            min: [0, "Card amount cannot be negative"],
            default: null,
          },
          bankDepositReference: {
            type: String,
            required: false,
            trim: true,
            default: null,
          },
          bankName: {
            type: String,
            required: false,
            trim: true,
            default: null,
          },
          depositorName: {
            type: String,
            required: false,
            trim: true,
            default: null,
          },
          reasonForCashTransactions: {
            type: String,
            required: false,
            trim: true,
            default: null,
          },
          receiptType: {
            type: String,
            required: false,
            enum: ["policy", "funeral", "sales"],
            default: null,
          },
          notes: { type: String, required: false, trim: true },
          submittedAt: { type: Date, default: Date.now },
        }),
      ],
      required: true,
    },
    status: {
      type: String,
      // Workflow:
      // - draft: user still uploading/adjusting receipts
      // - pending: user submitted for review
      // - needs_changes: reviewer sent back with issues
      // - resolved: user addressed issues and re-submitted
      // - approved/rejected: reviewer final decision
      enum: [
        "draft",
        "pending",
        "needs_changes",
        "resolved",
        "approved",
        "rejected",
      ],
      default: "draft",
    },
    isLateSubmission: {
      type: Boolean,
      default: false,
    },
    comments: {
      type: [String],
      default: [],
    },
    submittedAt: { type: Date, required: false, default: null },
    submittedById: { type: String, required: false, default: null },
    submittedByName: { type: String, required: false, default: null },
    reviewedAt: { type: Date, required: false, default: null },
    reviewedById: { type: String, required: false, default: null },
    reviewedByName: { type: String, required: false, default: null },
    auditReport: {
      type: new Schema(
        {
          fileUrl: { type: String, required: false, default: null },
          fileName: { type: String, required: false, default: null },
          incomeTotal: { type: Number, required: false, default: null },
          expenseTotal: { type: Number, required: false, default: null },
          netTotal: { type: Number, required: false, default: null },
          cashupTotal: { type: Number, required: false, default: null },
          delta: { type: Number, required: false, default: null },
          balanced: { type: Boolean, required: false, default: null },
          uploadedAt: { type: Date, required: false, default: null },
          uploadedById: { type: String, required: false, default: null },
          uploadedByName: { type: String, required: false, default: null },
        },
        { _id: false }
      ),
      required: false,
      default: null,
    },
  },
  { timestamps: true }
);

export const CashUpSubmissionModel =
  mongoose.models.cashup_submissions ||
  mongoose.model(
    "cashup_submissions",
    cashUpSubmissionSchema,
    "cashup_submissions"
  );
