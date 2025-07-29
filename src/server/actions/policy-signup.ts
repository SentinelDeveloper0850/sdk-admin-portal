"use server"

import { UserModel } from "@/app/models/hr/user.schema";
import { IPolicySignUp, PolicySignUpModel } from "@/app/models/scheme/policy-signup-request.schema";
import { PolicyModel } from "@/app/models/scheme/policy.schema";
import { connectToDatabase } from "@/lib/db";

export const getPolicySignups = async () => {
  try {
    await connectToDatabase();

    const numberOfRequests = await PolicySignUpModel.countDocuments();
    const docs: IPolicySignUp[] = await PolicySignUpModel.find({ deletedBy: { $exists: false }, currentStatus: { $ne: "deleted" } }).sort({ created_at: -1 });

    return {
      success: true,
      data: {
        count: numberOfRequests,
        requests: docs,
      }
    };
  } catch (error: any) {
    console.error("🚀 ~ getPolicySignups ~ error:", error);
    return {
      success: false,
      error: error.message || "Unknown error occurred",
    };
  }
};

export const getPolicySignupById = async (id: string) => {
  try {
    await connectToDatabase();

    const request = await PolicySignUpModel.findById(id);

    if (!request) {
      return {
        success: false,
        error: "Signup request not found",
      };
    }

    return {
      success: true,
      data: request,
    };
  } catch (error: any) {
    console.error("🚀 ~ getPolicySignupById ~ error:", error);
    return {
      success: false,
      error: error.message || "Unknown error occurred",
    };
  }
};

export const assignConsultant = async (requestId: string, consultantId: string, assignedBy: string) => {
  try {
    await connectToDatabase();

    // Get consultant details
    const consultant = await UserModel.findById(consultantId);
    if (!consultant) {
      return {
        success: false,
        error: "Consultant not found",
      };
    }

    const request = await PolicySignUpModel.findByIdAndUpdate(
      requestId,
      {
        assignedConsultant: consultantId,
        assignedConsultantName: consultant.name,
        assignedAt: new Date(),
        updated_at: new Date(),
        updated_by: assignedBy,
        $push: {
          statusHistory: {
            status: "assigned",
            changedBy: assignedBy,
            changedAt: new Date(),
            notes: `Assigned to ${consultant.name}`
          }
        }
      },
      { new: true }
    );

    if (!request) {
      return {
        success: false,
        error: "Signup request not found",
      };
    }

    return {
      success: true,
      data: request,
    };
  } catch (error: any) {
    console.error("🚀 ~ assignConsultant ~ error:", error);
    return {
      success: false,
      error: error.message || "Unknown error occurred",
    };
  }
};

export const markAsReviewed = async (requestId: string, reviewedBy: string, notes?: string) => {
  try {
    await connectToDatabase();

    const request = await PolicySignUpModel.findByIdAndUpdate(
      requestId,
      {
        currentStatus: "reviewed",
        updated_at: new Date(),
        updated_by: reviewedBy,
        $push: {
          statusHistory: {
            status: "reviewed",
            changedBy: reviewedBy,
            changedAt: new Date(),
            notes: notes || "Marked as reviewed"
          }
        }
      },
      { new: true }
    );

    if (!request) {
      return {
        success: false,
        error: "Signup request not found",
      };
    }

    return {
      success: true,
      data: request,
    };
  } catch (error: any) {
    console.error("🚀 ~ markAsReviewed ~ error:", error);
    return {
      success: false,
      error: error.message || "Unknown error occurred",
    };
  }
};

