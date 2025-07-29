import { connectToDatabase } from "@/lib/db";
import { BranchModel } from "@/app/models/system/branch.schema";
import { NextRequest, NextResponse } from "next/server";

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
      maxStaff, 
      latitude, 
      longitude, 
      isActive, 
      updatedBy 
    } = body;

    // Validate required fields
    if (!name || !code || !address || !city || !province || !postalCode || !phone || !email || !manager || !maxStaff || latitude === undefined || longitude === undefined) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: "Missing required fields: name, code, address, city, province, postalCode, phone, email, manager, maxStaff, latitude, longitude",
          },
        },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // Check if branch with same code already exists (excluding current branch)
    const existingBranch = await BranchModel.findOne({ 
      code: code.trim().toUpperCase(),
      _id: { $ne: params.id }
    });

    if (existingBranch) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: "Branch with this code already exists",
          },
        },
        { status: 409 }
      );
    }

    const updatedBranch = await BranchModel.findByIdAndUpdate(
      params.id,
      {
        name: name.trim(),
        code: code.trim().toUpperCase(),
        address: address.trim(),
        city: city.trim(),
        province,
        postalCode: postalCode.trim(),
        phone: phone.trim(),
        email: email.trim().toLowerCase(),
        manager,
        maxStaff,
        latitude,
        longitude,
        isActive: isActive !== undefined ? isActive : true,
        updatedBy,
        updatedAt: new Date(),
      },
      { new: true, runValidators: true }
    ).populate('manager', 'firstName lastName email')
     .populate('createdBy', 'firstName lastName')
     .populate('updatedBy', 'firstName lastName');

    if (!updatedBranch) {
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
      data: updatedBranch,
      message: "Branch updated successfully",
    });
  } catch (error) {
    console.error("Error updating branch:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          message: "Failed to update branch",
          details: error instanceof Error ? error.message : "Unknown error",
        },
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectToDatabase();

    const result = await BranchModel.findByIdAndDelete(params.id);

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