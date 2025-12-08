import mongoose, { Model, Schema, Types } from 'mongoose';
import { ELeaveRequestStatus, ELeaveType } from '../../enums/hr/leave.enum';

export interface ILeaveRequest {
  _id?: string;
  employeeId: string;
  type: ELeaveType;
  reason: string;
  fromDate: Date;
  toDate: Date;
  daysRequested: number;
  status: ELeaveRequestStatus;
  approverId?: string; // User who approved/rejected
  comments?: string;
  createdAt: Date;
  updatedAt: Date;
}

const LeaveRequestSchema = new Schema(
  {
    employee: { type: Types.ObjectId, ref: 'Employee', required: true },

    leaveType: {
      type: String,
      enum: ELeaveType,
      required: true,
    },

    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    numberOfDays: { type: Number, required: true },

    reason: { type: String },
    supportingDocumentUrl: { type: String }, // e.g., Cloudinary link

    status: {
      type: String,
      enum: ELeaveRequestStatus,
      default: ELeaveRequestStatus.PENDING,
    },

    requestedBy: { type: Types.ObjectId, ref: 'User', required: true },
    approvedBy: { type: Types.ObjectId, ref: 'User' },
    approvedAt: { type: Date },
    rejectionReason: { type: String },
  },
  { timestamps: true }
);

export const LeaveRequest: Model<ILeaveRequest> = mongoose.models.leave_requests || mongoose.model<ILeaveRequest>(
  "leave_requests",
  LeaveRequestSchema,
  "leave_requests"
);
