import { NextRequest, NextResponse } from "next/server";

import { ClaimModel } from "@/app/models/scheme/claim.schema";
import { getUserFromRequest } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";

function extractClaimId(req: NextRequest): string | null {
  const parts = req.url.split("/");
  return parts[parts.length - 1] || null;
}

export async function GET(req: NextRequest) {
  await connectToDatabase();

  const id = extractClaimId(req);
  if (!id)
    return NextResponse.json(
      { success: false, message: "Missing claim ID" },
      { status: 400 }
    );

  const claim = await ClaimModel.findById(id).populate(
    "submittedBy comments.author notes.author"
  );
  if (!claim) {
    return NextResponse.json(
      { success: false, message: "Claim not found" },
      { status: 404 }
    );
  }

  return NextResponse.json({ success: true, claim });
}

export async function PATCH(req: NextRequest) {
  await connectToDatabase();

  const id = extractClaimId(req);
  if (!id)
    return NextResponse.json(
      { success: false, message: "Missing claim ID" },
      { status: 400 }
    );

  const user = await getUserFromRequest(req);
  if (!user)
    return NextResponse.json(
      { success: false, message: "Unauthorized" },
      { status: 401 }
    );

  const body = await req.json();
  const updates: Record<string, any> = {};

  if (body.status) updates.status = body.status;
  if (body.comment) {
    updates.$push = {
      comments: {
        author: user._id,
        text: body.comment,
        createdAt: new Date(),
      },
    };
  }

  const updated = await ClaimModel.findByIdAndUpdate(id, updates, {
    new: true,
  }).populate("comments.author");

  if (!updated) {
    return NextResponse.json(
      { success: false, message: "Claim not found" },
      { status: 404 }
    );
  }

  return NextResponse.json({ success: true, claim: updated });
}

export async function DELETE(req: NextRequest) {
  await connectToDatabase();
  const id = extractClaimId(req);
  if (!id)
    return NextResponse.json(
      { success: false, message: "Missing claim ID" },
      { status: 400 }
    );

  await ClaimModel.findByIdAndDelete(id);
  return NextResponse.json({ success: true });
}
