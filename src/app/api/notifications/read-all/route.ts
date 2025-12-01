import { NotificationModel } from "@/app/models/notification.schema";
import { getUserFromRequest } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(req: NextRequest) {
    const user = await getUserFromRequest(req);
    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await NotificationModel.updateMany({
        recipientUserId: user.id,
        readAt: null,
    }, { readAt: new Date() });

    return NextResponse.json({ success: true });
}