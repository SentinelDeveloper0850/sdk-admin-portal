import { NextRequest, NextResponse } from "next/server";

import { getUserFromRequest } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";

import { AllocationRequestModel } from "@/app/models/hr/allocation-request.schema";

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const allowedRoles: string[] = [
      "admin",
      "eft_reviewer",
      "eft_allocator",
    ];
    const userRoles = [user.role, ...(user.roles || [])].filter(Boolean) as string[];
    const hasAccess = userRoles.some((r) => allowedRoles.includes(r));
    if (!hasAccess) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const page = Number(searchParams.get("page") || 1);
    const limit = Math.min(Number(searchParams.get("limit") || 20), 100);
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      AllocationRequestModel.find({}, {
        transactionId: 1,
        policyNumber: 1,
        notes: 1,
        evidence: 1,
        status: 1,
        requestedBy: 1,
        createdAt: 1,
        updatedAt: 1,
      })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      AllocationRequestModel.countDocuments({}),
    ]);

    return NextResponse.json({
      items,
      pagination: {
        page,
        limit,
        total,
      },
    });
  } catch (error) {
    console.error("Error listing allocation requests:", (error as Error).message);
    return NextResponse.json(
      { message: "Internal Server Error ~ list allocation requests" },
      { status: 500 }
    );
  }
}


