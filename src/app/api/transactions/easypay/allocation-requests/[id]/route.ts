import { NextRequest, NextResponse } from "next/server";

import { getUserFromRequest } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";

import { EAllocationRequestStatus } from "@/app/enums/hr/allocation-request-status.enum";
import { EasypayAllocationRequestModel } from "@/app/models/hr/easypay-allocation-request.schema";
import { EasypayTransactionModel } from "@/app/models/scheme/easypay-transaction.schema";

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const user = await getUserFromRequest(request);
        if (!user) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const userRoles = [user.role, ...(user.roles || [])].filter(Boolean) as string[];
        const allowedRoles: string[] = ["admin", "eft_reviewer", "eft_allocator"];
        const hasAccess = userRoles.some((r) => allowedRoles.includes(r));
        if (!hasAccess) {
            return NextResponse.json({ message: "Forbidden" }, { status: 403 });
        }

        await connectToDatabase();

        const item = await EasypayAllocationRequestModel.findById(params.id)
            .populate("requestedBy", "name email")
            .populate("approvedBy", "name email")
            .populate("rejectedBy", "name email")
            .populate("submittedBy", "name email")
            .populate("allocatedBy", "name email")
            .populate("markedAsDuplicateBy", "name email");

        if (!item) {
            return NextResponse.json({ message: "Request not found" }, { status: 404 });
        }

        const transaction = await EasypayTransactionModel.findById(item.transactionId);

        return NextResponse.json({ item, transaction });
    } catch (error) {
        console.error("Error fetching easypay allocation request:", (error as Error).message);
        return NextResponse.json(
            { message: "Internal Server Error ~ fetch easypay allocation request" },
            { status: 500 }
        );
    }
}

export async function PATCH(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const user = await getUserFromRequest(request);
        if (!user) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const userRoles = [user.role, ...(user.roles || [])].filter(Boolean) as string[];
        const allowedRoles: string[] = ["admin", "eft_reviewer", "eft_allocator"];
        const hasAccess = userRoles.some((r) => allowedRoles.includes(r));
        if (!hasAccess) {
            return NextResponse.json({ message: "Forbidden" }, { status: 403 });
        }

        await connectToDatabase();

        const body = await request.json();
        const { status, rejectionReason } = body;

        const updateData: any = { status };

        switch (status) {
            case EAllocationRequestStatus.APPROVED:
                updateData.approvedBy = user._id;
                updateData.approvedAt = new Date();
                break;
            case EAllocationRequestStatus.REJECTED:
                updateData.rejectedBy = user._id;
                updateData.rejectedAt = new Date();
                if (rejectionReason) updateData.rejectionReason = rejectionReason;
                break;
            case EAllocationRequestStatus.CANCELLED:
                updateData.cancelledBy = user._id;
                updateData.cancelledAt = new Date();
                break;
        }

        const item = await EasypayAllocationRequestModel.findByIdAndUpdate(
            params.id,
            updateData,
            { new: true }
        ).populate("requestedBy", "name email");

        if (!item) {
            return NextResponse.json({ message: "Request not found" }, { status: 404 });
        }

        return NextResponse.json({ message: "Request updated successfully", item });
    } catch (error) {
        console.error("Error updating easypay allocation request:", (error as Error).message);
        return NextResponse.json(
            { message: "Internal Server Error ~ update easypay allocation request" },
            { status: 500 }
        );
    }
}
