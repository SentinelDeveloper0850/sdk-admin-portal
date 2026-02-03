import { NextRequest, NextResponse } from "next/server";

import UserModel from "@/app/models/hr/user.schema";
import PolicyCancellationRequest from "@/app/models/scheme/policy-cancellation-request.schema";
import { PolicyModel } from "@/app/models/scheme/policy.schema";
import { getUserFromRequest } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import { sendCancellationStatusEmail } from "@/lib/email";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Authenticate user using custom JWT
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    // Connect to database
    await connectToDatabase();

    // Get cancellation request by ID
    const cancellationRequest =
      await PolicyCancellationRequest.findById(id).lean();

    if (!cancellationRequest) {
      return NextResponse.json(
        { success: false, message: "Cancellation request not found" },
        { status: 404 }
      );
    }

    // Manually fetch user details and attach them
    const submittedBy = (cancellationRequest as any).submittedBy
      ? await UserModel.findById((cancellationRequest as any).submittedBy)
          .select("name email")
          .lean()
      : null;
    const reviewedBy = (cancellationRequest as any).reviewedBy
      ? await UserModel.findById((cancellationRequest as any).reviewedBy)
          .select("name email")
          .lean()
      : null;

    const cancellationRequestWithUsers = {
      ...cancellationRequest,
      submittedBy: submittedBy || {
        name: "Unknown User",
        email: "unknown@example.com",
      },
      reviewedBy: reviewedBy || null,
    };

    return NextResponse.json({
      success: true,
      data: cancellationRequestWithUsers,
    });
  } catch (error) {
    console.error("Error fetching cancellation request:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Authenticate user using custom JWT
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    // Connect to database
    await connectToDatabase();

    // Parse request body
    const body = await request.json();
    const { action, reviewNotes } = body;

    // Validate action
    if (!action || !["approve", "reject"].includes(action)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid action. Must be 'approve' or 'reject'",
        },
        { status: 400 }
      );
    }

    // Get cancellation request
    const cancellationRequest = await PolicyCancellationRequest.findById(id);

    if (!cancellationRequest) {
      return NextResponse.json(
        { success: false, message: "Cancellation request not found" },
        { status: 404 }
      );
    }

    // Check if request is already processed
    if (cancellationRequest.status !== "pending") {
      return NextResponse.json(
        {
          success: false,
          message: "Cancellation request has already been processed",
        },
        { status: 409 }
      );
    }

    // Perform action
    if (action === "approve") {
      await cancellationRequest.approve(user._id, reviewNotes);

      // Update policy cancellation status to approved
      await PolicyModel.findByIdAndUpdate(cancellationRequest.policyId, {
        cancellationStatus: "approved",
        updatedAt: new Date(),
      });
    } else if (action === "reject") {
      await cancellationRequest.reject(user._id, reviewNotes);

      // Update policy cancellation status to rejected
      await PolicyModel.findByIdAndUpdate(cancellationRequest.policyId, {
        cancellationStatus: "rejected",
        updatedAt: new Date(),
      });
    }

    // Get user details for email
    const submittedByUser = await UserModel.findById(
      cancellationRequest.submittedBy
    )
      .select("email")
      .lean();

    // Send status update email
    try {
      await sendCancellationStatusEmail({
        to: submittedByUser?.email || "unknown@example.com",
        policyNumber: cancellationRequest.policyNumber,
        memberName: cancellationRequest.memberName,
        status: action === "approve" ? "approved" : "rejected",
        reviewNotes,
        requestId: cancellationRequest._id.toString(),
        effectiveDate: cancellationRequest.effectiveDate.toLocaleDateString(),
      });

      // Mark email as sent
      await cancellationRequest.markEmailSent();
    } catch (emailError) {
      console.error("Failed to send cancellation status email:", emailError);
      // Don't fail the request if email fails
    }

    return NextResponse.json({
      success: true,
      message: `Cancellation request ${action}d successfully`,
      data: {
        requestId: cancellationRequest._id,
        status: cancellationRequest.status,
        reviewedAt: cancellationRequest.reviewedAt,
      },
    });
  } catch (error) {
    console.error("Error updating cancellation request:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Authenticate user using custom JWT
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    // Connect to database
    await connectToDatabase();

    // Get cancellation request
    const cancellationRequest = await PolicyCancellationRequest.findById(id);

    if (!cancellationRequest) {
      return NextResponse.json(
        { success: false, message: "Cancellation request not found" },
        { status: 404 }
      );
    }

    // Only allow deletion of pending requests
    if (cancellationRequest.status !== "pending") {
      return NextResponse.json(
        {
          success: false,
          message: "Cannot delete processed cancellation requests",
        },
        { status: 409 }
      );
    }

    // Delete the request
    await PolicyCancellationRequest.findByIdAndDelete(id);

    // Reset policy cancellation status to none since cancellation request is deleted
    await PolicyModel.findByIdAndUpdate(cancellationRequest.policyId, {
      cancellationStatus: "none",
      updatedAt: new Date(),
    });

    return NextResponse.json({
      success: true,
      message: "Cancellation request deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting cancellation request:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
