import { NextRequest, NextResponse } from "next/server";

import { getUserFromRequest } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";

import { EAllocationRequestStatus } from "@/app/enums/hr/allocation-request-status.enum";
import { AllocationRequestModel } from "@/app/models/hr/allocation-request.schema";

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const userRoles = [user.role, ...(user.roles || [])].filter(Boolean) as string[];
    const allowedRoles: string[] = ["admin", "eft_allocator"]; // Allocators only (and admin)
    const hasAccess = userRoles.some((r) => allowedRoles.includes(r));
    if (!hasAccess) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    await connectToDatabase();

    const body = await request.json();
    const ids: string[] = body?.ids || [];
    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ message: "No request ids provided" }, { status: 400 });
    }

    // Only transition SUBMITTED -> ALLOCATED and stamp by/at
    const res = await AllocationRequestModel.updateMany(
      { _id: { $in: ids }, status: EAllocationRequestStatus.SUBMITTED },
      { $set: { status: EAllocationRequestStatus.ALLOCATED, allocatedBy: user._id, allocatedAt: new Date() } }
    );

    return NextResponse.json({ updated: res.modifiedCount, matched: res.matchedCount });
  } catch (error) {
    console.error("Error allocating requests:", (error as Error).message);
    return NextResponse.json(
      { message: "Internal Server Error ~ allocate requests" },
      { status: 500 }
    );
  }
}


