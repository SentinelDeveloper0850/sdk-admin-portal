import { NextRequest, NextResponse } from "next/server";

import { UserModel } from "@/app/models/hr/user.schema";
import { PolicySignUpModel } from "@/app/models/scheme/policy-signup-request.schema";
import { getUserFromRequest } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await getUserFromRequest(request);
    console.log("🚀 ~ POST ~ currentUser:", currentUser)

    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: "Unauthorized user" },
        { status: 401 }
      );
    }

    await connectToDatabase();

    const body = await request.json();
    console.log("🚀 ~ POST ~ body:", body)

    const { consultantId } = body;
    const { id } = await params;

    const consultant = await UserModel.findById(consultantId);
    console.log("🚀 ~ POST ~ consultant:", consultant)

    if (!consultant) {
      return NextResponse.json(
        { success: false, error: "Consultant not found" },
        { status: 404 }
      );
    }

    const updatedRequest = await PolicySignUpModel.findByIdAndUpdate(
      id,
      {
        assignedConsultant: consultantId,
        assignedConsultantName: consultant.name,
        assignedAt: new Date(),
        $push: {
          statusHistory: {
            status: "assigned",
            changedBy: currentUser._id,
            changedAt: new Date(),
          }
        }
      },
      { new: true }
    ).catch((err) => {
      console.error("Error updating signup request:", err);
      return NextResponse.json(
        { success: false, error: err.message },
        { status: 500 }
      );
    });

    console.log("🚀 ~ POST ~ updatedRequest:", updatedRequest)

    return NextResponse.json({ success: true, data: updatedRequest });
  } catch (error: any) {
    console.error("Error updating signup request:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}