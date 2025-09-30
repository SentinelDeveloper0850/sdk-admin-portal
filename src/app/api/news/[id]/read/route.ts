import { NextRequest, NextResponse } from "next/server";

import { AnnouncementReadModel } from "@/app/models/system/announcement.schema";
import { getUserFromRequest } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  await connectToDatabase();
  const user = await getUserFromRequest(req);

  if (!user || !user._id) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  await AnnouncementReadModel.updateOne(
    { announcementId: params.id, userId: user._id },
    { $setOnInsert: { readAt: new Date() } },
    { upsert: true }
  );

  return NextResponse.json({ ok: true });
}


