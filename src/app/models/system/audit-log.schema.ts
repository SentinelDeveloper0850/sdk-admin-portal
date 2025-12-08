import mongoose, { Document, Schema } from "mongoose";

export interface IAuditActor {
  id?: string;
  name?: string;
  email?: string;
  role?: string;
}

export interface IAuditLog extends Document {
  action: string;
  resourceType: string;
  resourceId?: string;
  performedBy: IAuditActor;
  ip?: string | null;
  userAgent?: string | null;
  details?: Record<string, unknown> | null;
  outcome: "success" | "failure";
  severity?: "low" | "medium" | "high";
  tags?: string[];
  createdAt: Date;
}

const AuditLogSchema = new Schema<IAuditLog>({
  action: { type: String, required: true, index: true },
  resourceType: { type: String, required: true, index: true },
  resourceId: { type: String, required: false, index: true },
  performedBy: {
    id: { type: String },
    name: { type: String },
    email: { type: String, index: true },
    role: { type: String },
  },
  ip: { type: String, required: false },
  userAgent: { type: String, required: false },
  details: { type: Schema.Types.Mixed, required: false },
  outcome: { type: String, enum: ["success", "failure"], required: true },
  severity: { type: String, enum: ["low", "medium", "high"], default: "low" },
  tags: [{ type: String }],
  createdAt: { type: Date, default: Date.now, index: true },
});

export const AuditLogModel =
  mongoose.models.audit_logs ||
  mongoose.model<IAuditLog>("audit_logs", AuditLogSchema, "audit_logs");


