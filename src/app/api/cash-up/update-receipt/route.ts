import { CashUpSubmissionModel } from "@/app/models/hr/cash-up-submission.schema";
import { getUserFromRequest } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import mongoose from "mongoose";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    try {
        const user = await getUserFromRequest(req);
        if (!user) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });

        const body = await req.json();
        const { submissionId, receiptId, patch } = body || {};

        if (!mongoose.Types.ObjectId.isValid(submissionId) || !mongoose.Types.ObjectId.isValid(receiptId)) {
            return NextResponse.json({ success: false, message: "Invalid ids" }, { status: 400 });
        }

        await connectToDatabase();

        const submission = await CashUpSubmissionModel.findById(submissionId);
        if (!submission) return NextResponse.json({ success: false, message: "Submission not found" }, { status: 404 });

        // Only allow edits in these states
        if (!["draft", "needs_changes"].includes(String(submission.status || "").toLowerCase())) {
            return NextResponse.json({ success: false, message: "Submission is not editable" }, { status: 400 });
        }

        // Ownership/reviewer rules (tighten as you like)
        const isOwner = String(submission.userId) === String((user as any)._id);
        if (!isOwner) {
            return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
        }

        const existing = submission.submissions.find((r: any) => r._id.toString() === receiptId);
        if (!existing) return NextResponse.json({ success: false, message: "Receipt not found" }, { status: 404 });

        const oldAmount = Number(existing.submittedAmount || 0);
        const newAmount = Number(patch?.submittedAmount ?? oldAmount);

        const delta = newAmount - oldAmount;

        // Apply patch to the subdoc
        Object.assign(existing, {
            invoiceNumber: patch?.invoiceNumber ?? existing.invoiceNumber ?? null,
            paymentMethod: patch?.paymentMethod ?? existing.paymentMethod ?? null,
            submittedAmount: newAmount,
            cashAmount: patch?.cashAmount ?? existing.cashAmount ?? null,
            cardAmount: patch?.cardAmount ?? existing.cardAmount ?? null,
            bankDepositReference: patch?.bankDepositReference ?? existing.bankDepositReference ?? null,
            bankName: patch?.bankName ?? existing.bankName ?? null,
            depositorName: patch?.depositorName ?? existing.depositorName ?? null,
            receiptType: patch?.receiptType ?? existing.receiptType ?? null,
            notes: patch?.notes ?? existing.notes ?? null,
            // keep submittedAt as-is unless you explicitly want to bump it
        });

        submission.totalAmount = Number(submission.totalAmount || 0) + delta;

        await submission.save();

        return NextResponse.json({
            success: true,
            receipt: {
                _id: existing._id.toString(),
                invoiceNumber: existing.invoiceNumber ?? null,
                paymentMethod: existing.paymentMethod ?? null,
                submittedAmount: existing.submittedAmount ?? null,
                cashAmount: existing.cashAmount ?? null,
                cardAmount: existing.cardAmount ?? null,
                bankDepositReference: existing.bankDepositReference ?? null,
                bankName: existing.bankName ?? null,
                depositorName: existing.depositorName ?? null,
                receiptType: existing.receiptType ?? null,
                notes: existing.notes ?? null,
                submittedAt: existing.submittedAt ?? null,
                files: Array.isArray(existing.files) ? existing.files : [],
            },
            totalAmount: submission.totalAmount,
        });
    } catch (e: any) {
        console.error("update-receipt error:", e?.message || e);
        return NextResponse.json({ success: false, message: e?.message || "Failed to update receipt" }, { status: 500 });
    }
}
