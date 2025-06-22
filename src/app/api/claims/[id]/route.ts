import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { ClaimModel } from "@/app/models/claim.schema";
import { getUserFromRequest } from "@/lib/auth";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  await connectToDatabase();
  const claim = await ClaimModel.findById(params.id).populate("submittedBy comments.author notes.author");

  if (!claim) {
    return NextResponse.json({ success: false, message: "Claim not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true, claim });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  await connectToDatabase();
  await ClaimModel.findByIdAndDelete(params.id);
  return NextResponse.json({ success: true });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  await connectToDatabase();
  const user = await getUserFromRequest(req);
  if (!user || !user._id) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const updates: Record<string, any> = {};

  if (body.status) {
    updates.status = body.status;
  }

  if (body.comment) {
    updates.$push = {
      comments: {
        author: user._id,
        text: body.comment,
        createdAt: new Date(),
      },
    };
  }

  const updatedClaim = await ClaimModel.findByIdAndUpdate(params.id, updates, {
    new: true,
  }).populate("submittedBy comments.author notes.author");

  if (!updatedClaim) {
    return NextResponse.json({ success: false, message: "Claim not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true, claim: updatedClaim });
}
