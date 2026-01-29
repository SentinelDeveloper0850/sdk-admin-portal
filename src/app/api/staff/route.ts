import { StaffMemberModel } from "@/app/models/staff-member.schema"
import { getUserFromRequest } from "@/lib/auth"
import { connectToDatabase } from "@/lib/db"
import { NextRequest, NextResponse } from "next/server"

export async function GET() {
  try {
    await connectToDatabase()
    const staffMembers = await StaffMemberModel.find().populate("user")
    return NextResponse.json({ staffMembers }, { status: 200 })
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || "Failed to fetch staff members" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 })

    await connectToDatabase()

    const payload = await request.json()

    if (!payload.firstNames || !payload.initials || !payload.lastName) {
      return NextResponse.json(
        { message: "First names, initials, and last name are required" },
        { status: 400 }
      )
    }

    const identityType = payload?.identity?.type
    const identityNumber = payload?.identity?.number
    const identityCountry = payload?.identity?.country

    if (!identityType || !identityNumber) {
      return NextResponse.json(
        { message: "Identity type and number are required" },
        { status: 400 }
      )
    }

    if ((identityType === "PASSPORT" || identityType === "OTHER") && !identityCountry) {
      return NextResponse.json(
        { message: "Country is required for passports/other identity types" },
        { status: 400 }
      )
    }

    const normalized = {
      type: String(identityType).trim(),
      number: String(identityNumber).trim().toUpperCase(),
      country: identityCountry ? String(identityCountry).trim().toUpperCase() : undefined,
    }

    const existing = await StaffMemberModel.findOne({
      "identity.type": normalized.type,
      "identity.number": normalized.number,
      "identity.country": normalized.country,
    })

    if (existing) {
      return NextResponse.json({ message: "This staff member identity already exists" }, { status: 400 })
    }

    const created = await StaffMemberModel.create({
      ...payload,
      identity: normalized,
      createdBy: user._id,
      updatedBy: user._id,
    })

    return NextResponse.json(
      { message: "Staff member created successfully", staffMember: created },
      { status: 200 }
    )
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || "Failed to create staff member" },
      { status: 500 }
    )
  }
}
