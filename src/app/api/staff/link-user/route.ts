import { NextResponse } from "next/server";

import { connectToDatabase } from "@/lib/db";
import { StaffMemberModel } from "@/app/models/staff-member.schema";
import { getUserFromRequest } from "@/lib/auth";
import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();

    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    if (!payload.staffMemberId || !payload.userId) {
      return NextResponse.json({ message: "Staff member ID and user ID are required" }, { status: 400 });
    }

    await connectToDatabase();

    const response = await StaffMemberModel.findByIdAndUpdate(payload.staffMemberId, { userId: payload.userId, updatedBy: user._id }, { new: true });

    return NextResponse.json({ message: "Staff member linked to user successfully", staffMember: response, success: true }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || "Failed to link staff member to user" },
      { status: 500 }
    );
  }
}