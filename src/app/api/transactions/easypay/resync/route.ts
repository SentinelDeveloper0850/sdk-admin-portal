import { NextRequest, NextResponse } from "next/server";

import { getUserFromRequest } from "@/lib/auth";
import { createAuditLog } from "@/server/actions/audit";
import {
  fetchToSync,
  syncPolicyNumbers,
} from "@/server/actions/easypay-transactions";

export async function POST(request: NextRequest) {
  try {
    const response = await syncPolicyNumbers(true);

    // Audit log
    try {
      const user = await getUserFromRequest(request);
      const ipHeader = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip");
      const ip = (ipHeader ? ipHeader.split(",")[0].trim() : null) as string | null;
      const userAgent = request.headers.get("user-agent") || null;

      await createAuditLog({
        action: "easypay.resync-policy-numbers",
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
          message: response?.message,
        },
        outcome: response?.success ? "success" : "failure",
        severity: "medium",
        tags: ["sync"],
      });
    } catch (e) {
      console.error("Failed to write audit log for Easypay sync:", (e as any)?.message);
    }

    if (response.success) {
      return NextResponse.json({ status: 200, response });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error("Error syncing transactions:", error.message);
    return NextResponse.json(
      { message: "Internal Server Error ~ Error syncing transactions" },
      { status: 500 }
    );
  }
}
