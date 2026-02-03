import mongoose, { Schema } from "mongoose";

export interface ICashUpAuditReport {
  _id?: string;
  userId: string;
  dateKey: string; // YYYY-MM-DD
  employeeNameFromReport: string;
  reportFromDateKey: string; // YYYY-MM-DD
  reportToDateKey: string; // YYYY-MM-DD
  fileUrl: string;
  fileName: string;
  incomeTotal: number;
  expenseTotal: number;
  netTotal: number;
  uploadedAt?: Date;
  uploadedById?: string;
  uploadedByName?: string;
}

const cashUpAuditReportSchema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    dateKey: { type: String, required: true, index: true }, // YYYY-MM-DD

    employeeNameFromReport: { type: String, required: true, trim: true },
    reportFromDateKey: { type: String, required: true },
    reportToDateKey: { type: String, required: true },

    fileUrl: { type: String, required: true },
    fileName: { type: String, required: true },

    incomeTotal: { type: Number, required: true },
    expenseTotal: { type: Number, required: true },
    netTotal: { type: Number, required: true },

    uploadedById: { type: String, required: false, default: null },
    uploadedByName: { type: String, required: false, default: null },
  },
  { timestamps: { createdAt: "uploadedAt", updatedAt: true } }
);

cashUpAuditReportSchema.index({ userId: 1, dateKey: 1 }, { unique: true });

export const CashUpAuditReportModel =
  mongoose.models.cashup_audit_reports ||
  mongoose.model(
    "cashup_audit_reports",
    cashUpAuditReportSchema,
    "cashup_audit_reports"
  );
