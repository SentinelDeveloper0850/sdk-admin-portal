// src/app/api/notifications/route.ts
import { NotificationModel } from "@/app/models/notification.schema";
import { getUserFromRequest } from "@/lib/auth"; // however you do auth
import { connectToDatabase } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    const user = await getUserFromRequest(req);
    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const unreadOnly = searchParams.get("unreadOnly") === "true";
    const limit = Number(searchParams.get("limit") ?? "20");

    const where: any = {
        recipientUserId: user.id,
    };

    if (unreadOnly) {
        where.readAt = null;
    }

    await connectToDatabase();

    const notifications = await NotificationModel.find(where)
        .sort({ createdAt: -1 })
        .limit(limit);

    return NextResponse.json({ notifications });
}

// Optional: to create notifications via HTTP (could also be internal only)
export async function POST(req: NextRequest) {
    const user = await getUserFromRequest(req);
    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    await connectToDatabase();

    const notification = await NotificationModel.create({
        recipientUserId: user.id,
        ...body,
    });

    return NextResponse.json({ notification }, { status: 201 });
}
