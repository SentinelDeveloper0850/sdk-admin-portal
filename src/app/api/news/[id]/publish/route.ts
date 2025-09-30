import { NextRequest, NextResponse } from "next/server";

import { AnnouncementModel } from "@/app/models/system/announcement.schema";
import { getUserFromRequest } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await connectToDatabase();
  const user = await getUserFromRequest(req);

  if (!user || !user._id) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  if (user.role !== "admin") {
    return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
  }

  const now = new Date();
  const { id } = await params;
  const updated = await AnnouncementModel.findByIdAndUpdate(
    id,
    { status: "PUBLISHED", publishedAt: now },
    { new: true }
  );

  if (!updated) {
    return NextResponse.json({ success: false, message: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ id: String(updated._id), publishedAt: updated.publishedAt });
}


