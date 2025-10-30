import mongoose, { Schema } from "mongoose";


export interface IStaffMember extends Document {
  _id?: string;
  firstNames: string;
  initials: string;
  lastName: string;
  idNumber: string;
  address?: IAddress;
  contact?: IContact;
  employment?: IEmployment;
  userId: string;
  createdAt?: Date;
  updatedAt?: Date;
  createdBy?: string;
  updatedBy?: string;
}

export interface IAddress {
  addressLine1: string;
  addressLine2: string;
  suburb: string;
  town: string;
  province: string; // This is the province of the address
  country: string; // This is the country of the address
  postalCode: string;
}

export interface IContact {
  email: string;
  phone: string;
}

export interface IEmployment {
  branch: string;
  department: string;
  businessUnit: string;
  position: string;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  isPortalUser: boolean;
  notes: string;  
}

const StaffMemberSchema = new Schema({
  firstNames: { type: String, required: true },
  initials: { type: String, required: true },
  lastName: { type: String, required: true },
  idNumber: { type: String, required: true },
  address: { type: Schema.Types.Mixed, required: false },
  contact: { type: Schema.Types.Mixed, required: false },
  employment: { type: Schema.Types.Mixed, required: false },
  userId: { type: String, required: false },
  createdBy: { type: String, required: false },
  updatedBy: { type: String, required: false },
}, { timestamps: true });

export const StaffMemberModel = mongoose.models.StaffMember || mongoose.model<IStaffMember>("StaffMember", StaffMemberSchema);