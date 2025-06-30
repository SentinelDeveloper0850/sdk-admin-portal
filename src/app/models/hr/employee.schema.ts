import { Schema, model, Types } from 'mongoose';

export interface IEmployee {
  _id: string;
  firstName: string;
  lastName: string;
  contactNumber?: string;
  department?: string;
  position?: string;
  dateHired?: Date;
  isActive: boolean;
  leaveBalance: {
    annual: number;
    sick: number;
    study: number;
    bereavement: number;
    maternity: number;
    paternity: number;
    unpaid: number;
  };
  userId?: string; // Optional FK to User
  createdAt: Date;
  updatedAt: Date;
}

const EmployeeSchema = new Schema(
  {
    fullName: { type: String, required: true },
    idNumber: { type: String, required: true, unique: true },
    position: { type: String, required: true },
    department: { type: String },
    startDate: { type: Date, required: true },
    endDate: { type: Date }, // optional, for terminated/resigned
    user: { type: Types.ObjectId, ref: 'User' }, // optional link to User

    leaveBalance: {
      annual: { type: Number, default: 15 },
      sick: { type: Number, default: 10 },
      familyResponsibility: { type: Number, default: 3 },
      unpaid: { type: Number, default: 0 }, // usually tracked but not deducted
    },

    status: {
      type: String,
      enum: ['ACTIVE', 'INACTIVE', 'SUSPENDED'],
      default: 'ACTIVE',
    },
  },
  { timestamps: true }
);

export const Employee = model('Employee', EmployeeSchema);