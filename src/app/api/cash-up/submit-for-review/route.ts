// api/cash-up/submit-for-review/route.ts

import { CashUpSubmissionModel } from "@/app/models/hr/cash-up-submission.schema";
import { getUserFromRequest } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log("🚀 ~ POST ~ body:", body);
    const { submissionId } = body;
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });
    }
    const submission = await CashUpSubmissionModel.findById(submissionId);
    if (!submission) {
      return NextResponse.json({ success: false, message: "Cash up submission not found" }, { status: 404 });
    }
    submission.status = "pending";
    submission.submittedAt = new Date().toISOString();
    submission.submittedBy = user._id as unknown as string;
    submission.submittedById = user._id as unknown as string;
    submission.submittedByName = user.name as string;
    submission.submissionStatus = "submitted";
    await submission.save();
    return NextResponse.json({ success: true, message: "Cash up submission submitted for review" });
  } catch (error) {
    console.error("Error submitting cash up submission for review:", error);
    return NextResponse.json({ success: false, message: "Error submitting cash up submission for review" }, { status: 500 });
  }
}