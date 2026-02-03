import { verifyDriverAccessToken } from "@/lib/driverapp-auth";
import { NextResponse } from "next/server";

export function getBearerToken(req: Request) {
    const auth = req.headers.get("authorization") || "";
    const m = auth.match(/^Bearer\s+(.+)$/i);
    return m?.[1] ?? null;
}

export function requireDriverAuth(req: Request) {
    const token = getBearerToken(req);
    if (!token) {
        return { ok: false as const, res: NextResponse.json({ error: "Missing token" }, { status: 401 }) };
    }

    try {
        const payload = verifyDriverAccessToken(token);
        if (payload?.role !== "DRIVER") {
            return { ok: false as const, res: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
        }
        return { ok: true as const, payload };
    } catch {
        return { ok: false as const, res: NextResponse.json({ error: "Invalid token" }, { status: 401 }) };
    }
}
