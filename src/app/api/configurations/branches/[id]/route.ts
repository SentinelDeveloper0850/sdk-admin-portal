// app/api/branches/[id]/route.ts
import { BranchModel } from "@/app/models/system/branch.schema"
import { RegionModel } from "@/app/models/system/region.schema"; // side-effect: registers model
import { connectToDatabase } from "@/lib/db"
import { NextRequest, NextResponse } from "next/server"

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const body = await request.json()
    const { id } = await params

    await connectToDatabase()

    // Whitelist fields (prevents client from overwriting system fields)
    const allowed: Record<string, any> = {}
    const setIf = (key: string) => {
      if (body?.[key] !== undefined) allowed[key] = body[key]
    }

      ;[
        "regionId",
        "name",
        "code",
        "address",
        "city",
        "province",
        "postalCode",
        "phone",
        "phoneExtension",
        "email",
        "manager",
        "latitude",
        "longitude",
        "isActive",
      ].forEach(setIf)

    // If regionId is being changed, validate it exists
    if (allowed.regionId) {
      const region = await RegionModel.findOne({ id: String(allowed.regionId).trim(), isActive: true })
      if (!region) {
        return NextResponse.json(
          { success: false, error: { message: "Invalid regionId (region not found)" } },
          { status: 400 }
        )
      }
      allowed.regionId = String(allowed.regionId).trim()
    }

    if (allowed.code) {
      allowed.code = String(allowed.code).trim().toUpperCase()
    }
    if (allowed.name) {
      allowed.name = String(allowed.name).trim()
    }
    if (allowed.email) {
      allowed.email = String(allowed.email).trim().toLowerCase()
    }

    const updatedBranch = await BranchModel.findByIdAndUpdate(
      id,
      { $set: { ...allowed, updatedAt: new Date() } },
      { new: true, runValidators: true }
    )
      .populate("regionDoc")
      .populate("manager")

    if (!updatedBranch) {
      return NextResponse.json(
        { success: false, error: { message: "Branch not found" } },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: updatedBranch,
      message: "Branch updated successfully",
    })
  } catch (error) {
    console.error("Error updating branch:", error)
    return NextResponse.json(
      {
        success: false,
        error: {
          message: "Failed to update branch",
          details: error instanceof Error ? error.message : "Unknown error",
        },
      },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    await connectToDatabase()

    const result = await BranchModel.findByIdAndDelete(id)
    if (!result) {
      return NextResponse.json(
        { success: false, error: { message: "Branch not found" } },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, message: "Branch deleted successfully" })
  } catch (error) {
    console.error("Error deleting branch:", error)
    return NextResponse.json(
      {
        success: false,
        error: {
          message: "Failed to delete branch",
          details: error instanceof Error ? error.message : "Unknown error",
        },
      },
      { status: 500 }
    )
  }
}
