import { NextRequest, NextResponse } from "next/server";

import { ISupplier, SupplierModel } from "@/app/models/ams/supplier.schema";
import { requireManagementFromRequest } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";

export async function GET(request: NextRequest) {
    try {
        await connectToDatabase();

        const auth = await requireManagementFromRequest(request);
        if (auth instanceof Response) return auth;

        const { searchParams } = new URL(request.url);
        const q = (searchParams.get("query") || "").trim();
        const active = searchParams.get("active"); // "true" | "false" | null

        const filter: any = {};
        if (active === "true") filter.isActive = true;
        if (active === "false") filter.isActive = false;

        if (q) {
            filter.$or = [
                { name: { $regex: q, $options: "i" } },
                { code: { $regex: q, $options: "i" } },
                { contactName: { $regex: q, $options: "i" } },
                { contactEmail: { $regex: q, $options: "i" } },
            ];
        }

        const suppliers = await SupplierModel.find(filter)
            .sort({ name: 1 })
            .lean<ISupplier[]>();

        return NextResponse.json({ success: true, data: suppliers });
    } catch (error: any) {
        return NextResponse.json(
            { success: false, error: error?.message || "Failed to fetch suppliers" },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        await connectToDatabase();

        const auth = await requireManagementFromRequest(request);
        if (auth instanceof Response) return auth;

        const { user } = auth;

        const body = await request.json();

        const name = (body?.name || "").trim();
        if (!name) {
            return NextResponse.json(
                { success: false, error: "Supplier name is required" },
                { status: 400 }
            );
        }

        const created = await SupplierModel.create({
            name,
            code: body?.code?.trim(),
            vatNumber: body?.vatNumber?.trim(),
            contactName: body?.contactName?.trim(),
            contactEmail: body?.contactEmail?.trim(),
            contactPhone: body?.contactPhone?.trim(),
            addressLine1: body?.addressLine1?.trim(),
            addressLine2: body?.addressLine2?.trim(),
            city: body?.city?.trim(),
            province: body?.province?.trim(),
            postalCode: body?.postalCode?.trim(),
            country: body?.country?.trim() || "South Africa",
            defaultWarrantyMonths:
                typeof body?.defaultWarrantyMonths === "number"
                    ? body.defaultWarrantyMonths
                    : undefined,
            isActive: body?.isActive ?? true,
            createdBy: user?._id,
        });

        return NextResponse.json({ success: true, data: created }, { status: 201 });
    } catch (error: any) {
        // Duplicate supplier name
        if (error?.code === 11000) {
            return NextResponse.json(
                { success: false, error: "Supplier already exists (duplicate name)" },
                { status: 409 }
            );
        }

        return NextResponse.json(
            { success: false, error: error?.message || "Failed to create supplier" },
            { status: 500 }
        );
    }
}
