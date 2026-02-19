import { NextRequest, NextResponse } from "next/server";

import { requireManagementFromRequest } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";

import { AssetModel } from "@/app/models/ams/asset.schema";
import { CounterModel } from "@/app/models/ams/counter.schema";
import { IPurchaseInvoice, PurchaseInvoiceModel } from "@/app/models/ams/purchase-invoice.schema";
import { ISupplier, SupplierModel } from "@/app/models/ams/supplier.schema";

function addMonths(date: Date, months: number) {
    const d = new Date(date);
    const day = d.getDate();
    d.setMonth(d.getMonth() + months);

    // Handle month rollover (e.g. Jan 31 + 1 month)
    if (d.getDate() < day) d.setDate(0);
    return d;
}

async function nextAssetTag() {
    const counter = await CounterModel.findOneAndUpdate(
        { key: "assetTag" },
        { $inc: { seq: 1 } },
        { upsert: true, new: true }
    );

    const seq = counter.seq;
    return `AMS-${String(seq).padStart(6, "0")}`;
}

export async function POST(request: NextRequest) {
    try {
        await connectToDatabase();

        const auth = await requireManagementFromRequest(request);
        if (auth instanceof Response) return auth;

        const { user } = auth;

        const body = await request.json();

        const invoiceId = body?.invoiceId;
        const supplierId = body?.supplierId;
        const purchaseDateRaw = body?.purchaseDate;

        const assets = Array.isArray(body?.assets) ? body.assets : [];

        if (!invoiceId) {
            return NextResponse.json(
                { success: false, error: "invoiceId is required" },
                { status: 400 }
            );
        }
        if (!supplierId) {
            return NextResponse.json(
                { success: false, error: "supplierId is required" },
                { status: 400 }
            );
        }
        if (!purchaseDateRaw) {
            return NextResponse.json(
                { success: false, error: "purchaseDate is required" },
                { status: 400 }
            );
        }

        const purchaseDate = new Date(purchaseDateRaw);
        if (isNaN(purchaseDate.getTime())) {
            return NextResponse.json(
                { success: false, error: "purchaseDate must be a valid date" },
                { status: 400 }
            );
        }

        if (!assets.length) {
            return NextResponse.json(
                { success: false, error: "assets array is required (at least 1 item)" },
                { status: 400 }
            );
        }

        const supplier = await SupplierModel.findById(supplierId).lean<ISupplier>();
        if (!supplier) {
            return NextResponse.json(
                { success: false, error: "Supplier not found" },
                { status: 404 }
            );
        }

        const invoice = await PurchaseInvoiceModel.findById(invoiceId).lean<IPurchaseInvoice>();
        if (!invoice) {
            return NextResponse.json(
                { success: false, error: "Invoice not found" },
                { status: 404 }
            );
        }

        // Quick sanity: invoice belongs to supplier
        if (String(invoice.supplierId) !== String(supplierId)) {
            return NextResponse.json(
                {
                    success: false,
                    error: "Invoice does not belong to supplierId provided",
                },
                { status: 400 }
            );
        }

        // Validate + normalize payload
        const normalized = [];
        const seenSerials = new Set<string>();

        for (let i = 0; i < assets.length; i++) {
            const row = assets[i] || {};

            const name = (row?.name || "").trim();
            const category = (row?.category || "").trim();
            const serialNumber = (row?.serialNumber || "").trim();

            if (!name) {
                return NextResponse.json(
                    { success: false, error: `Row ${i + 1}: name is required` },
                    { status: 400 }
                );
            }
            if (!category) {
                return NextResponse.json(
                    { success: false, error: `Row ${i + 1}: category is required` },
                    { status: 400 }
                );
            }
            if (!serialNumber) {
                return NextResponse.json(
                    { success: false, error: `Row ${i + 1}: serialNumber is required` },
                    { status: 400 }
                );
            }

            const serialKey = serialNumber.toLowerCase();
            if (seenSerials.has(serialKey)) {
                return NextResponse.json(
                    {
                        success: false,
                        error: `Duplicate serialNumber in request payload: "${serialNumber}" (row ${i + 1})`,
                    },
                    { status: 400 }
                );
            }
            seenSerials.add(serialKey);

            const warrantyMonths =
                typeof row?.warrantyMonths === "number"
                    ? row.warrantyMonths
                    : typeof supplier?.defaultWarrantyMonths === "number"
                        ? supplier.defaultWarrantyMonths
                        : undefined;

            const warrantyExpiryDate =
                typeof warrantyMonths === "number"
                    ? addMonths(purchaseDate, warrantyMonths)
                    : undefined;

            normalized.push({
                name,
                category,
                brand: row?.brand?.trim(),
                model: row?.model?.trim(),
                serialNumber,
                purchasePrice:
                    typeof row?.purchasePrice === "number" ? row.purchasePrice : undefined,
                purchaseDate,
                supplierId,
                invoiceId,
                warrantyMonths,
                warrantyExpiryDate,
                notes: row?.notes?.trim(),
                status: "In Storage",
                createdBy: user?._id,
            });
        }

        // Create assets (generate tags per row)
        const createdDocs = [];
        for (const row of normalized) {
            const assetTag = await nextAssetTag();
            const doc = await AssetModel.create({ ...row, assetTag });
            createdDocs.push(doc);
        }

        return NextResponse.json(
            { success: true, data: createdDocs, count: createdDocs.length },
            { status: 201 }
        );
    } catch (error: any) {
        // Duplicate key issues (serialNumber unique OR assetTag unique)
        if (error?.code === 11000) {
            const msg = error?.message || "";
            const isSerialDup = msg.includes("serialNumber");

            return NextResponse.json(
                {
                    success: false,
                    error: isSerialDup
                        ? "Duplicate serial number detected (this asset already exists)"
                        : "Duplicate key error while creating assets",
                    meta: { code: 11000 },
                },
                { status: 409 }
            );
        }

        return NextResponse.json(
            { success: false, error: error?.message || "Failed bulk asset intake" },
            { status: 500 }
        );
    }
}
