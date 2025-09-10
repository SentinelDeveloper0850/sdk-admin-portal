import { NextRequest, NextResponse } from "next/server";

import UsersModel from "@/app/models/hr/user.schema";
import { getUserFromRequest } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";

// Consider someone "online" if their last heartbeat was within this window
const ONLINE_WINDOW_MS = 5 * 60 * 1000; // 5 minutes

export async function GET() {
  try {
    await connectToDatabase();

    const since = new Date(Date.now() - ONLINE_WINDOW_MS);

    const users = await UsersModel.find({
      lastSeenAt: { $gte: since },
      deletedAt: { $exists: false },
    })
      .select("_id name avatarUrl lastSeenAt")
      .lean();

    const result = users.map((u) => ({
      id: u._id?.toString?.() ?? "",
      name: u.name,
      avatarUrl: u.avatarUrl,
      lastSeenAt: u.lastSeenAt,
    }));

    return NextResponse.json({ online: result, windowMs: ONLINE_WINDOW_MS }, { status: 200 });
  } catch (error: any) {
    console.error("Error listing online users:", error?.message || error);
    return NextResponse.json({ message: "Failed to list online users" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();

    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    user.lastSeenAt = new Date();
    await user.save();

    return NextResponse.json({ ok: true, lastSeenAt: user.lastSeenAt }, { status: 200 });
  } catch (error: any) {
    console.error("Heartbeat error:", error?.message || error);
    return NextResponse.json({ message: "Failed to update presence" }, { status: 500 });
  }
}


