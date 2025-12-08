import mongoose, { Schema } from "mongoose";

export interface ICashUpSubmissionSubmission {
  files: any[]; // Temporary until we know the type that is returned from cloudinary upload
  submittedAmount: number;
  notes: string;
  submittedAt: string;
}

export interface ICashUpSubmission {
  _id?: string;
  submissionIdentifier: string;
  submissions: ICashUpSubmissionSubmission[];
  date: string;
  totalAmount: number;
  reviewNotes: string[];
  status: string;
  isLateSubmission: boolean;
  comments: string[];
  userId: string;
}

const cashUpSubmissionSchema = new Schema({
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
    type: [new Schema({
      files: { type: [Schema.Types.Mixed], required: true },
      submittedAmount: { type: Number, required: true, min: [0, "Submitted amount cannot be negative"], },
      notes: { type: String, required: false, trim: true },
      submittedAt: { type: Date, default: Date.now },
    })],
    required: true,
  },
  status: {
    type: String,
    enum: ['draft', 'submitted', 'pending', 'approved', 'rejected'],
    default: 'draft',
  },
  isLateSubmission: {
    type: Boolean,
    default: false,
  },
  comments: {
    type: [String],
    default: [],
  },
}, { timestamps: true });

export const CashUpSubmissionModel =
  mongoose.models.cashup_submissions ||
  mongoose.model("cashup_submissions", cashUpSubmissionSchema, "cashup_submissions");