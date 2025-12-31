import { getUserFromRequest } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

import { CemeteryModel } from "@/app/models/cemetery.schema"; // <-- you need this model

function jsonOk(data: any, init?: ResponseInit) {
    return NextResponse.json({ success: true, ...data }, { status: 200, ...init });
}
function jsonCreated(data: any) {
    return NextResponse.json({ success: true, ...data }, { status: 201 });
}
function jsonErr(message: string, status = 400) {
    return NextResponse.json({ success: false, message }, { status });
}

const CODE_RE = /^[A-Z0-9-]+$/;

function normalizeCode(input?: string) {
    const s = String(input ?? "")
        .trim()
        .toUpperCase()
        .replace(/\s+/g, "-");
    return s || undefined;
}

export async function GET(req: NextRequest) {
    try {
        const user = await getUserFromRequest(req);
        if (!user) return jsonErr("Unauthorized", 401);

        await connectToDatabase();

        const { searchParams } = new URL(req.url);
        const q = (searchParams.get("q") || "").trim();
        const city = (searchParams.get("city") || "").trim();
        const province = (searchParams.get("province") || "").trim();
        const isActiveParam = searchParams.get("isActive");

        const filter: any = {};
        if (city) filter.city = city;
        if (province) filter.province = province;

        if (isActiveParam === "true") filter.isActive = true;
        if (isActiveParam === "false") filter.isActive = false;

        if (q) {
            const r = new RegExp(q, "i");
            filter.$or = [{ name: r }, { code: r }, { address: r }, { city: r }, { province: r }];
        }

        const items = await CemeteryModel.find(filter).sort({ createdAt: -1 });

        return jsonOk({ data: items });
    } catch (e) {
        console.error("GET /configurations/cemeteries error:", e);
        return jsonErr("Failed to fetch cemeteries", 500);
    }
}

export async function POST(req: NextRequest) {
    try {
        const user = await getUserFromRequest(req);
        if (!user) return jsonErr("Unauthorized", 401);

        const body = await req.json();

        const name = String(body?.name || "").trim();
        if (!name) return jsonErr("Cemetery name is required", 400);

        const code = normalizeCode(body?.code);
        if (!code) return jsonErr("Cemetery code is required", 400);
        if (!CODE_RE.test(code)) return jsonErr("Invalid code. Use only A-Z, 0-9 and -", 400);

        await connectToDatabase();

        // uniqueness checks
        const dup = await CemeteryModel.findOne({
            $or: [{ code }, { name }],
        }).lean();

        // Handle possibility that dup is an array or a single object
        if (Array.isArray(dup)) {
            if (dup.some((d) => d.code === code))
                return jsonErr("Cemetery code already exists", 409);
            if (dup.some((d) => d.name === name))
                return jsonErr("Cemetery name already exists", 409);
        } else if (dup) {
            if (dup.code === code)
                return jsonErr("Cemetery code already exists", 409);
            if (dup.name === name)
                return jsonErr("Cemetery name already exists", 409);
        }

        const created = await CemeteryModel.create({
            name,
            code,
            address: body?.address || "",
            city: body?.city || "",
            province: body?.province || "",
            postalCode: body?.postalCode || "",
            latitude: body?.latitude ?? undefined,
            longitude: body?.longitude ?? undefined,
            isActive: body?.isActive ?? true,
            createdBy: String(user._id),
            updatedBy: String(user._id),
        });

        return jsonCreated({ data: created });
    } catch (e: any) {
        console.error("POST /configurations/cemeteries error:", e);

        // mongoose duplicate key
        if (e?.code === 11000) return jsonErr("Duplicate cemetery (name/code).", 409);

        return jsonErr("Failed to create cemetery", 500);
    }
}
