"use server";

import { CashUpSubmissionModel } from "@/app/models/hr/cash-up-submission.schema";
import { connectToDatabase } from "@/lib/db";

export interface ISubmissionData {
  submissionIdentifier: string;
  files: any[];
  date: string;
  invoiceNumber?: string;
  submittedAmount: number;
  paymentMethod?: "cash" | "card" | "both" | "bank_deposit";
  cashAmount?: number;
  cardAmount?: number;
  bankDepositReference?: string;
  bankName?: string;
  depositorName?: string;
  reasonForCashTransactions?: string;
  receiptType?: "policy" | "funeral" | "sales";
  notes: string;
  submittedAt: string;
  userId: string;
}

export async function submitCashUpSubmissionData(data: ISubmissionData) {
  try {
    await connectToDatabase();

    const { submissionIdentifier, userId, date, ...currentSubmissionData } =
      data;

    const existingAudit = await CashUpSubmissionModel.findOne({
      submissionIdentifier: data.submissionIdentifier,
    });

    if (existingAudit) {
      existingAudit.submissions.push(currentSubmissionData);
      existingAudit.totalAmount += currentSubmissionData.submittedAmount;
      await existingAudit.save();
      return {
        success: true,
        message: "Cash up submission data submitted successfully",
      } as const;
    }

    const doc = new CashUpSubmissionModel({
      submissionIdentifier,
      userId,
      date,
      totalAmount: currentSubmissionData.submittedAmount,
      submissions: [currentSubmissionData],
    });
    await doc.save();
    return {
      success: true,
      message: "Cash up submission data submitted successfully",
    } as const;
  } catch (error: any) {
    console.error(
      "Failed to write cash up submission data:",
      error?.message || error
    );
    return {
      success: false,
      message: "Failed to write cash up submission data",
    } as const;
  }
}
