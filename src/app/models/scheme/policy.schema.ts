import mongoose, { Document, Schema } from "mongoose";

// Define the interface for TypeScript
export interface IPolicy extends Document {
  branchID: string;
  branchName: string;
  memberID: string;
  policyNumber: string;
  mandateReference?: string;
  internalReferenceNumber?: string;
  inceptionDate?: Date;
  fullname: string;
  iDNumber?: string;
  passportNumber?: string;
  dateOfBirth?: Date;
  productName: string;
  physicalAddress?: string;
  postalAddress?: string;
  cellNumber?: string;
  cellphoneNumber?: string;
  emailAddress?: string;
  usualPremium?: number;
  currency?: string;
  agentsName?: string;
  paymentMethod?: string;
  isDebiCheck?: boolean;
  userCode?: string;
  currstatus?: string;
  agentCode?: string;
  applicationComplete?: boolean;
  notes?: string;
  dateCaptured?: Date;
  maturityTerm?: number;
  groupName?: string;
  easypayNumber?: string;
  confidentialNotes?: string;
  overrideNAEDOWithEFT?: boolean;
  employeeID?: string;
  userID?: string;
  languageId?: string;
  salaryScaleID?: string;
  payAtNumber?: string;
  debitDay?: string;
  isNaedo?: boolean;
  capturerName?: string;
  languageName?: string;
  salaryScale?: string;
  homeTelephone?: string;
  excludeEscalation?: boolean;
  whatsappNumber?: string;
  paymentHistoryFile?: string;
}

// Define the schema
const PolicySchema: Schema = new Schema({
  branchID: { type: String },
  branchName: { type: String },
  memberID: { type: String, required: true },
  policyNumber: { type: String, required: true },
  mandateReference: { type: String, default: "" },
  internalReferenceNumber: { type: String, default: "" },
  inceptionDate: { type: Date },
  fullname: { type: String, required: true },
  iDNumber: { type: String },
  passportNumber: { type: String, default: "" },
  dateOfBirth: { type: Date },
  productName: { type: String, required: true },
  physicalAddress: { type: String, default: "" },
  postalAddress: { type: String, default: "" },
  cellNumber: { type: String },
  cellphoneNumber: { type: String },
  emailAddress: { type: String },
  usualPremium: { type: Number },
  currency: { type: String },
  agentsName: { type: String },
  paymentMethod: { type: String },
  isDebiCheck: { type: Boolean },
  userCode: { type: String },
  currstatus: { type: String },
  agentCode: { type: String },
  applicationComplete: { type: Boolean },
  notes: { type: String, default: "" },
  dateCaptured: { type: Date },
  maturityTerm: { type: Number },
  groupName: { type: String },
  easypayNumber: { type: String },
  confidentialNotes: { type: String, default: "" },
  overrideNAEDOWithEFT: { type: Boolean },
  employeeID: { type: String },
  userID: { type: String },
  languageId: { type: String },
  salaryScaleID: { type: String },
  payAtNumber: { type: String },
  debitDay: { type: String },
  isNaedo: { type: Boolean },
  capturerName: { type: String },
  languageName: { type: String },
  salaryScale: { type: String },
  homeTelephone: { type: String },
  excludeEscalation: { type: Boolean },
  whatsappNumber: { type: String },
  paymentHistoryFile: { type: String },
});

// Export the model
export const PolicyModel =
  mongoose.models["policies"] ||
  mongoose.model<IPolicy>("policies", PolicySchema);
