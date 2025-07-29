import { connectToDatabase } from "@/lib/db";
import { BranchModel } from "@/app/models/system/branch.schema";
import { NextRequest, NextResponse } from "next/server";

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();

    await connectToDatabase();

    const updatedBranch = await BranchModel.findByIdAndUpdate(
      params.id,
      { ...body, updatedAt: new Date() },
      { new: true, runValidators: true }
    );

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