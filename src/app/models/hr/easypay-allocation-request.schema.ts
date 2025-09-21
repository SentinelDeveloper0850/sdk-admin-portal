import { EAllocationRequestStatus } from '@/app/enums/hr/allocation-request-status.enum';
import mongoose, { Schema, Types } from 'mongoose';

export interface IEasypayAllocationRequest {
    _id?: string;
    transactionId: string;
    easypayNumber: string;
    policyNumber?: string;
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

const EasypayAllocationRequestSchema = new Schema(
    {
        transactionId: {
            type: Types.ObjectId,
            ref: 'EasypayTransaction',
            required: true
        },

        easypayNumber: {
            type: String,
            required: true,
        },

        policyNumber: {
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
    { timestamps: true }
);

export const EasypayAllocationRequestModel =
    mongoose.models["easypay-allocation-request"] ||
    mongoose.model<IEasypayAllocationRequest>("easypay-allocation-request", EasypayAllocationRequestSchema);

export default EasypayAllocationRequestModel;
