import { NextRequest, NextResponse } from "next/server";

import { getUserFromRequest } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";

import { EAllocationRequestStatus } from "@/app/enums/hr/allocation-request-status.enum";
import { EasypayAllocationRequestModel } from "@/app/models/hr/easypay-allocation-request.schema";
import { EasypayTransactionModel } from "@/app/models/scheme/easypay-transaction.schema";

export async function GET(request: NextRequest) {
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

        const { searchParams } = new URL(request.url);
        const status = searchParams.get("status") || "PENDING";
        const start = searchParams.get("start");
        const end = searchParams.get("end");
        const requester = searchParams.get("requester");

        const query: any = { status };

        if (start || end) {
            query.createdAt = {};
            if (start) query.createdAt.$gte = new Date(start);
            if (end) query.createdAt.$lte = new Date(end);
        }

        if (requester) {
            query.$or = [
                { "requestedBy.name": { $regex: requester, $options: "i" } },
                { "requestedBy.email": { $regex: requester, $options: "i" } },
            ];
        }

        const items = await EasypayAllocationRequestModel.find(query)
            .populate("requestedBy", "name email")
            .populate("approvedBy", "name email")
            .populate("rejectedBy", "name email")
            .populate("submittedBy", "name email")
            .populate("allocatedBy", "name email")
            .populate("markedAsDuplicateBy", "name email")
            .sort({ createdAt: -1 });

        return NextResponse.json({ items });
    } catch (error) {
        console.error("Error fetching easypay allocation requests:", (error as Error).message);
        return NextResponse.json(
            { message: "Internal Server Error ~ fetch easypay allocation requests" },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const user = await getUserFromRequest(request);
        if (!user) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        await connectToDatabase();

        const body = await request.json();
        const { transactionId, easypayNumber, policyNumber, notes, evidence } = body;

        if (!transactionId || !easypayNumber || !notes || !evidence) {
            return NextResponse.json(
                { message: "Missing required fields" },
                { status: 400 }
            );
        }

        // Verify transaction exists
        const transaction = await EasypayTransactionModel.findById(transactionId);
        if (!transaction) {
            return NextResponse.json(
                { message: "Transaction not found" },
                { status: 404 }
            );
        }

        // Check if allocation request already exists for this transaction
        const existingRequest = await EasypayAllocationRequestModel.findOne({
            transactionId,
            status: { $nin: [EAllocationRequestStatus.REJECTED, EAllocationRequestStatus.CANCELLED] }
        });

        if (existingRequest) {
            return NextResponse.json(
                { message: "Allocation request already exists for this transaction" },
                { status: 409 }
            );
        }

        const allocationRequest = new EasypayAllocationRequestModel({
            transactionId,
            easypayNumber,
            policyNumber,
            notes,
            evidence,
            status: EAllocationRequestStatus.PENDING,
            requestedBy: user._id,
            requestedAt: new Date(),
        });

        await allocationRequest.save();

        return NextResponse.json({
            message: "Allocation request created successfully",
            request: allocationRequest
        });
    } catch (error) {
        console.error("Error creating easypay allocation request:", (error as Error).message);
        return NextResponse.json(
            { message: "Internal Server Error ~ create easypay allocation request" },
            { status: 500 }
        );
    }
}
