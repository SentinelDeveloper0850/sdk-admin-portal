import { NextRequest, NextResponse } from "next/server";

import { } from "@/server/actions/easypay-transactions";

import { EAllocationRequestStatus } from "@/app/enums/hr/allocation-request-status.enum";
import { EasypayAllocationRequestModel } from "@/app/models/hr/easypay-allocation-request.schema";
import { EasypayTransactionModel } from "@/app/models/scheme/easypay-transaction.schema";
import { getUserFromRequest } from "@/lib/auth";
import { cloudinary } from "@/lib/cloudinary";
import { connectToDatabase } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const formData = await request.formData();
    const user = await getUserFromRequest(request);

    if (!user) {
      return NextResponse.json({
        success: false,
        message: "Unauthorized",
      }, { status: 401 });
    }

    await connectToDatabase();

    const transactionId = formData.get("transactionId");
    const policyNumber = formData.get("policyNumber");
    const notesValue = formData.get("notes");
    const notes: string[] = Array.isArray(notesValue)
      ? (notesValue as unknown as string[])
      : (notesValue ? [String(notesValue)] : []);
    const files = formData.getAll("evidence") as File[];

    if (!transactionId || !policyNumber) {
      return NextResponse.json({
        success: false,
        message: "Missing required fields",
      }, { status: 400 });
    }

    const transaction = await EasypayTransactionModel.findById(transactionId);
    if (!transaction) {
      return NextResponse.json({
        success: false,
        message: "Transaction not found",
      }, { status: 404 });
    }

    // Prevent duplicates unless previous request was REJECTED or CANCELLED
    const existingAllocation = await EasypayAllocationRequestModel.findOne({
      transactionId,
      status: { $nin: [EAllocationRequestStatus.REJECTED, EAllocationRequestStatus.CANCELLED] },
    });
    if (existingAllocation) {
      return NextResponse.json({
        success: false,
        message: "An allocation request already exists for this transaction",
      }, { status: 400 });
    }

    const allocation = await EasypayAllocationRequestModel.create({
      transactionId,
      policyNumber,
      notes,
      evidence: [],
      requestedBy: user._id,
    });

    if (!allocation._id) {
      return NextResponse.json({
        success: false,
        message: "Failed to create allocation request",
      }, { status: 500 });
    }

    if (files && files.length > 0) {
      // Upload files to cloudinary to folder allocation-requests/allocationRequestId
      const allocationRequestIdFolder = `allocation-requests/${allocation._id}`;

      const uploadedFiles = await Promise.all(files.map(async (file) => {
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const uploadResult = await new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            {
              folder: allocationRequestIdFolder,
              public_id: `evidence_${file.name}`,
              overwrite: true,
              resource_type: "auto",
            },
            (err, result) => {
              if (err) {
                console.error("Cloudinary upload error:", err);
                reject(err);
              } else {
                resolve(result);
              }
            }
          );
          stream.end(buffer);
        });

        return (uploadResult as any).secure_url;
      }));

      allocation.evidence = uploadedFiles;
      await allocation.save();
    }

    return NextResponse.json({
      success: true,
      message: "Allocation requested successfully",
    }, { status: 200 });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error("Error requesting allocation:", error.message);
    return NextResponse.json(
      { message: "Internal Server Error ~ Error requesting allocation" },
      { status: 500 }
    );
  }
}
