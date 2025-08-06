import { NextRequest, NextResponse } from "next/server";

import { ClaimModel } from "@/app/models/scheme/claim.schema";
import { getUserFromRequest } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import { sendClaimSubmissionConfirmationEmail, sendClaimAdminNotificationEmail } from "@/lib/email";

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

  // Send confirmation email to claimant (if email is available)
  try {
    // Note: You might need to get the claimant's email from the policy or user data
    // For now, we'll send to the submitting user if they have an email
    if (user.email) {
      await sendClaimSubmissionConfirmationEmail({
        to: user.email,
        claimantName: body.claimantName,
        claimNumber: body.claimNumber,
        policyNumber: body.policyId, // This should be the actual policy number
        claimType: body.claimType,
        schemeType: body.schemeType,
        claimAmount: body.claimAmount,
        reason: body.reason,
        submittedAt: new Date(),
        status: "Submitted",
        societyName: body.societyName,
        documents: body.documents?.map((doc: any) => ({ name: doc.name })) || [],
      });
    }
  } catch (emailError) {
    console.error("Failed to send claim confirmation email:", emailError);
    // Don't fail the request if email fails
  }

  // Send admin notification (you might want to get admin emails from a different source)
  try {
    // This would typically be sent to admin users or a specific admin email
    // For now, we'll skip this but you can implement it based on your admin notification logic
    /*
    await sendClaimAdminNotificationEmail({
      to: adminEmail,
      adminName: "Admin",
      claimNumber: body.claimNumber,
      claimantName: body.claimantName,
      claimType: body.claimType,
      claimAmount: body.claimAmount,
      submittedAt: new Date(),
    });
    */
  } catch (emailError) {
    console.error("Failed to send admin notification email:", emailError);
    // Don't fail the request if email fails
  }

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
