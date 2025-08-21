import { NextRequest, NextResponse } from "next/server";

import { getUserFromRequest } from "@/lib/auth";
import { createAuditLog } from "@/server/actions/audit";
import { reverseImport } from "@/server/actions/eft-transactions";

export async function POST(request: NextRequest) {
  try {
    const { uuid } = await request.json();
    if (!uuid) {
      return NextResponse.json(
        { message: "Missing uuid" },
        { status: 400 }
      );
    }

    // Authenticate user
    const user = await getUserFromRequest(request);
    const ipHeader = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip");
    const ip = (ipHeader ? ipHeader.split(",")[0].trim() : null) as string | null;
    const userAgent = request.headers.get("user-agent") || null;

    if (!user) {
      // Audit failed attempt (unauthenticated)
      await createAuditLog({
        action: "eft.reverse",
        resourceType: "eft-import",
        resourceId: uuid,
        performedBy: {},
        ip,
        userAgent,
        details: { reason: "unauthorized" },
        outcome: "failure",
        severity: "high",
        tags: ["security", "destructive"],
      });
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    if ((user as any).role !== "admin") {
      await createAuditLog({
        action: "eft.reverse",
        resourceType: "eft-import",
        resourceId: uuid,
        performedBy: {
          id: user._id?.toString?.(),
          name: (user as any).name,
          email: (user as any).email,
          role: (user as any).role,
        },
        ip,
        userAgent,
        details: { reason: "forbidden - requires admin" },
        outcome: "failure",
        severity: "high",
        tags: ["security", "authorization", "destructive"],
      });
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const result = await reverseImport(uuid);

    // Write audit log
    await createAuditLog({
      action: "eft.reverse",
      resourceType: "eft-import",
      resourceId: uuid,
      performedBy: {
        id: user._id?.toString?.(),
        name: (user as any).name,
        email: (user as any).email,
        role: (user as any).role,
      },
      ip,
      userAgent,
      details: {
        deletedTransactions: (result as any)?.deletedTransactions,
        deletedImport: (result as any)?.deletedImport,
      },
      outcome: result.success ? "success" : "failure",
      severity: result.success ? "high" : "high",
      tags: ["destructive"],
    });

    return NextResponse.json(result, { status: result.success ? 200 : 400 });
  } catch (error: any) {
    console.error("Error reversing import:", error?.message);
    return NextResponse.json(
      { message: "Internal Server Error ~ Error reversing import" },
      { status: 500 }
    );
  }
}


