// api/cash-up/submit-for-review/route.ts

import { CashUpSubmissionModel } from "@/app/models/hr/cash-up-submission.schema";
import { getUserFromRequest } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import dayjs from "dayjs";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { submissionId } = body;
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });
    }

    await connectToDatabase();

    const submission = await CashUpSubmissionModel.findById(submissionId);
    if (!submission) {
      return NextResponse.json({ success: false, message: "Cash up submission not found" }, { status: 404 });
    }

    // Only owners can submit their own cashup
    const ownerId = String((submission as any).userId);
    if (ownerId !== String((user as any)._id)) {
      return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
    }

    const currentStatus = String((submission as any).status || "draft");
    if (!["draft", "needs_changes"].includes(currentStatus)) {
      return NextResponse.json(
        { success: false, message: `Cannot submit when status is '${currentStatus}'` },
        { status: 400 }
      );
    }

    // Late submission: after 20:00 + 30min grace, on the submission date
    const submissionDate = dayjs((submission as any).date);
    const cutoff = submissionDate.hour(20).minute(0).second(0);
    const gracePeriod = cutoff.add(30, "minute");
    const isLate = dayjs().isAfter(gracePeriod);

    (submission as any).status = currentStatus === "needs_changes" ? "resolved" : "pending";
    (submission as any).isLateSubmission = isLate;
    (submission as any).submittedAt = new Date();
    (submission as any).submittedById = String((user as any)._id);
    (submission as any).submittedByName = String((user as any).name || "");
    await submission.save();
    return NextResponse.json({
      success: true,
      message: "Cash up submission submitted for review",
    });
  } catch (error) {
    console.error("Error submitting cash up submission for review:", error);
    return NextResponse.json({ success: false, message: "Error submitting cash up submission for review" }, { status: 500 });
  }
}