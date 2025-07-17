import { NextRequest, NextResponse } from "next/server";

import { ClaimModel } from "@/app/models/scheme/claim.schema";
import { getUserFromRequest } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";

export async function POST(req: NextRequest) {
  await connectToDatabase();
  const user = await getUserFromRequest(req);

  if (!user) {
    return NextResponse.json(
      { success: false, message: "Unauthorized" },
      { status: 401 }
    );
  }

  const body = await req.json();
  console.log("🚀 ~ POST ~ body:", body);

  const claim = await ClaimModel.create({
    claimantName: body.claimantName,
    schemeType: body.schemeType,
    societyName: body.societyName ?? "",
    policyId: body.policyId,
    policyPlan: body.policyPlan,
    claimNumber: body.claimNumber,
    claimType: body.claimType,
    claimAmount: body.claimAmount ?? 0,
    reason: body.reason,
    submittedBy: user._id,
    status: "Submitted",
    documents: body.documents ?? [],
    notes: body.notes ?? [],
    comments: body.comments ?? [],
  });
  console.log("🚀 ~ POST ~ claim:", claim);

  return NextResponse.json({ success: true, claim }, { status: 201 });
}

export async function GET(req: NextRequest) {
  await connectToDatabase();
  const user = await getUserFromRequest(req);

  if (!user) {
    return NextResponse.json(
      { success: false, message: "Unauthorized" },
      { status: 401 }
    );
  }

  const claims = await ClaimModel.find()
    .populate("submittedBy")
    .sort({ createdAt: -1 });

  return NextResponse.json({ success: true, claims });
}
