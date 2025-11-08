import { BranchModel } from "@/app/models/system/branch.schema";
import { getUserFromRequest } from "@/lib/auth";
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

    // Get user from request
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: "Unauthorized",
          },
        },
        { status: 401 }
      );
    }

    const createdBy = user._id;
    const updatedBy = user._id;

    const body = await request.json();
    const {
      name,
      code,
      ...restPayload
    } = body;

    // Validate required fields
    if (!name || !code) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: "Missing required fields: name, code",
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

    let payload = {
      name: name.trim(),
      code: code.trim().toUpperCase(),
      address: restPayload.address?.trim(),
      city: restPayload.city?.trim(),
      province: restPayload.province?.trim(),
      postalCode: restPayload.postalCode?.trim(),
      phone: restPayload.phone?.trim(),
      email: `${restPayload.email.trim().toLowerCase()}@somdaka.co.za`,
      manager: restPayload.manager,
      latitude: restPayload.latitude,
      longitude: restPayload.longitude,
      isActive: restPayload.isActive !== undefined ? restPayload.isActive : true,
      createdBy,
      updatedBy,
    }

    const branch = new BranchModel(payload);
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