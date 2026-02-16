import { NextRequest, NextResponse } from "next/server";

import UserModel from "@/app/models/auth/user.schema";
import PolicyCancellationRequest from "@/app/models/scheme/policy-cancellation-request.schema";
import { PolicyModel } from "@/app/models/scheme/policy.schema";
import { getUserFromRequest } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import { sendCancellationRequestEmail } from "@/lib/email";

export async function POST(request: NextRequest) {
  try {
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
    const {
      policyId,
      policyNumber,
      memberName,
      reason,
      cancellationType,
      effectiveDate,
      additionalNotes,
    } = body;

    // Validate required fields
    if (
      !policyId ||
      !policyNumber ||
      !memberName ||
      !reason ||
      !cancellationType ||
      !effectiveDate
    ) {
      return NextResponse.json(
        { success: false, message: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate policy exists
    const policy = await PolicyModel.findById(policyId);
    if (!policy) {
      return NextResponse.json(
        { success: false, message: "Policy not found" },
        { status: 404 }
      );
    }

    // Check if there's already a pending cancellation request for this policy
    const existingRequest = await PolicyCancellationRequest.findOne({
      policyId,
      status: "pending",
    });

    if (existingRequest) {
      return NextResponse.json(
        {
          success: false,
          message:
            "A pending cancellation request already exists for this policy",
        },
        { status: 409 }
      );
    }

    // Validate effective date based on cancellation type
    const effectiveDateObj = new Date(effectiveDate);
    const today = new Date(new Date().setHours(0, 0, 0, 0));

    if (cancellationType === "immediate" && effectiveDateObj < today) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Immediate cancellation effective date must be today or in the future",
        },
        { status: 400 }
      );
    }

    if (cancellationType !== "immediate" && effectiveDateObj <= new Date()) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Effective date must be in the future for non-immediate cancellations",
        },
        { status: 400 }
      );
    }

    // Create cancellation request
    const cancellationRequest = new PolicyCancellationRequest({
      policyId,
      policyNumber,
      memberName,
      reason,
      cancellationType,
      effectiveDate: effectiveDateObj,
      additionalNotes,
      submittedBy: user._id,
      status: "pending",
    });

    await cancellationRequest.save();

    // Update policy cancellation status to "pending_review"
    await PolicyModel.findByIdAndUpdate(policyId, {
      cancellationStatus: "pending_review",
      updatedAt: new Date(),
    });

    // Send confirmation email
    try {
      await sendCancellationRequestEmail({
        to: user.email || "",
        policyNumber,
        memberName,
        reason,
        cancellationType,
        effectiveDate: effectiveDateObj.toLocaleDateString(),
        requestId: cancellationRequest._id.toString(),
      });

      // Mark email as sent
      await cancellationRequest.markEmailSent();
    } catch (emailError) {
      console.error("Failed to send cancellation request email:", emailError);
      // Don't fail the request if email fails
    }

    return NextResponse.json({
      success: true,
      message: "Cancellation request submitted successfully",
      data: {
        requestId: cancellationRequest._id,
        status: cancellationRequest.status,
        submittedAt: cancellationRequest.submittedAt,
      },
    });
  } catch (error) {
    console.error("Error submitting cancellation request:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
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

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const policyId = searchParams.get("policyId");
    const policyNumber = searchParams.get("policyNumber");
    const memberName = searchParams.get("memberName");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    // Build query
    const query: any = {};
    if (status) query.status = status;
    if (policyId) query.policyId = policyId;
    if (policyNumber)
      query.policyNumber = { $regex: policyNumber, $options: "i" };
    if (memberName) query.memberName = { $regex: memberName, $options: "i" };

    // Get cancellation requests with pagination
    const [requests, total] = await Promise.all([
      PolicyCancellationRequest.find(query)
        .sort({ submittedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      PolicyCancellationRequest.countDocuments(query),
    ]);

    // Manually fetch user details and attach them
    const requestsWithUsers = await Promise.all(
      requests.map(async (request: any) => {
        const submittedBy = request.submittedBy
          ? await UserModel.findById(request.submittedBy)
            .select("name email")
            .lean()
          : null;
        const reviewedBy = request.reviewedBy
          ? await UserModel.findById(request.reviewedBy)
            .select("name email")
            .lean()
          : null;

        return {
          ...request,
          submittedBy: submittedBy || {
            name: "Unknown User",
            email: "unknown@example.com",
          },
          reviewedBy: reviewedBy || null,
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: {
        requests: requestsWithUsers,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error("Error fetching cancellation requests:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
