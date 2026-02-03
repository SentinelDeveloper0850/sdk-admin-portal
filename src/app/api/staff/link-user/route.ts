import { NextRequest, NextResponse } from "next/server";

// Optional but recommended: ensures user model is registered for populate
import { UserModel } from "@/app/models/hr/user.schema";
import { StaffMemberModel } from "@/app/models/staff-member.schema";
import { getUserFromRequest } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const payload = await request.json();
    const { staffMemberId, userId } = payload ?? {};

    if (!staffMemberId || !userId) {
      return NextResponse.json(
        { message: "Staff member ID and user ID are required" },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // (Optional) Validate the user exists
    const existingUser = await UserModel.findById(userId).select("_id");
    if (!existingUser) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    const updated = await StaffMemberModel.findByIdAndUpdate(
      staffMemberId,
      { $set: { user: userId, updatedBy: user._id } }, // <-- key change
      { new: true, runValidators: true }
    ).populate("user"); // nice for UI

    if (!updated) {
      return NextResponse.json(
        { message: "Staff member not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        message: "Staff member linked to user successfully",
        staffMember: updated,
        success: true,
      },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || "Failed to link staff member to user" },
      { status: 500 }
    );
  }
}
