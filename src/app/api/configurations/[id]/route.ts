import { ConfigurationModel } from "@/app/models/system/configuration.schema";
import { connectToDatabase } from "@/lib/db";
import { ObjectId } from "mongodb";
import { NextRequest, NextResponse } from "next/server";

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { key, value, category, description, isActive, updatedBy } = body;
    const { id } = params;

    // Validate required fields
    if (!key || value === undefined || !category || !description) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: "Missing required fields: key, value, category, description",
          },
        },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // Check if configuration with same key already exists (excluding current one)
    const existingConfig = await ConfigurationModel.findOne({
      key: key.toUpperCase(),
      _id: { $ne: new ObjectId(id) }
    });

    if (existingConfig) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: "Configuration with this key already exists",
          },
        },
        { status: 409 }
      );
    }

    const updateData = {
      key: key.toUpperCase(),
      value,
      category: category.toLowerCase(),
      description,
      isActive: isActive !== undefined ? isActive : true,
      updatedAt: new Date(),
      updatedBy: updatedBy,
    };

    const result = await ConfigurationModel.findByIdAndUpdate(id, updateData, { new: true });

    if (result.matchedCount === 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: "Configuration not found",
          },
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        _id: id,
        ...updateData,
      },
      message: "Configuration updated successfully",
    });
  } catch (error) {
    console.error("Error updating configuration:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          message: "Failed to update configuration",
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
    const { id } = params;

    await connectToDatabase();

    const result = await ConfigurationModel.findByIdAndDelete(id);

    if (!result) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: "Configuration not found",
          },
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Configuration deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting configuration:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          message: "Failed to delete configuration",
          details: error instanceof Error ? error.message : "Unknown error",
        },
      },
      { status: 500 }
    );
  }
}