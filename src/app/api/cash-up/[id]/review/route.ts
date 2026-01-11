import { CashUpSubmissionModel } from "@/app/models/hr/cash-up-submission.schema";
import { getUserFromRequest } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

type ReviewDecision = "approve" | "reject" | "send_back";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const roles = [(user as any)?.role, ...(((user as any)?.roles as string[]) || [])].filter(Boolean);
    const canReview = roles.includes("admin") || roles.includes("cashup_reviewer");
    if (!canReview) {
      return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const decision = String(body?.decision || "") as ReviewDecision;
    const note = String(body?.note || "").trim();

    if (!["approve", "reject", "send_back"].includes(decision)) {
      return NextResponse.json({ success: false, message: "Invalid decision" }, { status: 400 });
    }
    if (!note) {
      return NextResponse.json({ success: false, message: "Review note is required" }, { status: 400 });
    }

    await connectToDatabase();
    const submission = await CashUpSubmissionModel.findById(id);
    if (!submission) {
      return NextResponse.json({ success: false, message: "Cash up submission not found" }, { status: 404 });
    }

    const nextStatus =
      decision === "approve" ? "approved" :
      decision === "reject" ? "rejected" :
      "needs_changes";

    (submission as any).status = nextStatus;
    (submission as any).reviewedAt = new Date();
    (submission as any).reviewedById = String((user as any)._id);
    (submission as any).reviewedByName = String((user as any).name || "");
    (submission as any).reviewNotes = [
      ...(((submission as any).reviewNotes as string[]) || []),
      `[${new Date().toISOString()}] ${String((user as any).name || (user as any)._id)}: ${note}`,
    ];

    await submission.save();

    return NextResponse.json({
      success: true,
      message: `Cash up submission ${nextStatus.replace("_", " ")}`,
    });
  } catch (error) {
    console.error("Error reviewing cash up submission:", error);
    return NextResponse.json({ success: false, message: "Failed to review cash up submission" }, { status: 500 });
  }
}

