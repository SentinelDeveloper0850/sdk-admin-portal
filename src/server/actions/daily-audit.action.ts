"use server";

import { IDailyAudit, DailyAuditModel } from "@/app/models/hr/daily-audit.schema";
import { connectToDatabase } from "@/lib/db";

export interface ISubmissionData {
  submissionIdentifier: string;
  files: any[];
  date: string;
  submittedAmount: number;
  notes: string;
  submittedAt: string;
  userId: string;
  type: string;
}

export async function submitAuditData(data: ISubmissionData) {
  try {
    await connectToDatabase();

    const { submissionIdentifier, userId, date, ...currentSubmissionData } = data;

    const existingAudit = await DailyAuditModel.findOne({ submissionIdentifier: data.submissionIdentifier });

    if (existingAudit) {
      existingAudit.submissions.push(currentSubmissionData);
      existingAudit.totalAmount += currentSubmissionData.submittedAmount;
      await existingAudit.save();
      return { success: true, message: "Daily audit data submitted successfully" } as const;
    }
    
    const doc = new DailyAuditModel({ submissionIdentifier, userId, date, totalAmount: currentSubmissionData.submittedAmount, submissions: [currentSubmissionData] });
    await doc.save();
    return { success: true, message: "Daily audit data submitted successfully" } as const;
  } catch (error: any) {
    console.error("Failed to write daily audit data:", error?.message || error);
    return { success: false, message: "Failed to write daily audit data" } as const;
  }
}


