import { NextRequest, NextResponse } from "next/server";

import { PolicySignUpModel } from "@/app/models/scheme/policy-signup-request.schema";
import { connectToDatabase } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const requestId = searchParams.get('requestId');

    if (id) {
      // Get specific signup request
      const request = await PolicySignUpModel.findById(id);

      if (!request) {
        return NextResponse.json(
          { success: false, error: "Signup request not found" },
          { status: 404 }
        );
      }

      return NextResponse.json({ success: true, data: request });
    }

    if (requestId) {
      // Get specific signup request by business requestId
      const request = await PolicySignUpModel.findOne({ requestId });

      if (!request) {
        return NextResponse.json(
          { success: false, error: "Signup request not found" },
          { status: 404 }
        );
      }

      return NextResponse.json({ success: true, data: request });
    }

    // Get all signup requests
    const requests = await PolicySignUpModel.find({ deletedBy: { $exists: false }, currentStatus: { $ne: "deleted" } }).sort({ created_at: -1 });
    const count = await PolicySignUpModel.countDocuments();

    return NextResponse.json({
      success: true,
      data: {
        requests,
        count
      }
    });
  } catch (error: any) {
    console.error("Error fetching signup requests:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();

    const body = await request.json();

    const newRequest = new PolicySignUpModel({
      ...body,
      currentStatus: "submitted",
      statusHistory: [{
        status: "submitted",
        changedBy: body.created_by || "system",
        changedAt: new Date(),
        notes: "Request submitted"
      }]
    });

    await newRequest.save();

    return NextResponse.json(
      { success: true, data: newRequest },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error creating signup request:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await connectToDatabase();

    const body = await request.json();
    const { id, deletedBy } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Request ID is required" },
        { status: 400 }
      );
    }

    if (!deletedBy) {
      return NextResponse.json(
        { success: false, error: "User ID is required for deletion" },
        { status: 400 }
      );
    }

    const signupRequest = await PolicySignUpModel.findById(id);

    if (!signupRequest) {
      return NextResponse.json(
        { success: false, error: "Signup request not found" },
        { status: 404 }
      );
    }

    // Check if request can be deleted (only allow deletion of certain statuses)
    const deletableStatuses = ["submitted", "rejected", "archived"];
    if (!deletableStatuses.includes(signupRequest.currentStatus || "submitted")) {
      return NextResponse.json(
        {
          success: false,
          error: "Cannot delete request with current status. Only submitted, rejected, or archived requests can be deleted."
        },
        { status: 400 }
      );
    }

    // Soft delete by updating status and adding to history
    const deletedRequest = await PolicySignUpModel.findByIdAndUpdate(
      id,
      {
        currentStatus: "deleted",
        deletedAt: new Date(),
        deletedBy,
        updated_at: new Date(),
        updated_by: deletedBy,
        $push: {
          statusHistory: {
            status: "deleted",
            changedBy: deletedBy,
            changedAt: new Date(),
            notes: "Request deleted by admin"
          }
        }
      },
      { new: true }
    );

    return NextResponse.json({
      success: true,
      data: deletedRequest
    });
  } catch (error: any) {
    console.error("Error deleting signup request:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}