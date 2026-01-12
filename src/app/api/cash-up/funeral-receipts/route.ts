import { getUserFromRequest } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    // Handle JSON submission
    const body = await request.json();

    const {
      submissionIdSuffix,
      files,
      date,
      submittedAmount,
      notes,
      submittedAt,
      paymentMethod,
      cashAmount,
      cardAmount,
      bankDepositReference,
      bankName,
      depositorName,
    } = body;

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

    const pm = String(paymentMethod || "").toLowerCase();
    if (!["cash", "card", "both", "bank_deposit"].includes(pm)) {
      return NextResponse.json(
        { success: false, message: "Payment method is required (cash, card, both, or bank deposit)" },
        { status: 400 }
      );
    }

    const submitted = Number(submittedAmount);
    if (!Number.isFinite(submitted) || submitted < 0) {
      return NextResponse.json(
        { success: false, message: "Submitted amount must be a valid number" },
        { status: 400 }
      );
    }

    if (pm === "both") {
      const cash = Number(cashAmount);
      const card = Number(cardAmount);
      if (!Number.isFinite(cash) || !Number.isFinite(card)) {
        return NextResponse.json(
          { success: false, message: "Cash and card amounts are required when payment method is both" },
          { status: 400 }
        );
      }
      if (cash < 0 || card < 0) {
        return NextResponse.json(
          { success: false, message: "Cash/card amounts cannot be negative" },
          { status: 400 }
        );
      }
      if (Math.round((cash + card) * 100) !== Math.round(submitted * 100)) {
        return NextResponse.json(
          { success: false, message: "Cash + card must equal the submitted amount" },
          { status: 400 }
        );
      }
    }

    if (pm === "bank_deposit") {
      const ref = String(bankDepositReference || "").trim();
      if (!ref) {
        return NextResponse.json(
          { success: false, message: "Bank deposit reference is required" },
          { status: 400 }
        );
      }
    }

    const submissionIdentifier = `${user._id}-${submissionIdSuffix}`;

    const { submitCashUpSubmissionData } = await import("@/server/actions/cash-up-submission.action");
    const { success, message } = await submitCashUpSubmissionData({
      submissionIdentifier,
      files,
      date,
      submittedAmount: submitted,
      paymentMethod: pm as "cash" | "card" | "both" | "bank_deposit",
      cashAmount: pm === "both" ? Number(cashAmount) : pm === "cash" ? submitted : undefined,
      cardAmount: pm === "both" ? Number(cardAmount) : pm === "card" ? submitted : undefined,
      bankDepositReference: pm === "bank_deposit" ? String(bankDepositReference || "").trim() : undefined,
      bankName: pm === "bank_deposit" ? String(bankName || "").trim() : undefined,
      depositorName: pm === "bank_deposit" ? String(depositorName || "").trim() : undefined,
      notes,
      submittedAt,
      userId: user._id as unknown as string
    });

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