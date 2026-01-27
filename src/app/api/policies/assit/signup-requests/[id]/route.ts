import { NextRequest, NextResponse } from "next/server";

import { UserModel } from "@/app/models/hr/user.schema";
import { PolicySignUpModel } from "@/app/models/scheme/policy-signup-request.schema";
import { PolicyModel } from "@/app/models/scheme/policy.schema";
import { connectToDatabase } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();

    const { id } = await params;
    const request = await PolicySignUpModel.findById(id);

    if (!request) {
      return NextResponse.json(
        { success: false, error: "Signup request not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: request });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();

    const body = await request.json();
    const { action, ...actionData } = body;
    const { id } = await params;

    let updateData: any = {
      updated_at: new Date(),
      updated_by: actionData.userId || actionData.assignedBy || actionData.reviewedBy || actionData.approvedBy || actionData.rejectedBy || actionData.requestedBy || actionData.author || actionData.escalatedBy || actionData.archivedBy
    };

    switch (action) {
      case "assign_consultant":
        const consultant = await UserModel.findById(actionData.consultantId);
        if (!consultant) {
          return NextResponse.json(
            { success: false, error: "Consultant not found" },
            { status: 404 }
          );
        }

        updateData = {
          ...updateData,
          assignedConsultant: actionData.consultantId,
          assignedConsultantName: consultant.name,
          assignedAt: new Date(),
          $push: {
            statusHistory: {
              status: "assigned",
              changedBy: updateData.updated_by,
              changedAt: new Date(),
              notes: `Assigned to ${consultant.name}`
            }
          }
        };
        break;

      case "mark_as_reviewed":
        updateData = {
          ...updateData,
          currentStatus: "reviewed",
          $push: {
            statusHistory: {
              status: "reviewed",
              changedBy: updateData.updated_by,
              changedAt: new Date(),
              notes: actionData.notes || "Marked as reviewed"
            }
          }
        };
        break;

      case "approve":
        const generatedPolicyNumber = actionData.policyNumber || `POL-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

        updateData = {
          ...updateData,
          currentStatus: "approved",
          generatedPolicyNumber,
          policyCreatedAt: new Date(),
          policyCreatedBy: updateData.updated_by,
          $push: {
            statusHistory: {
              status: "approved",
              changedBy: updateData.updated_by,
              changedAt: new Date(),
              notes: `Approved with policy number: ${generatedPolicyNumber}`
            }
          }
        };
        break;

      case "reject":
        updateData = {
          ...updateData,
          currentStatus: "rejected",
          rejectionReason: actionData.reason,
          rejectionNotes: actionData.notes,
          $push: {
            statusHistory: {
              status: "rejected",
              changedBy: updateData.updated_by,
              changedAt: new Date(),
              notes: `Rejected: ${actionData.reason}`
            }
          }
        };
        break;

      case "request_more_info":
        updateData = {
          ...updateData,
          currentStatus: "pending_info",
          $push: {
            requestedInfo: {
              field: actionData.field,
              description: actionData.description,
              requestedAt: new Date(),
              requestedBy: updateData.updated_by
            },
            statusHistory: {
              status: "pending_info",
              changedBy: updateData.updated_by,
              changedAt: new Date(),
              notes: `Requested more info: ${actionData.field}`
            }
          }
        };
        break;

      case "add_notes":
        updateData = {
          ...updateData,
          $push: {
            internalNotes: {
              author: updateData.updated_by,
              authorName: actionData.authorName,
              text: actionData.text,
              createdAt: new Date(),
              isPrivate: actionData.isPrivate !== false
            }
          }
        };
        break;

      case "escalate":
        const escalatedUser = await UserModel.findById(actionData.escalatedTo);
        if (!escalatedUser) {
          return NextResponse.json(
            { success: false, error: "Escalation target user not found" },
            { status: 404 }
          );
        }

        updateData = {
          ...updateData,
          currentStatus: "escalated",
          escalatedTo: actionData.escalatedTo,
          escalatedToName: escalatedUser.name,
          escalatedAt: new Date(),
          escalationReason: actionData.reason,
          $push: {
            statusHistory: {
              status: "escalated",
              changedBy: updateData.updated_by,
              changedAt: new Date(),
              notes: `Escalated to ${escalatedUser.name}: ${actionData.reason}`
            }
          }
        };
        break;

      case "archive":
        updateData = {
          ...updateData,
          currentStatus: "archived",
          $push: {
            statusHistory: {
              status: "archived",
              changedBy: updateData.updated_by,
              changedAt: new Date(),
              notes: actionData.reason || "Archived"
            }
          }
        };
        break;

      default:
        return NextResponse.json(
          { success: false, error: "Invalid action" },
          { status: 400 }
        );
    }

    const updatedRequest = await PolicySignUpModel.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    ).catch((err) => {
      return NextResponse.json(
        { success: false, error: err.message },
        { status: 500 }
      );
    });

    // If approved, create policy record
    if (action === "approve") {
      try {
        const policyData = {
          memberID: updatedRequest.identificationNumber,
          policyNumber: updateData.generatedPolicyNumber,
          fullname: `${updatedRequest.fullNames} ${updatedRequest.surname}`,
          productName: updatedRequest.plan?.name || updatedRequest.plan, // Handle both new and old plan structure
          cellNumber: updatedRequest.phone,
          emailAddress: updatedRequest.email,
          physicalAddress: updatedRequest.address,
          dateCaptured: new Date(),
          currstatus: "Active",
          userCode: updateData.updated_by,
        };

        await PolicyModel.create(policyData);
      } catch (policyError) {
        console.error("Failed to create policy record:", policyError);
        // Continue even if policy creation fails
      }
    }

    return NextResponse.json({ success: true, data: updatedRequest });
  } catch (error: any) {
    console.error("Error updating signup request:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}