import { NextRequest, NextResponse } from "next/server";

import { requireManagementFromRequest } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";

import { AssetModel, IAsset } from "@/app/models/ams/asset.schema";

export async function GET(request: NextRequest) {
    try {
        await connectToDatabase();

        const auth = await requireManagementFromRequest(request);
        if (auth instanceof Response) return auth;

        const { searchParams } = new URL(request.url);
        const q = (searchParams.get("q") || "").trim();
        const status = searchParams.get("status");
        const category = searchParams.get("category");
        const supplierId = searchParams.get("supplierId");
        const warrantyExpiringDays = searchParams.get("warrantyExpiringDays");

        const filter: any = {};
        if (status) filter.status = status;
        if (category) filter.category = category;
        if (supplierId) filter.supplierId = supplierId;

        if (q) {
            filter.$or = [
                { assetTag: { $regex: q, $options: "i" } },
                { name: { $regex: q, $options: "i" } },
                { serialNumber: { $regex: q, $options: "i" } },
                { brand: { $regex: q, $options: "i" } },
                { model: { $regex: q, $options: "i" } },
            ];
        }

        if (warrantyExpiringDays) {
            const days = Number(warrantyExpiringDays);
            if (!Number.isNaN(days) && days > 0) {
                const now = new Date();
                const end = new Date(now);
                end.setDate(end.getDate() + days);
                filter.warrantyExpiryDate = { $gte: now, $lte: end };
            }
        }

        const assets = await AssetModel.find(filter)
            .populate("supplierId", "name code")
            .populate("invoiceId", "invoiceNumber purchaseDate fileUrl")
            .sort({ createdAt: -1 })
            .lean<IAsset[]>();

        return NextResponse.json({ success: true, data: assets });
    } catch (error: any) {
        return NextResponse.json(
            { success: false, error: error?.message || "Failed to fetch assets" },
            { status: 500 }
        );
    }
}
