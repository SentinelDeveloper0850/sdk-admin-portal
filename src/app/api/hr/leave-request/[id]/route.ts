import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { LeaveRequest } from "@/app/models/hr/leave-request.schema";

// GET /api/leave-request/:id
export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  await connectToDatabase();
  try {
    const request = await LeaveRequest.findById(params.id)
      .populate("employee")
      .populate("requestedBy")
      .populate("approvedBy");

    if (!request) {
      return NextResponse.json({ success: false, message: "Leave request not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: request });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

// PUT /api/leave-request/:id
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  await connectToDatabase();

  try {
    const updates = await req.json();
    const updated = await LeaveRequest.findByIdAndUpdate(params.id, updates, { new: true });

    return NextResponse.json({ success: true, data: updated });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 400 });
  }
}

// DELETE /api/leave-request/:id
export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  await connectToDatabase();

  try {
    await LeaveRequest.findByIdAndDelete(params.id);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
