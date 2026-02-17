// src/app/api/management/sessions/revoke/route.ts
import UserSessionModel from "@/app/models/auth/user-session.schema";
import { requireManagementFromRequest } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
    await connectToDatabase();

    const auth = await requireManagementFromRequest(req); // should throw or return 401/403 response
    if (auth instanceof NextResponse) return auth;

    const body = await req.json();
    const sessionId = String(body?.sessionId ?? "");
    const reason = String(body?.reason ?? "Ended by management");

    if (!sessionId) {
        return NextResponse.json({ success: false, error: "sessionId is required" }, { status: 400 });
    }

    await UserSessionModel.updateOne(
        { _id: sessionId, revokedAt: null },
        { $set: { revokedAt: new Date(), revokeReason: reason } }
    );

    return NextResponse.json({ success: true });
}
