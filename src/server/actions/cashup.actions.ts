"use server";

import { CashUpSubmissionModel } from "@/app/models/hr/cash-up-submission.schema";
import { connectToDatabase } from "@/lib/db";
import mongoose from "mongoose";

export async function updateReceiptInSubmission({
    submissionId,
    receiptId,
    patch,
}: {
    submissionId: string;
    receiptId: string;
    patch: Record<string, any>;
}) {
    await connectToDatabase();

    if (!mongoose.Types.ObjectId.isValid(submissionId) || !mongoose.Types.ObjectId.isValid(receiptId)) {
        return { success: false, message: "Invalid ids" } as const;
    }

    const submission = await CashUpSubmissionModel.findById(submissionId);
    if (!submission) return { success: false, message: "Submission not found" } as const;

    if (!["draft", "needs_changes"].includes(String(submission.status || "").toLowerCase())) {
        return { success: false, message: "Submission is not editable" } as const;
    }

    const existing = submission.submissions.find((r: any) => r._id.toString() === receiptId);
    if (!existing) return { success: false, message: "Receipt not found" } as const;

    const oldAmount = Number(existing.submittedAmount || 0);
    const newAmount = Number(patch?.submittedAmount ?? oldAmount);
    const delta = newAmount - oldAmount;

    Object.assign(existing, patch, { submittedAmount: newAmount });
    submission.totalAmount = Number(submission.totalAmount || 0) + delta;

    await submission.save();

    return { success: true } as const;
}
