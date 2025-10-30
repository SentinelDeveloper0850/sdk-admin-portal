import { NextResponse } from "next/server";

import { connectToDatabase } from "@/lib/db";
import { StaffMemberModel } from "@/app/models/staff-member.schema";
import { getUserFromRequest } from "@/lib/auth";
import { NextRequest } from "next/server";

export async function GET() {
  try {
    await connectToDatabase();

    const response = await StaffMemberModel.find();

    return NextResponse.json({ staffMembers: response }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || "Failed to fetch staff members" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();

    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    if (!payload.firstNames || !payload.initials || !payload.lastName || !payload.idNumber) {
      return NextResponse.json({ message: "First names, initials, last name, and ID number are required" }, { status: 400 });
    }

    // Check if staff member with same name already exists
    const existingStaffMember = await StaffMemberModel.findOne({ firstNames: payload.firstNames, initials: payload.initials, lastName: payload.lastName, idNumber: payload.idNumber });
    if (existingStaffMember) {
      return NextResponse.json({ message: "This staff member already exists" }, { status: 400 });
    }

    await connectToDatabase();

    const response = await StaffMemberModel.create({ ...payload, createdBy: user._id, updatedBy: user._id });

    return NextResponse.json({ message: "Staff member created successfully", staffMember: response }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || "Failed to create staff member" },
      { status: 500 }
    );
  }
}


export async function PUT(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const payload = await request.json();
    const { id, ...rest } = payload;

    if (!id) {
      return NextResponse.json({ message: "ID is required" }, { status: 400 });
    }

    await connectToDatabase();

    const response = await StaffMemberModel.findByIdAndUpdate(id, { ...rest, updatedBy: user._id }, { new: true });

    if (!response) {
      return NextResponse.json({ message: "Staff member not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Staff member updated successfully", staffMember: response }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || "Failed to update staff member" },
      { status: 500 }
    );
  }
}