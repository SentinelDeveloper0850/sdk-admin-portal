import { NextRequest, NextResponse } from "next/server";

import { ConfigurationModel } from "@/app/models/system/configuration.schema";
import { connectToDatabase } from "@/lib/db";

export async function GET() {
  try {
    await connectToDatabase();

    const configurations = await ConfigurationModel.find({
      deletedBy: { $exists: false },
      isActive: true,
    }).sort({ created_at: -1 });

    return NextResponse.json({
      success: true,
      data: configurations,
    });
  } catch (error) {
    console.error("Error fetching configurations:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          message: "Failed to fetch configurations",
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
    const { key, value, category, description, isActive, updatedBy } = body;

    // Validate required fields
    if (!key || value === undefined || !category || !description) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message:
              "Missing required fields: key, value, category, description",
          },
        },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // Check if configuration with same key already exists
    const existingConfig = await ConfigurationModel.findOne({
      key: key.toUpperCase(),
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

    const configuration = {
      key: key.toUpperCase(),
      value,
      category: category.toLowerCase(),
      description,
      isActive: isActive !== undefined ? isActive : true,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: updatedBy,
      updatedBy: updatedBy,
    };

    const result = await ConfigurationModel.create(configuration);

    return NextResponse.json({
      success: true,
      data: {
        _id: result.insertedId,
        ...configuration,
      },
      message: "Configuration created successfully",
    });
  } catch (error) {
    console.error("Error creating configuration:", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          message: "Failed to create configuration",
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
            message: "Configuration ID is required",
          },
        },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const result = await ConfigurationModel.deleteOne({
      _id: id,
    });

    if (result.deletedCount === 0) {
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
