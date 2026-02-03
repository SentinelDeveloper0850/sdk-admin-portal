import { NextRequest, NextResponse } from "next/server";

import { CashUpSubmissionModel } from "@/app/models/hr/cash-up-submission.schema";
import { getUserFromRequest } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const roles = [
      (user as any)?.role,
      ...(((user as any)?.roles as string[]) || []),
    ].filter(Boolean);
    const canReview = roles.includes("cashup_reviewer");
    if (!canReview) {
      return NextResponse.json(
        { success: false, message: "Forbidden" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const note = String(body?.notes || "").trim();
    if (!note) {
      return NextResponse.json(
        { success: false, message: "Notes are required" },
        { status: 400 }
      );
    }

    await connectToDatabase();
    const submission = await CashUpSubmissionModel.findById(id);
    if (!submission) {
      return NextResponse.json(
        { success: false, message: "Cash up submission not found" },
        { status: 404 }
      );
    }

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
      message: "Notes added successfully to cash up submission",
    });
  } catch (error) {
    console.error("Error adding notes to cash up submission:", error);
    return NextResponse.json(
      { success: false, message: "Failed to add notes to cash up submission" },
      { status: 500 }
    );
  }
}
