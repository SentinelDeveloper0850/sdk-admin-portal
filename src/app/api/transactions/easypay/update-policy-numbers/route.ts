import { updateTransactionPolicyNumbers } from "@/server/actions/easypay-transactions";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
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