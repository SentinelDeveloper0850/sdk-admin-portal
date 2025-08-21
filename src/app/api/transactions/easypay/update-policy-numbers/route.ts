import { getUserFromRequest } from "@/lib/auth";
import { createAuditLog } from "@/server/actions/audit";
import { updateTransactionPolicyNumbers } from "@/server/actions/easypay-transactions";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();
    const { transactions } = payload;

    if (!transactions || !Array.isArray(transactions)) {
      return NextResponse.json(
        { message: "Invalid request: transactions array is required" },
        { status: 400 }
      );
    }

    const response = await updateTransactionPolicyNumbers(transactions);

    // Audit log
    try {
      const user = await getUserFromRequest(request);
      const ipHeader = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip");
      const ip = (ipHeader ? ipHeader.split(",")[0].trim() : null) as string | null;
      const userAgent = request.headers.get("user-agent") || null;

      await createAuditLog({
        action: "easypay.update-policy-numbers",
        resourceType: "easypay-transaction",
        performedBy: user
          ? {
            id: user._id?.toString?.(),
            name: (user as any).name,
            email: (user as any).email,
            role: (user as any).role,
          }
          : {},
        ip,
        userAgent,
        details: {
          attempted: Array.isArray(transactions) ? transactions.length : undefined,
          updatedCount: (response as any)?.data?.updatedCount,
        },
        outcome: response?.success ? "success" : "failure",
        severity: "medium",
        tags: ["bulk-update"],
      });
    } catch (e) {
      console.error("Failed to write audit log for Easypay update-policy-numbers:", (e as any)?.message);
    }

    if (response?.success) {
      return NextResponse.json({
        success: true,
        data: response.data,
        message: `Successfully updated ${response?.data?.updatedCount || 0} transactions`
      }, { status: 200 });
    } else {
      return NextResponse.json(
        { message: response.message || "Failed to update transactions" },
        { status: 500 }
      );
    }

  } catch (error: any) {
    console.error("Error updating transaction policy numbers:", error.message);
    return NextResponse.json(
      { message: "Internal Server Error ~ Error updating transaction policy numbers" },
      { status: 500 }
    );
  }
} 