import { NextRequest, NextResponse } from "next/server";

import { getUserFromRequest } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";

import { AllocationRequestModel } from "@/app/models/hr/allocation-request.schema";
import UserModel from "@/app/models/hr/user.schema";
import { QueryOptions } from "mongoose";

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
    const status = searchParams.get("status");
    const start = searchParams.get("start");
    const end = searchParams.get("end");
    const requester = searchParams.get("requester"); // name/email text filter

    const query: Record<string, any> = {
      type: "EFT",
    };
    if (status) query.status = status;
    if (start || end) {
      query.createdAt = {};
      if (start) query.createdAt.$gte = new Date(start);
      if (end) query.createdAt.$lte = new Date(end);
    }

    if (requester) {
      // Find users whose name/email matches; then filter by their ids
      const rx = new RegExp(requester, "i");
      const users = await UserModel.find({ $or: [{ name: rx }, { email: rx }] }, { _id: 1 });
      const ids = users.map((u) => u._id);
      // If no matches, make sure query returns empty
      query.requestedBy = ids.length ? { $in: ids } : null;
      if (query.requestedBy === null) {
        return NextResponse.json({ items: [], pagination: { page, limit, total: 0 } });
      }
    }

    const projection = {
      transactionId: 1,
      transactionModel: 1,
      type: 1,
      policyNumber: 1,
      easypayNumber: 1,
      notes: 1,
      evidence: 1,
      status: 1,
      createdAt: 1,
      updatedAt: 1,
    };

    const options: QueryOptions = {
      lean: true, sort: { createdAt: -1 }, skip, limit, strictPopulate: false
    };

    const [items, total] = await Promise.all([
      AllocationRequestModel.find(query, projection, options)
        .populate({ path: "transaction", options: { strictPopulate: false } }) // gets EFT or Easypay
        .populate({ path: 'requestedBy', model: 'users', select: 'name email', options: { strictPopulate: false } })
        .populate({ path: 'approvedBy', model: 'users', select: 'name email', options: { strictPopulate: false } })
        .populate({ path: 'submittedBy', model: 'users', select: 'name email', options: { strictPopulate: false } })
        .populate({ path: 'rejectedBy', model: 'users', select: 'name email', options: { strictPopulate: false } })
        .populate({ path: 'cancelledBy', model: 'users', select: 'name email', options: { strictPopulate: false } })
        .lean(),
      AllocationRequestModel.countDocuments(query),
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


