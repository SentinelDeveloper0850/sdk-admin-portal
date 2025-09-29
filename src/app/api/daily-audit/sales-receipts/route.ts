import { getUserFromRequest } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    // Handle JSON submission
    const body = await request.json();

    const { submissionIdSuffix, files, date, submittedAmount, notes, submittedAt } = body;

    // Get user from auth-token in request cookie
    const user = await getUserFromRequest(request);

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    // Validate required fields
    if (!date || submittedAmount === undefined || !submissionIdSuffix || !files) {
      return NextResponse.json(
        { success: false, message: "Missing required fields" },
        { status: 400 }
      );
    }

    const submissionIdentifier = `${user._id}-${submissionIdSuffix}`;

    const { submitAuditData } = await import("@/server/actions/daily-audit.action");
    const { success, message } = await submitAuditData({ submissionIdentifier, files, date, submittedAmount, notes, submittedAt, userId: user._id as unknown as string });

    if (!success) {
      return NextResponse.json(
        { success: false, message: message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: message,
    });
  } catch (error) {
    console.error("Error processing receipt upload:", error);
    return NextResponse.json(
      { success: false, message: "Failed to process receipt upload" },
      { status: 500 }
    );
  }
} 