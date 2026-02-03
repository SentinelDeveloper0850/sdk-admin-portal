// app/api/staff/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";

import { StaffMemberModel } from "@/app/models/staff-member.schema";
import { getUserFromRequest } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await connectToDatabase();

    const staffMember = await StaffMemberModel.findById(id).populate("user");
    if (!staffMember) {
      return NextResponse.json(
        { message: "Staff member not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ staffMember }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || "Failed to fetch staff member" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const payload = await request.json();

    await connectToDatabase();

    // Whitelist fields so nobody overwrites system fields
    const allowed: Record<string, any> = {};

    const setIf = (key: string) => {
      if (payload?.[key] !== undefined) allowed[key] = payload[key];
    };

    // Top-level fields
    [
      "firstNames",
      "initials",
      "lastName",
      "address",
      "contact",
      "employment",
      "user",
    ].forEach(setIf);

    // Identity (new schema)
    if (payload?.identity !== undefined) {
      const t = payload?.identity?.type;
      const n = payload?.identity?.number;
      const c = payload?.identity?.country;

      if (!t || !n) {
        return NextResponse.json(
          { message: "Identity type and number are required" },
          { status: 400 }
        );
      }

      if ((t === "PASSPORT" || t === "OTHER") && !c) {
        return NextResponse.json(
          { message: "Country is required for passports/other identity types" },
          { status: 400 }
        );
      }

      allowed.identity = {
        type: String(t).trim(),
        number: String(n).trim().toUpperCase(),
        country: c ? String(c).trim().toUpperCase() : undefined,
      };
    }

    // Prevent legacy fields creeping back in
    delete allowed.idNumber;
    delete allowed.passportNumber;
    delete allowed.userId;

    const updated = await StaffMemberModel.findByIdAndUpdate(
      id,
      { $set: { ...allowed, updatedBy: user._id } },
      { new: true, runValidators: true }
    ).populate("user");

    if (!updated) {
      return NextResponse.json(
        { message: "Staff member not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: "Staff member updated successfully", staffMember: updated },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || "Failed to update staff member" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    await connectToDatabase();

    const deleted = await StaffMemberModel.findByIdAndDelete(id);
    if (!deleted) {
      return NextResponse.json(
        { message: "Staff member not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: "Staff member deleted successfully" },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || "Failed to delete staff member" },
      { status: 500 }
    );
  }
}
