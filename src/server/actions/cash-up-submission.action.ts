"use server";

import { CashUpSubmissionModel } from "@/app/models/hr/cash-up-submission.schema";
import { connectToDatabase } from "@/lib/db";
import mongoose from "mongoose";

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

// Delete receipt from a submission
export async function deleteReceiptFromSubmission(submissionId: string, receiptId: string) {
  try {
    await connectToDatabase();

    if (!mongoose.Types.ObjectId.isValid(submissionId)) {
      return { success: false, message: "Invalid submissionId" } as const;
    }
    if (!mongoose.Types.ObjectId.isValid(receiptId)) {
      return { success: false, message: "Invalid receiptId" } as const;
    }

    // First fetch the receipt amount (we need it for $inc)
    const submission = await CashUpSubmissionModel.findById(submissionId).select("submissions totalAmount");
    if (!submission) return { success: false, message: "Submission not found" } as const;

    const receipt = submission.submissions.find((r: any) => r._id.toString() === receiptId);
    if (!receipt) return { success: false, message: "Receipt not found" } as const;

    submission.totalAmount -= Number(receipt.submittedAmount || 0);

    submission.submissions = submission.submissions.filter(
      (r: any) => r._id.toString() !== receiptId
    );

    await submission.save();

    return { success: true, message: "Receipt deleted successfully", submission } as const;
  } catch (error: any) {
    console.error("Failed to delete receipt from submission:", error?.message || error);
    return { success: false, message: "Failed to delete receipt from submission" } as const;
  }
}