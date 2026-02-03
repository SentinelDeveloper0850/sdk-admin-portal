import { NextRequest, NextResponse } from "next/server";

import { CashUpSubmissionModel } from "@/app/models/hr/cash-up-submission.schema";
import { getUserFromRequest } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";

export async function PUT(
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

    await connectToDatabase();
    const submission = await CashUpSubmissionModel.findById(id);
    if (!submission) {
      return NextResponse.json(
        { success: false, message: "Cash up submission not found" },
        { status: 404 }
      );
    }

    // "Resolve" here is owner-focused: after being sent back, mark resolved for re-review.
    const ownerId = String((submission as any).userId);
    if (ownerId !== String((user as any)._id)) {
      return NextResponse.json(
        { success: false, message: "Forbidden" },
        { status: 403 }
      );
    }

    const currentStatus = String((submission as any).status || "draft");
    if (currentStatus !== "needs_changes") {
      return NextResponse.json(
        {
          success: false,
          message: `Cannot resolve when status is '${currentStatus}'`,
        },
        { status: 400 }
      );
    }

    const body = await request.json();
    const note = String(body?.resolutionNotes || "").trim();

    (submission as any).status = "resolved";
    if (note) {
      (submission as any).reviewNotes = [
        ...(((submission as any).reviewNotes as string[]) || []),
        `[${new Date().toISOString()}] ${String((user as any).name || (user as any)._id)} (resolved): ${note}`,
      ];
    }
    await submission.save();

    return NextResponse.json({
      success: true,
      message: "Cash up submission marked as resolved",
    });
  } catch (error) {
    console.error("Error resolving cash up submission:", error);
    return NextResponse.json(
      { success: false, message: "Failed to resolve cash up submission" },
      { status: 500 }
    );
  }
}
