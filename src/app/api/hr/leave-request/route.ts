import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { LeaveRequest } from "@/app/models/hr/leave-request.schema";

// POST /api/leave-request
export async function POST(req: NextRequest) {
  await connectToDatabase();

  try {
    const body = await req.json();
    const leaveRequest = await LeaveRequest.create(body);

    return NextResponse.json({ success: true, data: leaveRequest }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 400 });
  }
}

// GET /api/leave-request
export async function GET() {
  await connectToDatabase();

  try {
    const requests = await LeaveRequest.find()
      .populate("employee")
      .populate("requestedBy")
      .populate("approvedBy")
      .sort({ createdAt: -1 });

    return NextResponse.json({ success: true, data: requests });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
