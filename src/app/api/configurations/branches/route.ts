import { BranchModel } from "@/app/models/system/branch.schema";
import { connectToDatabase } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  try {
    await connectToDatabase();

    const branches = await BranchModel.find({})
      .sort({ updatedAt: -1 });

    return NextResponse.json({
      success: true,
      data: branches,
    });
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
    const body = await request.json();
    const {
      name,
      code,
      address,
      city,
      province,
      postalCode,
      phone,
      email,
      manager,
      latitude,
      longitude,
      isActive,
      createdBy
    } = body;

    // Validate required fields
    if (!name || !code || !address || !city || !province || !postalCode || !phone || !email || !manager || latitude === undefined || longitude === undefined) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: "Missing required fields: name, code, address, city, province, postalCode, phone, email, manager, latitude, longitude",
          },
        },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // Check if branch with same code already exists
    const existingBranch = await BranchModel.findOne({ name: name.trim().toUpperCase() });

    if (existingBranch) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: "Branch with this name already exists",
          },
        },
        { status: 409 }
      );
    }

    const branch = new BranchModel({
      name: name.trim(),
      code: code.trim().toUpperCase(),
      address: address.trim(),
      city: city.trim(),
      province,
      postalCode: postalCode.trim(),
      phone: phone.trim(),
      email: `${email.trim().toLowerCase()}@somdaka.co.za`,
      manager,
      latitude,
      longitude,
      isActive: isActive !== undefined ? isActive : true,
      createdBy,
      updatedBy: createdBy,
    });

    const savedBranch = await branch.save();

    return NextResponse.json({
      success: true,
      data: savedBranch,
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

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, deletedBy } = body;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: "Branch ID is required",
          },
        },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const result = await BranchModel.findByIdAndDelete(id);

    if (!result) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: "Branch not found",
          },
        },
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