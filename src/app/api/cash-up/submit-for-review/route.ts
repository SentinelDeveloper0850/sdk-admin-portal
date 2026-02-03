// api/cash-up/submit-for-review/route.ts
import { NextRequest, NextResponse } from "next/server";

import dayjs from "dayjs";

import { CashUpAuditReportModel } from "@/app/models/hr/cash-up-audit-report.schema";
import { CashUpSubmissionModel } from "@/app/models/hr/cash-up-submission.schema";
import { NotificationModel } from "@/app/models/notification.schema";
import { getUserFromRequest } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { submissionId } = body;
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    await connectToDatabase();

    const submission = await CashUpSubmissionModel.findById(submissionId);
    if (!submission) {
      return NextResponse.json(
        { success: false, message: "Cash up submission not found" },
        { status: 404 }
      );
    }

    // Only owners can submit their own cashup
    const ownerId = String((submission as any).userId);
    if (ownerId !== String((user as any)._id)) {
      return NextResponse.json(
        { success: false, message: "Forbidden" },
        { status: 403 }
      );
    }

    const currentStatus = String((submission as any).status || "draft");
    if (!["draft", "needs_changes"].includes(currentStatus)) {
      return NextResponse.json(
        {
          success: false,
          message: `Cannot submit when status is '${currentStatus}'`,
        },
        { status: 400 }
      );
    }

    // Late submission: after 20:00 + 30min grace, on the submission date
    const submissionDate = dayjs((submission as any).date);
    const cutoff = submissionDate.hour(20).minute(0).second(0);
    const gracePeriod = cutoff.add(30, "minute");
    const isLate = dayjs().isAfter(gracePeriod);

    (submission as any).status =
      currentStatus === "needs_changes" ? "resolved" : "pending";
    (submission as any).isLateSubmission = isLate;
    (submission as any).submittedAt = new Date();
    (submission as any).submittedById = String((user as any)._id);
    (submission as any).submittedByName = String((user as any).name || "");
    await submission.save();

    // If an audit report was uploaded earlier for this user+date, auto-run the balance check now.
    try {
      const dateKey = new Date((submission as any).date)
        .toISOString()
        .slice(0, 10);
      const report = await CashUpAuditReportModel.findOne({
        userId: ownerId,
        dateKey,
      }).lean();
      if (report) {
        const cashupTotal = Number((submission as any).totalAmount ?? 0) || 0;
        const netTotal = Number((report as any).netTotal ?? 0) || 0;
        const delta = netTotal - cashupTotal;
        const balanced = Math.abs(delta) <= 0.01;

        (submission as any).auditReport = {
          fileUrl: (report as any).fileUrl ?? null,
          fileName: (report as any).fileName ?? null,
          incomeTotal: (report as any).incomeTotal ?? null,
          expenseTotal: (report as any).expenseTotal ?? null,
          netTotal,
          cashupTotal,
          delta,
          balanced,
          uploadedAt: (report as any).uploadedAt ?? null,
          uploadedById: (report as any).uploadedById ?? null,
          uploadedByName: (report as any).uploadedByName ?? null,
        };

        if (!balanced) {
          (submission as any).status = "needs_changes";
          (submission as any).reviewNotes = [
            ...(((submission as any).reviewNotes as string[]) || []),
            `[${new Date().toISOString()}] System: Existing audit report mismatch (expected net ${netTotal.toFixed(2)} vs cashup ${cashupTotal.toFixed(2)}, delta ${delta.toFixed(2)}). Submission sent back.`,
          ];
          // Best-effort notification (don't fail submission)
          try {
            await NotificationModel.create({
              recipientUserId: ownerId,
              actorUserId: null,
              type: "CASHUP_BALANCE_MISMATCH",
              title: "Cashup requires attention",
              message: `Your cashup does not balance against the audit report. Please review and resubmit.`,
              link: "/cash-up/dashboard",
              severity: "WARNING",
              data: {
                cashupSubmissionId: String((submission as any)._id),
                date: dateKey,
                audit: { netTotal, cashupTotal, delta },
              },
              readAt: null,
            });
          } catch (e) {
            console.error(
              "Failed to create cashup mismatch notification (auto-run):",
              e
            );
          }
        }

        await submission.save();
      }
    } catch (e) {
      console.error("Failed to auto-run audit report check:", e);
    }

    return NextResponse.json({
      success: true,
      message: "Cash up submission submitted for review",
    });
  } catch (error) {
    console.error("Error submitting cash up submission for review:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Error submitting cash up submission for review",
      },
      { status: 500 }
    );
  }
}
