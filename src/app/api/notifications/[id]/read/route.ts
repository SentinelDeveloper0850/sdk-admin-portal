import { NextRequest, NextResponse } from "next/server";

import { NotificationModel } from "@/app/models/notification.schema";
import { getUserFromRequest } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";

interface Params {
  params: { id: string };
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const user = await getUserFromRequest(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectToDatabase();

  const { id } = params;

  const result = await NotificationModel.updateOne(
    {
      _id: id,
      recipientUserId: user.id,
    },
    { $set: { readAt: new Date() } }
  );

  if (result.matchedCount === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
