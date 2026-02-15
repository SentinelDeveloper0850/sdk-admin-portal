import mongoose from "mongoose";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { getUserFromRequest } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";

import "@/app/models/hr/user.schema"; // side-effect: registers model

import { DmsDocumentVersionModel } from "@/app/models/dms/document-version.schema";
import { DmsDocumentModel } from "@/app/models/dms/document.schema";
import UserModel from "@/app/models/hr/user.schema";
import { RegionModel } from "@/app/models/system/region.schema";

const ObjectIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid ObjectId");

const CreateDocumentSchema = z.object({
    title: z.string().min(2),
    slug: z.string().min(2),
    regionId: ObjectIdSchema.optional(),
    category: z.enum(["FORMS", "CLAIMS", "TERMS", "POLICIES", "HR", "BRANCH_OPS", "OTHER"]),
    description: z.string().optional(),
    tags: z.array(z.string()).optional(),
    isActive: z.boolean().optional(),
});

export async function GET(request: NextRequest) {
    try {
        const user = await getUserFromRequest(request);

        // Restrict access to authenticated users
        if (!user) {
            return NextResponse.json(
                { success: false, error: { message: "Not authenticated" } },
                { status: 401 }
            );
        }

        await connectToDatabase();

        const { searchParams } = new URL(request.url);
        const q = (searchParams.get("q") ?? "").trim();
        const category = (searchParams.get("category") ?? "").trim();
        const regionId = (searchParams.get("regionId") ?? "").trim();
        const currentOnly = (searchParams.get("currentOnly") ?? "true") === "true";
        const isActive = (searchParams.get("isActive") ?? "true") === "true";

        const filter: any = { isActive };

        if (category) filter.category = category;

        if (regionId) {
            if (regionId && mongoose.Types.ObjectId.isValid(regionId)) {
                filter.$or = [{ regionId: new mongoose.Types.ObjectId(regionId) }, { regionId: null }];
            }
        }

        if (q) {
            filter.$or = [
                { title: { $regex: q, $options: "i" } },
                { slug: { $regex: q, $options: "i" } },
                { tags: { $elemMatch: { $regex: q, $options: "i" } } },
            ];
        }

        const docs = await DmsDocumentModel.find(filter)
            .populate({ path: "updatedBy", model: UserModel, select: "firstName lastName name email" })
            .sort({ updatedAt: -1 })
            .lean();

        if (!docs.length) {
            return NextResponse.json({ success: true, data: [] });
        }

        // Attach current version details (fast path)
        const currentIds = docs.map((d) => d.currentVersionId).filter(Boolean);
        const versions = currentIds.length
            ? await DmsDocumentVersionModel.find({ _id: { $in: currentIds } })
                .select("fileUrl mimeType versionNumber uploadedAt uploadedBy notes isArchived isCurrent")
                .lean()
            : [];

        const versionMap = new Map<string, any>(
            versions.map((v) => [String(v._id), v])
        );

        const data = docs
            .filter((d) => (currentOnly ? Boolean(d.currentVersionId) : true))
            .map((d) => ({
                ...d,
                currentVersion: d.currentVersionId ? versionMap.get(String(d.currentVersionId)) ?? null : null,
            }));

        return NextResponse.json({ success: true, data });
    } catch (error: any) {
        console.error("DMS documents GET error:", error);
        return NextResponse.json(
            { success: false, error: { message: "Failed to fetch documents", details: error?.message } },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const user = await getUserFromRequest(request);
        console.log("🚀 ~ POST ~ user:", user)

        // Restrict access to authenticated users
        if (!user) {
            return NextResponse.json(
                { success: false, error: { message: "Not authenticated" } },
                { status: 401 }
            );
        }

        const userRoles = user.roles ?? [];
        const roles = [user.role!, ...userRoles];

        // Check if roles contains "admin" or "manager"
        if (!roles.includes("admin") && !roles.includes("manager")) {
            return NextResponse.json(
                { success: false, error: { message: "Not authorized" } },
                { status: 403 }
            );
        }

        await connectToDatabase();

        const body = await request.json();

        if (body?.regionId === "") delete body.regionId;

        const parsed = CreateDocumentSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json(
                { success: false, error: { message: "Invalid payload", details: parsed.error.flatten() } },
                { status: 400 }
            );
        }

        // Inside POST handler after validation
        const payload = parsed.data;

        const baseSlug = payload.slug.trim().toLowerCase();

        let finalSlug = baseSlug;

        if (payload.regionId) {
            type RegionLean = { code?: string } | null;

            const region = await RegionModel
                .findById(payload.regionId)
                .select("code")
                .lean<RegionLean>();

            if (!region?.code) {
                return NextResponse.json({ success: false, error: { message: "Invalid regionId" } }, { status: 400 });
            }

            finalSlug = `${String(region.code).toUpperCase()}-${baseSlug}`;
        }

        const doc = await DmsDocumentModel.create({
            ...payload,
            baseSlug,
            slug: finalSlug,
            regionId: payload.regionId ?? null,
            createdBy: user._id,
            updatedBy: user._id,
            isActive: payload.isActive ?? true,
        });

        return NextResponse.json({ success: true, data: doc });
    } catch (error: any) {
        const isDup = error?.code === 11000;
        return NextResponse.json(
            {
                success: false,
                error: {
                    message: isDup ? "A document with this slug already exists" : "Failed to create document",
                    details: error?.message,
                },
            },
            { status: isDup ? 409 : 500 }
        );
    }
}
