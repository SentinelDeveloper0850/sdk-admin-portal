import { EAllocationRequestStatus } from '@/app/enums/hr/allocation-request-status.enum';
import { IEasypayTransaction } from '@/app/models/scheme/easypay-transaction.schema';
import { IEftTransaction } from '@/app/models/scheme/eft-transaction.schema';
import mongoose, { Schema, Types } from 'mongoose';

export interface IAllocationRequest {
  _id?: string;

  // 🔑 This must be model names
  transactionModel: "EftTransaction" | "EasypayTransaction";
  transactionId: Types.ObjectId;
  transaction?: unknown | IEftTransaction | IEasypayTransaction;

  policyNumber: string;
  easypayNumber?: string;

  notes: string[];
  evidence: string[];
  status: EAllocationRequestStatus;
  type?: "EFT" | "Easypay";

  requestedBy?: string;
  requestedAt?: Date;

  reviewedBy?: string;
  reviewedAt?: Date;

  allocatedBy?: string;
  allocatedAt?: Date;

  approvedBy?: string;
  approvedAt?: Date;

  rejectedBy?: string;
  rejectedAt?: Date;
  rejectionReason?: string;

  cancelledBy?: string;
  cancelledAt?: Date;

  submittedBy?: string;
  submittedAt?: Date;

  markedAsDuplicateBy?: string;
  markedAsDuplicateAt?: Date;

  comments?: string[];

  createdAt: Date;
  updatedAt: Date;
}

const AllocationRequestSchema = new Schema(
  {
    // 👇 tells mongoose which collection this ObjectId belongs to
    transactionModel: {
      type: String,
      required: true,
      enum: ['EftTransaction', 'EasypayTransaction'],
    },

    // 👇 one id that can point to either model above
    transactionId: {
      type: Types.ObjectId,
      required: true,
      refPath: 'transactionModel',
      index: true,
    },

    type: {
      type: String,
      enum: ["EFT", "Easypay"],
      default: "EFT",
    },

    policyNumber: {
      type: String,
      required: true,
    },

    easypayNumber: {
      type: String,
      required: false,
    },

    notes: { type: [String], required: true },
    evidence: { type: [String], required: true },

    status: {
      type: String,
      enum: EAllocationRequestStatus,
      default: EAllocationRequestStatus.PENDING,
    },

    requestedBy: { type: Types.ObjectId, ref: 'users', required: true },
    approvedBy: { type: Types.ObjectId, ref: 'users' },
    approvedAt: { type: Date },
    rejectionReason: { type: String },
    rejectedBy: { type: Types.ObjectId, ref: 'users' },
    rejectedAt: { type: Date },
    cancelledBy: { type: Types.ObjectId, ref: 'users' },
    cancelledAt: { type: Date },
    submittedBy: { type: Types.ObjectId, ref: 'users' },
    submittedAt: { type: Date },
    allocatedBy: { type: Types.ObjectId, ref: 'users' },
    allocatedAt: { type: Date },
    markedAsDuplicateBy: { type: Types.ObjectId, ref: 'users' },
    markedAsDuplicateAt: { type: Date },
  },
  { timestamps: true,
    toJSON: { virtuals: true },  
    toObject: { virtuals: true },
   }
);

// One nice polymorphic virtual called `transaction`
AllocationRequestSchema.virtual("transaction", {
  refPath: "transactionModel",   // <- uses the model name
  localField: "transactionId",
  foreignField: "_id",
  justOne: true,
});

// (Optional) keep `type` and `transactionModel` in sync
AllocationRequestSchema.pre("validate", function (next) {
  const model = this.get("transactionModel");
  const type = this.get("type");
  if ((type === "EFT" && model !== "EftTransaction") ||
    (type === "Easypay" && model !== "EasypayTransaction")) {
    return next(new Error("type does not match transactionModel"));
  }
  next();
});

export const AllocationRequestModel =
  mongoose.models.AllocationRequest ||
  mongoose.model<IAllocationRequest>("AllocationRequest", AllocationRequestSchema, "allocation-requests");

export default AllocationRequestModel;