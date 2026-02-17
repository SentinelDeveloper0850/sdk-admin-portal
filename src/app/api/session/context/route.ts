// src/app/api/session/context/route.ts
import type { JwtPayload } from "jsonwebtoken";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

import UserSessionModel from "@/app/models/auth/user-session.schema";
import UsersModel from "@/app/models/auth/user.schema";
import BranchModel from "@/app/models/system/branch.schema";
import RegionModel from "@/app/models/system/region.schema";
import { connectToDatabase } from "@/lib/db";

type AuthTokenPayload = JwtPayload & { userId: string };

const JWT_SECRET = process.env.JWT_SECRET ?? null;
const JWT_ISSUER = "sdk-admin-portal";
const JWT_AUDIENCE = "sdk-admin-portal-web";

export const runtime = "nodejs";

export async function GET() {
    if (!JWT_SECRET) {
        return NextResponse.json(
            { success: false, message: "Server misconfigured (missing JWT secret)" },
            { status: 500 }
        );
    }

    const cookieStore = await cookies();
    const token = cookieStore.get("auth-token")?.value;

    if (!token) {
        return NextResponse.json(
            { success: false, message: "Unauthorized", code: "AUTH_MISSING" },
            { status: 401 }
        );
    }

    // Verify auth first (clean separation, better error codes)
    let userId: string;
    try {
        const decoded = jwt.verify(token, JWT_SECRET, {
            issuer: JWT_ISSUER,
            audience: JWT_AUDIENCE,
        }) as { userId: string };

        userId = decoded.userId;
    } catch (error: any) {
        if (error?.name === "TokenExpiredError") {
            return NextResponse.json(
                { success: false, message: "Session expired. Please sign in again.", code: "AUTH_EXPIRED" },
                { status: 401 }
            );
        }

        return NextResponse.json(
            { success: false, message: "Invalid token", code: "AUTH_INVALID" },
            { status: 401 }
        );
    }

    await connectToDatabase();

    // Optional: ensure user exists (keeps things sane)
    const userExists = await UsersModel.exists({ _id: userId });
    if (!userExists) {
        return NextResponse.json(
            { success: false, message: "User not found", code: "USER_NOT_FOUND" },
            { status: 404 }
        );
    }

    const tokenHash = UserSessionModel.hashToken(token);

    // Enforce DB session expiry + not revoked
    const sessionDoc = await UserSessionModel.findOne({
        tokenHash,
        userId,
        revokedAt: null,
        expiresAt: { $gt: new Date() },
    })
        .select("mode activeContext lastSeenAt expiresAt")
        .lean();

    if (!sessionDoc) {
        // Auth is valid but DB session record missing/expired/revoked.
        // Treat as "no working context" and let client route accordingly.
        return NextResponse.json(
            {
                success: true,
                hasSession: false,
                hasContext: false,
                mode: "ONSITE",
                message: "No active session found",
            },
            { status: 200 }
        );
    }

    console.log("🚀 ~ GET ~ sessionDoc:", sessionDoc)
    const active = (sessionDoc as any).activeContext;

    const mode = (sessionDoc as any).mode as "ONSITE" | "REMOTE";
    const regionIdOut = active?.regionId ? String(active.regionId) : null;
    const branchIdOut = active?.branchId ? String(active.branchId) : null;

    const hasContext = mode === "REMOTE" || (!!branchIdOut && !!regionIdOut);

    // ✅ Default names
    let regionName: string | null = null;
    let branchName: string | null = null;

    if (hasContext && mode === "ONSITE") {
        // Fetch names in parallel
        const [region, branch] = await Promise.all([
            regionIdOut ? RegionModel.findById(regionIdOut).select("name").lean() : null,
            branchIdOut ? BranchModel.findById(branchIdOut).select("name").lean() : null,
        ]);

        regionName = (region as any)?.name ?? null;
        branchName = (branch as any)?.name ?? null;
    }

    return NextResponse.json(
        {
            success: true,
            hasSession: true,
            hasContext,
            mode,
            regionId: regionIdOut,
            branchId: branchIdOut,
            regionName, // ✅ added
            branchName, // ✅ added
            expiresAt: (sessionDoc as any).expiresAt,
            lastSeenAt: (sessionDoc as any).lastSeenAt,
        },
        { status: 200 }
    );
}

export async function POST(req: NextRequest) {
    try {
        if (!JWT_SECRET) {
            return NextResponse.json(
                { success: false, message: "Server misconfigured (missing JWT secret)" },
                { status: 500 }
            );
        }

        await connectToDatabase();

        const token = req.cookies.get("auth-token")?.value;
        if (!token) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

        const verified = jwt.verify(token, JWT_SECRET, {
            issuer: JWT_ISSUER,
            audience: JWT_AUDIENCE,
        });

        if (typeof verified === "string" || !verified || typeof (verified as any).userId !== "string") {
            return NextResponse.json({ success: false, error: "Invalid token" }, { status: 401 });
        }

        const decoded = verified as AuthTokenPayload;
        const userId = decoded.userId;

        const tokenHash = UserSessionModel.hashToken(token);

        const body = await req.json();
        const mode = body?.mode as "ONSITE" | "REMOTE";
        const regionId = body?.regionId ? String(body.regionId) : null;
        const branchId = body?.branchId ? String(body.branchId) : null;

        if (!mode) {
            return NextResponse.json({ success: false, error: "Mode is required" }, { status: 400 });
        }

        if (mode === "ONSITE") {
            if (!regionId || !branchId) {
                return NextResponse.json(
                    { success: false, error: "Region and Branch are required for onsite" },
                    { status: 400 }
                );
            }

            // Validate relationship (branch must belong to region)
            const branch = await BranchModel.findById(branchId).populate("regionDoc");
            if (!branch) return NextResponse.json({ success: false, error: "Branch not found" }, { status: 404 });

            // If your branch schema stores region as regionDoc._id OR regionId string, handle both:
            const branchRegionObjectId = (branch as any)?.regionDoc?._id;

            const ok = branchRegionObjectId && String(branchRegionObjectId) === String(regionId)

            if (!ok) {
                return NextResponse.json({ success: false, error: "Branch does not belong to region" }, { status: 400 });
            }
        }

        const update = mode === "REMOTE"
            ? { mode, activeContext: null, lastSeenAt: new Date() }
            : { mode, activeContext: { regionId, branchId }, lastSeenAt: new Date() };

        const now = new Date();
        const expiresAt = new Date(now.getTime() + 1000 * 60 * 60 * 8); // 8h to match JWT

        const session = await UserSessionModel.findOneAndUpdate(
            { tokenHash, revokedAt: null, userId }, // ✅ include userId
            {
                $set: {
                    ...update,
                    lastSeenAt: now,
                },
                $setOnInsert: {
                    userId,
                    platform: "WEB",
                    expiresAt,
                    revokedAt: null,
                    revokeReason: null,
                },
            },
            { new: true, upsert: true }
        ).lean();


        if (!session) {
            return NextResponse.json({ success: false, error: "Session not found" }, { status: 404 });
        }

        return NextResponse.json({ success: true });
    } catch (e: any) {
        console.error(e);
        return NextResponse.json({ success: false, error: e?.message ?? "Server error" }, { status: 500 });
    }
}
