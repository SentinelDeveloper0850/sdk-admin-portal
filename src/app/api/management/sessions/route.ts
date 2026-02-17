// src/app/api/management/sessions/route.ts
import UserSessionModel from "@/app/models/auth/user-session.schema";
import UsersModel from "@/app/models/auth/user.schema";
import BranchModel from "@/app/models/system/branch.schema";
import RegionModel from "@/app/models/system/region.schema";
import { requireManagementFromRequest } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import mongoose from "mongoose";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const toIdString = (v: any) => {
    if (!v) return null;
    const s = typeof v === "string" ? v : String(v);
    if (s === "undefined" || s === "null") return null;
    return s;
};

const isObjectId = (v: string) => mongoose.Types.ObjectId.isValid(v);

export async function GET(req: NextRequest) {
    await connectToDatabase();

    // ✅ ensure requester is management/admin
    const auth = await requireManagementFromRequest(req); // should throw or return 401/403 response
    if (auth instanceof NextResponse) return auth;

    const now = new Date();

    const sessions = await UserSessionModel.find({
        revokedAt: null,
        expiresAt: { $gt: now },
    })
        .select("userId platform mode activeContext lastSeenAt expiresAt createdAt")
        .sort({ lastSeenAt: -1 })
        .lean();

    // Collect ids for name lookups
    const branchIds = Array.from(
        new Set(sessions.map((s: any) => toIdString(s?.activeContext?.branchId)).filter(Boolean))
    ) as string[];

    const regionIds = Array.from(
        new Set(sessions.map((s: any) => toIdString(s?.activeContext?.regionId)).filter(Boolean))
    ) as string[];

    const userIds = Array.from(
        new Set(sessions.map((s: any) => toIdString(s?.userId)).filter(Boolean))
    ) as string[];

    const safeBranchIds = branchIds.filter(isObjectId);
    const safeRegionIds = regionIds.filter(isObjectId);
    const safeUserIds = userIds.filter(isObjectId);

    const [users, regions, branches] = await Promise.all([
        UsersModel.find({ _id: { $in: safeUserIds } }).select("name email avatarUrl role roles").lean(),
        RegionModel.find({ _id: { $in: safeRegionIds } }).select("name").lean(),
        BranchModel.find({ _id: { $in: safeBranchIds } }).select("name").lean(),
    ]);

    const userMap = new Map(users.map(u => [String(u._id), u]));
    const regionMap = new Map(regions.map(r => [String(r._id), r]));
    const branchMap = new Map(branches.map(b => [String(b._id), b]));

    const data = sessions.map((s: any) => {
        const u = userMap.get(String(s.userId));
        const regionId = s.activeContext?.regionId ? String(s.activeContext.regionId) : null;
        const branchId = s.activeContext?.branchId ? String(s.activeContext.branchId) : null;

        return {
            id: String(s._id),
            user: u ? { id: String(u._id), name: u.name, email: u.email, avatarUrl: u.avatarUrl, role: u.role, roles: u.roles } : null,
            platform: s.platform ?? "WEB",
            mode: s.mode,
            regionId,
            branchId,
            regionName: regionId ? regionMap.get(regionId)?.name ?? null : null,
            branchName: branchId ? branchMap.get(branchId)?.name ?? null : null,
            lastSeenAt: s.lastSeenAt,
            expiresAt: s.expiresAt,
            createdAt: s.createdAt,
            status: "ACTIVE",
        };
    });

    return NextResponse.json({ success: true, data });
}

