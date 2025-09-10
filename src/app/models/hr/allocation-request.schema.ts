import { EAllocationRequestStatus } from '@/app/enums/hr/allocation-request-status.enum';
import mongoose, { Schema, Types } from 'mongoose';

export interface IAllocationRequest {
  _id?: string;
  transactionId: string;
  policyNumber: string;
  notes: string[];
  evidence: string[];
  status: EAllocationRequestStatus;

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

    notes: { type: [String], required: true },
    evidence: { type: [String], required: true },

    status: {
      type: String,
      enum: EAllocationRequestStatus,
      default: EAllocationRequestStatus.PENDING,
    },

    requestedBy: { type: Types.ObjectId, ref: 'User', required: true },
    approvedBy: { type: Types.ObjectId, ref: 'User' },
    approvedAt: { type: Date },
    rejectionReason: { type: String },
  },
  { timestamps: true }
);

export const AllocationRequestModel =
  mongoose.models["allocation-request"] ||
  mongoose.model<IAllocationRequest>("allocation-request", AllocationRequestSchema);

export default AllocationRequestModel;