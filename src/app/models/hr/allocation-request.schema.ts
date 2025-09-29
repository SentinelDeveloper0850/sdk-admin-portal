import { EAllocationRequestStatus } from '@/app/enums/hr/allocation-request-status.enum';
import mongoose, { Schema, Types } from 'mongoose';

export interface IAllocationRequest {
  _id?: string;
  transactionId: string;
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
    transactionId: {
      type: Types.ObjectId,
      ref: 'Transaction',
      required: true
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

    type: {
      type: String,
      enum: ["EFT", "Easypay"],
      default: "EFT",
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
  { timestamps: true }
);

export const AllocationRequestModel =
  mongoose.models["allocation-request"] ||
  mongoose.model<IAllocationRequest>("allocation-request", AllocationRequestSchema);

export default AllocationRequestModel;