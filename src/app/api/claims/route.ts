import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { ClaimModel } from "@/app/models/claim.schema";
import { getUserFromRequest } from "@/lib/auth"; // your JWT cookie parser

export async function POST(req: NextRequest) {
  await connectToDatabase();
  const user = await getUserFromRequest(req);

  if (!user) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();

  const claim = await ClaimModel.create({
    policyId: body.policyId,
    claimantName: body.claimantName,
    reason: body.reason,
    submittedBy: user._id,
    status: "Submitted",
    documents: body.documents ?? [],
    notes: body.notes ?? [],
    comments: body.comments ?? [],
  });

  return NextResponse.json({ success: true, claim }, { status: 201 });
}

export async function GET(req: NextRequest) {
  await connectToDatabase();
  const user = await getUserFromRequest(req);

  if (!user) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  const claims = await ClaimModel.find({ submittedBy: user._id }).sort({ createdAt: -1 });

  return NextResponse.json({ success: true, claims });
}
