// app/api/branches/route.ts
import { NextRequest, NextResponse } from "next/server";

import { BranchModel } from "@/app/models/system/branch.schema";
import { RegionModel } from "@/app/models/system/region.schema";
// side-effect: registers model
import { getUserFromRequest } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";

export async function GET() {
  try {
    await connectToDatabase();

    const branches = await BranchModel.find({})
      .populate("regionDoc") // <-- NEW
      .populate("manager") // optional but useful
      .sort({ updatedAt: -1 });

    return NextResponse.json({ success: true, data: branches });
  } catch (error) {
    console.error("Error fetching branches:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          message: "Failed to fetch branches",
          details: error instanceof Error ? error.message : "Unknown error",
        },
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: { message: "Unauthorized" } },
        { status: 401 }
      );
    }

    const body = await request.json();

    const {
      id, // business id (optional, if you generate client-side)
      regionId, // <-- REQUIRED for region support
      name,
      code,
      address,
      city,
      province,
      postalCode,
      phone,
      phoneExtension,
      email,
      manager,
      latitude,
      longitude,
      isActive,
    } = body ?? {};

    if (!name || !code) {
      return NextResponse.json(
        {
          success: false,
          error: { message: "Missing required fields: name, code" },
        },
        { status: 400 }
      );
    }

    if (!regionId) {
      return NextResponse.json(
        {
          success: false,
          error: { message: "Missing required field: regionId" },
        },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // Validate region exists (by business id)
    const region = await RegionModel.findOne({
      id: String(regionId).trim(),
      isActive: true,
    });
    if (!region) {
      return NextResponse.json(
        {
          success: false,
          error: { message: "Invalid regionId (region not found)" },
        },
        { status: 400 }
      );
    }

    // Uniqueness check should be by CODE (matches schema)
    const normalizedCode = String(code).trim().toUpperCase();
    const existingByCode = await BranchModel.findOne({ code: normalizedCode });
    if (existingByCode) {
      return NextResponse.json(
        {
          success: false,
          error: { message: "Branch with this code already exists" },
        },
        { status: 409 }
      );
    }

    const createdBy = user._id;
    const updatedBy = user._id;

    // Note: your original email logic appends @somdaka.co.za no matter what.
    // If that's intended, keep it. Otherwise: store the provided email as-is.
    const emailValue =
      typeof email === "string" && email.trim().length > 0
        ? email.trim().toLowerCase()
        : undefined;

    const payload = {
      ...(id ? { id: String(id).trim() } : {}),
      regionId: String(regionId).trim(),

      name: String(name).trim(),
      code: normalizedCode,

      address: typeof address === "string" ? address.trim() : undefined,
      city: typeof city === "string" ? city.trim() : undefined,
      province: typeof province === "string" ? province.trim() : undefined,
      postalCode:
        typeof postalCode === "string" ? postalCode.trim() : undefined,
      phone: typeof phone === "string" ? phone.trim() : undefined,
      phoneExtension:
        typeof phoneExtension === "string" ? phoneExtension.trim() : undefined,
      email: emailValue,

      manager,
      latitude,
      longitude,
      isActive: isActive !== undefined ? Boolean(isActive) : true,

      createdBy,
      updatedBy,
    };

    const savedBranch = await new BranchModel(payload).save();

    // Populate regionDoc in response so UI gets it immediately
    const hydrated = await BranchModel.findById(savedBranch._id)
      .populate("regionDoc")
      .populate("manager");

    return NextResponse.json({
      success: true,
      data: hydrated ?? savedBranch,
      message: "Branch created successfully",
    });
  } catch (error) {
    console.error("Error creating branch:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          message: "Failed to create branch",
          details: error instanceof Error ? error.message : "Unknown error",
        },
      },
      { status: 500 }
    );
  }
}

/**
 * Strong opinion:
 * - Remove this body-based DELETE OR make it delete by business id explicitly.
 * Right now it is ambiguous.
 *
 * Below version deletes by business `id` (NOT Mongo _id).
 */
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { id } = body ?? {};

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: { message: "Branch business id is required" },
        },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const result = await BranchModel.findOneAndDelete({
      id: String(id).trim(),
    });

    if (!result) {
      return NextResponse.json(
        { success: false, error: { message: "Branch not found" } },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Branch deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting branch:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          message: "Failed to delete branch",
          details: error instanceof Error ? error.message : "Unknown error",
        },
      },
      { status: 500 }
    );
  }
}
