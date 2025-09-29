import { NextRequest, NextResponse } from "next/server";

import { getUserFromRequest } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";

import { AllocationRequestModel } from "@/app/models/hr/allocation-request.schema";
import { EasypayTransactionModel } from "@/app/models/scheme/easypay-transaction.schema";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const userRoles = [user.role, ...(user.roles || [])].filter(Boolean) as string[];
    const allowedRoles: string[] = ["admin", "easypay_reviewer", "easypay_allocator"];
    const hasAccess = userRoles.some((r) => allowedRoles.includes(r));
    if (!hasAccess) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { status, rejectionReason } = body || {};

    if (!status) {
      return NextResponse.json({ message: "Status is required" }, { status: 400 });
    }

    await connectToDatabase();

    const update: any = { status };
    if (rejectionReason) update.rejectionReason = rejectionReason;
    if (status === "APPROVED") {
      update.approvedBy = user._id;
      update.approvedAt = new Date();
      update.rejectedBy = undefined;
      update.rejectedAt = undefined;
      update.cancelledBy = undefined;
      update.cancelledAt = undefined;
    }
    if (status === "REJECTED") {
      if (!rejectionReason || String(rejectionReason).trim().length === 0) {
        return NextResponse.json({ message: "Rejection reason is required" }, { status: 400 });
      }
      update.rejectedBy = user._id;
      update.rejectedAt = new Date();
      update.approvedBy = undefined;
      update.approvedAt = undefined;
      update.cancelledBy = undefined;
      update.cancelledAt = undefined;
    }
    if (status === "CANCELLED") {
      update.cancelledBy = user._id;
      update.cancelledAt = new Date();
      update.approvedBy = undefined;
      update.approvedAt = undefined;
      update.rejectedBy = undefined;
      update.rejectedAt = undefined;
    }

    const result = await AllocationRequestModel.findByIdAndUpdate(id, update, { new: true });
    if (!result) {
      return NextResponse.json({ message: "Allocation request not found" }, { status: 404 });
    }

    return NextResponse.json({ item: result });
  } catch (error) {
    console.error("Error updating allocation request:", (error as Error).message);
    return NextResponse.json(
      { message: "Internal Server Error ~ update allocation request" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const userRoles = [user.role, ...(user.roles || [])].filter(Boolean) as string[];
    const allowedRoles: string[] = ["admin", "easypay_reviewer", "easypay_allocator"];
    const hasAccess = userRoles.some((r) => allowedRoles.includes(r));
    if (!hasAccess) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    await connectToDatabase();

    const requestDoc = await AllocationRequestModel
      .findById(id)
      .populate({ path: 'requestedBy', model: 'users', select: 'name email', options: { strictPopulate: false } })
      .populate({ path: 'approvedBy', model: 'users', select: 'name email', options: { strictPopulate: false } })
      .populate({ path: 'submittedBy', model: 'users', select: 'name email', options: { strictPopulate: false } })
      .populate({ path: 'rejectedBy', model: 'users', select: 'name email', options: { strictPopulate: false } })
      .populate({ path: 'cancelledBy', model: 'users', select: 'name email', options: { strictPopulate: false } });
    if (!requestDoc) {
      return NextResponse.json({ message: "Allocation request not found" }, { status: 404 });
    }

    const transaction = await EasypayTransactionModel.findById(requestDoc.transactionId);

    return NextResponse.json({ item: requestDoc, transaction });
  } catch (error) {
    console.error("Error fetching allocation request:", (error as Error).message);
    return NextResponse.json(
      { message: "Internal Server Error ~ get allocation request" },
      { status: 500 }
    );
  }
}


