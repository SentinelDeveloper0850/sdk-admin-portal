import { NextRequest, NextResponse } from "next/server";

import { getUserFromRequest } from "@/lib/auth";
import { createAuditLog } from "@/server/actions/audit";
import {
  fetchAll,
  importTransactions,
} from "@/server/actions/easypay-transactions";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '50');

    const response = await fetchAll(pageSize, page);

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

    const response = await importTransactions(payload);

    // Audit log
    try {
      const user = await getUserFromRequest(request);
      const ipHeader = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip");
      const ip = (ipHeader ? ipHeader.split(",")[0].trim() : null) as string | null;
      const userAgent = request.headers.get("user-agent") || null;

      await createAuditLog({
        action: "easypay.import",
        resourceType: "easypay-import",
        resourceId: payload?.uuid,
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
          transactionsCount: Array.isArray(payload?.transactions)
            ? payload.transactions.length
            : undefined,
          statementMonth: payload?.statementMonth,
        },
        outcome: response?.success ? "success" : "failure",
        severity: "high",
        tags: ["import"],
      });
    } catch (e) {
      console.error("Failed to write audit log for Easypay import:", (e as any)?.message);
    }

    if (response.success) {
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
