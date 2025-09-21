import { NextRequest, NextResponse } from "next/server";

import { getUserFromRequest } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";

import { EAllocationRequestStatus } from "@/app/enums/hr/allocation-request-status.enum";
import { EasypayAllocationRequestModel } from "@/app/models/hr/easypay-allocation-request.schema";

export async function POST(request: NextRequest) {
    try {
        const user = await getUserFromRequest(request);
        if (!user) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const userRoles = [user.role, ...(user.roles || [])].filter(Boolean) as string[];
        const allowedRoles: string[] = ["admin", "eft_reviewer"];
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

        // Only transition APPROVED -> SUBMITTED and stamp by/at
        const res = await EasypayAllocationRequestModel.updateMany(
            { _id: { $in: ids }, status: EAllocationRequestStatus.APPROVED },
            { $set: { status: EAllocationRequestStatus.SUBMITTED, submittedBy: user._id, submittedAt: new Date() } }
        );

        return NextResponse.json({ updated: res.modifiedCount, matched: res.matchedCount });
    } catch (error) {
        console.error("Error submitting easypay allocation requests:", (error as Error).message);
        return NextResponse.json(
            { message: "Internal Server Error ~ submit easypay allocation requests" },
            { status: 500 }
        );
    }
}
