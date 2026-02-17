// src/lib/session.ts
import UserSessionModel from "@/app/models/auth/user-session.schema";
import { connectToDatabase } from "@/lib/db";
import { cookies } from "next/headers";

const LAST_SEEN_THROTTLE_MS = 60_000; // 1 min

export async function getUserSession() {
    await connectToDatabase();

    const cookieStore = await cookies();
    const token = cookieStore.get("auth-token")?.value;

    if (!token) return null;

    const tokenHash = UserSessionModel.hashToken(token);

    // Read the session first
    const session = await UserSessionModel.findOne({
        tokenHash,
        revokedAt: null,
        expiresAt: { $gt: new Date() },
    }).lean();

    if (!session) return null;

    // Throttle DB writes
    const lastSeenAt = session.lastSeenAt ? new Date(session.lastSeenAt).getTime() : 0;
    const shouldTouch = Date.now() - lastSeenAt > LAST_SEEN_THROTTLE_MS;

    if (shouldTouch) {
        // Fire-and-forget (don’t block the request)
        // If you prefer strict consistency, await this.
        UserSessionModel.updateOne(
            { _id: session._id },
            { $set: { lastSeenAt: new Date() } }
        ).catch(() => { });
    }

    return session;
}