export const approveRequest = async (requestId: string, approvedBy: string, policyNumber?: string) => {
  try {
    await connectToDatabase();

    // Generate policy number if not provided
    const generatedPolicyNumber = policyNumber || `POL-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    const request = await PolicySignUpModel.findByIdAndUpdate(
      requestId,
      {
        currentStatus: "approved",
        generatedPolicyNumber,
        policyCreatedAt: new Date(),
        policyCreatedBy: approvedBy,
        updated_at: new Date(),
        updated_by: approvedBy,
        $push: {
          statusHistory: {
            status: "approved",
            changedBy: approvedBy,
            changedAt: new Date(),
            notes: `Approved with policy number: ${generatedPolicyNumber}`
          }
        }
      },
      { new: true }
    );

    if (!request) {
      return {
        success: false,
        error: "Signup request not found",
      };
    }

    // Create policy record
    try {
      const policyData = {
        memberID: request.identificationNumber,
        policyNumber: generatedPolicyNumber,
        fullname: `${request.fullNames} ${request.surname}`,
        productName: request.plan?.name || request.plan, // Handle both new and old plan structure
        cellNumber: request.phone,
        emailAddress: request.email,
        physicalAddress: request.address,
        dateCaptured: new Date(),
        currstatus: "Active",
        userCode: approvedBy,
      };

      await PolicyModel.create(policyData);
    } catch (policyError) {
      console.error("Failed to create policy record:", policyError);
      // Continue even if policy creation fails
    }

    return {
      success: true,
      data: request,
    };
  } catch (error: any) {
    console.error("🚀 ~ approveRequest ~ error:", error);
    return {
      success: false,
      error: error.message || "Unknown error occurred",
    };
  }
};

export const rejectRequest = async (requestId: string, rejectedBy: string, reason: string, notes?: string) => {
  try {
    await connectToDatabase();

    const request = await PolicySignUpModel.findByIdAndUpdate(
      requestId,
      {
        currentStatus: "rejected",
        rejectionReason: reason,
        rejectionNotes: notes,
        updated_at: new Date(),
        updated_by: rejectedBy,
        $push: {
          statusHistory: {
            status: "rejected",
            changedBy: rejectedBy,
            changedAt: new Date(),
            notes: `Rejected: ${reason}`
          }
        }
      },
      { new: true }
    );

    if (!request) {
      return {
        success: false,
        error: "Signup request not found",
      };
    }

    return {
      success: true,
      data: request,
    };
  } catch (error: any) {
    console.error("🚀 ~ rejectRequest ~ error:", error);
    return {
      success: false,
      error: error.message || "Unknown error occurred",
    };
  }
};

export const requestMoreInfo = async (requestId: string, requestedBy: string, field: string, description: string) => {
  try {
    await connectToDatabase();

    const request = await PolicySignUpModel.findByIdAndUpdate(
      requestId,
      {
        currentStatus: "pending_info",
        updated_at: new Date(),
        updated_by: requestedBy,
        $push: {
          requestedInfo: {
            field,
            description,
            requestedAt: new Date(),
            requestedBy
          },
          statusHistory: {
            status: "pending_info",
            changedBy: requestedBy,
            changedAt: new Date(),
            notes: `Requested more info: ${field}`
          }
        }
      },
      { new: true }
    );

    if (!request) {
      return {
        success: false,
        error: "Signup request not found",
      };
    }

    return {
      success: true,
      data: request,
    };
  } catch (error: any) {
    console.error("🚀 ~ requestMoreInfo ~ error:", error);
    return {
      success: false,
      error: error.message || "Unknown error occurred",
    };
  }
};

export const addNotes = async (requestId: string, author: string, authorName: string, text: string, isPrivate: boolean = true) => {
  try {
    await connectToDatabase();

    const request = await PolicySignUpModel.findByIdAndUpdate(
      requestId,
      {
        updated_at: new Date(),
        updated_by: author,
        $push: {
          internalNotes: {
            author,
            authorName,
            text,
            createdAt: new Date(),
            isPrivate
          }
        }
      },
      { new: true }
    );

    if (!request) {
      return {
        success: false,
        error: "Signup request not found",
      };
    }

    return {
      success: true,
      data: request,
    };
  } catch (error: any) {
    console.error("🚀 ~ addNotes ~ error:", error);
    return {
      success: false,
      error: error.message || "Unknown error occurred",
    };
  }
};

export const escalateRequest = async (requestId: string, escalatedBy: string, escalatedTo: string, reason: string) => {
  try {
    await connectToDatabase();

    // Get escalated user details
    const escalatedUser = await UserModel.findById(escalatedTo);
    if (!escalatedUser) {
      return {
        success: false,
        error: "Escalation target user not found",
      };
    }

    const request = await PolicySignUpModel.findByIdAndUpdate(
      requestId,
      {
        currentStatus: "escalated",
        escalatedTo,
        escalatedToName: escalatedUser.name,
        escalatedAt: new Date(),
        escalationReason: reason,
        updated_at: new Date(),
        updated_by: escalatedBy,
        $push: {
          statusHistory: {
            status: "escalated",
            changedBy: escalatedBy,
            changedAt: new Date(),
            notes: `Escalated to ${escalatedUser.name}: ${reason}`
          }
        }
      },
      { new: true }
    );

    if (!request) {
      return {
        success: false,
        error: "Signup request not found",
      };
    }

    return {
      success: true,
      data: request,
    };
  } catch (error: any) {
    console.error("🚀 ~ escalateRequest ~ error:", error);
    return {
      success: false,
      error: error.message || "Unknown error occurred",
    };
  }
};

export const archiveRequest = async (requestId: string, archivedBy: string, reason?: string) => {
  try {
    await connectToDatabase();

    const request = await PolicySignUpModel.findByIdAndUpdate(
      requestId,
      {
        currentStatus: "archived",
        updated_at: new Date(),
        updated_by: archivedBy,
        $push: {
          statusHistory: {
            status: "archived",
            changedBy: archivedBy,
            changedAt: new Date(),
            notes: reason || "Archived"
          }
        }
      },
      { new: true }
    );

    if (!request) {
      return {
        success: false,
        error: "Signup request not found",
      };
    }

    return {
      success: true,
      data: request,
    };
  } catch (error: any) {
    console.error("🚀 ~ archiveRequest ~ error:", error);
    return {
      success: false,
      error: error.message || "Unknown error occurred",
    };
  }
};

export const getConsultants = async () => {
  try {
    await connectToDatabase();

    const consultants = await UserModel.find({
      roles: { $in: ["scheme_consultant", "scheme_consultant_online", "society_consultant"] },
      status: "Active"
    }).select('_id name email');

    return {
      success: true,
      data: consultants,
    };
  } catch (error: any) {
    console.error("🚀 ~ getConsultants ~ error:", error);
    return {
      success: false,
      error: error.message || "Unknown error occurred",
    };
  }
};

export const getUsersForEscalation = async () => {
  try {
    await connectToDatabase();

    const users = await UserModel.find({
      roles: { $in: ["admin", "hr_manager", "scheme_consultant", "scheme_consultant_online"] },
      status: "Active"
    }).select('_id name email roles');

    return {
      success: true,
      data: users,
    };
  } catch (error: any) {
    console.error("🚀 ~ getUsersForEscalation ~ error:", error);
    return {
      success: false,
      error: error.message || "Unknown error occurred",
    };
  }
};

export const deleteRequest = async (requestId: string, deletedBy: string) => {
  try {
    await connectToDatabase();

    const request = await PolicySignUpModel.findById(requestId);

    if (!request) {
      return {
        success: false,
        error: "Signup request not found",
      };
    }

    // Check if request can be deleted (only allow deletion of certain statuses)
    const deletableStatuses = ["submitted", "rejected", "archived"];
    if (!deletableStatuses.includes(request.currentStatus || "submitted")) {
      return {
        success: false,
        error: "Cannot delete request with current status. Only submitted, rejected, or archived requests can be deleted.",
      };
    }

    // Soft delete by updating status and adding to history
    const deletedRequest = await PolicySignUpModel.findByIdAndUpdate(
      requestId,
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

    return {
      success: true,
      data: deletedRequest,
    };
  } catch (error: any) {
    console.error("🚀 ~ deleteRequest ~ error:", error);
    return {
      success: false,
      error: error.message || "Unknown error occurred",
    };
  }
};