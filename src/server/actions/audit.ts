"use server";

import { AuditLogModel, IAuditActor } from "@/app/models/system/audit-log.schema";
import { connectToDatabase } from "@/lib/db";

export type CreateAuditParams = {
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
};

export async function createAuditLog(entry: CreateAuditParams) {
  try {
    await connectToDatabase();
    const doc = new AuditLogModel({ ...entry });
    await doc.save();
    return { success: true } as const;
  } catch (error: any) {
    console.error("Failed to write audit log:", error?.message || error);
    return { success: false, message: "Failed to write audit log" } as const;
  }
}


