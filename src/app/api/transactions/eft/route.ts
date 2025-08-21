import { NextRequest, NextResponse } from "next/server";

import { getUserFromRequest } from "@/lib/auth";
import { createAuditLog } from "@/server/actions/audit";
import {
  fetchAll,
  importFromBankStatement,
  importFromTransactionHistory,
} from "@/server/actions/eft-transactions";

export async function GET(_request: Request) {
  try {
    const response = await fetchAll(1000); // Keep 1000 limit for performance

    if (response.success) {
      return NextResponse.json(response.data, { status: 200 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error("Error fetching transactions:", error.message);
    return NextResponse.json(
      { message: "Internal Server Error ~ Error fetching transactions" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const payload = await request.json();
    console.log("🚀 ~ POST ~ payload:", payload);

    let response;

    if (payload.source == "Transaction History") {
      response = await importFromTransactionHistory(payload);
    } else {
      response = await importFromBankStatement(payload);
    }

    // Audit log
    try {
      const user = await getUserFromRequest(request);
      const ipHeader = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip");
      const ip = (ipHeader ? ipHeader.split(",")[0].trim() : null) as string | null;
      const userAgent = request.headers.get("user-agent") || null;

      await createAuditLog({
        action:
          payload.source == "Transaction History"
            ? "eft.import.transaction-history"
            : "eft.import.bank-statement",
        resourceType: "eft-import",
        resourceId: payload?.importData?.uuid || payload?.uuid,
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
          source: payload?.source,
          transactionsCount: Array.isArray(payload?.transactions)
            ? payload.transactions.length
            : undefined,
          importData: payload?.importData,
        },
        outcome: response?.success ? "success" : "failure",
        severity: "high",
        tags: ["import"],
      });
    } catch (e) {
      console.error("Failed to write audit log for EFT import:", (e as any)?.message);
    }

    if (response?.success) {
      return NextResponse.json(response, { status: 200 });
    }

    return NextResponse.json(
      { message: "Internal Server Error ~ Error importing transactions" },
      { status: 500 }
    );

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error("Error importing transactions:", error.message);
    return NextResponse.json(
      { message: "Internal Server Error ~ Error importing transactions" },
      { status: 500 }
    );
  }
}
