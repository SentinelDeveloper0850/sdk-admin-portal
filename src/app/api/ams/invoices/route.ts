import { NextRequest, NextResponse } from "next/server";

import { requireManagementFromRequest } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";

import { IPurchaseInvoice, PurchaseInvoiceModel } from "@/app/models/ams/purchase-invoice.schema";
import { ISupplier, SupplierModel } from "@/app/models/ams/supplier.schema";

export async function GET(request: NextRequest) {
    try {
        await connectToDatabase();

        const auth = await requireManagementFromRequest(request);
        if (auth instanceof Response) return auth;

        const { searchParams } = new URL(request.url);
        const supplierId = searchParams.get("supplierId");
        const q = (searchParams.get("q") || "").trim();
        const from = searchParams.get("from"); // ISO date
        const to = searchParams.get("to"); // ISO date

        const filter: any = {};
        if (supplierId) filter.supplierId = supplierId;

        if (from || to) {
            filter.purchaseDate = {};
            if (from) filter.purchaseDate.$gte = new Date(from);
            if (to) filter.purchaseDate.$lte = new Date(to);
        }

        if (q) {
            filter.$or = [
                { invoiceNumber: { $regex: q, $options: "i" } },
                { notes: { $regex: q, $options: "i" } },
            ];
        }

        const invoices = await PurchaseInvoiceModel.find(filter)
            .populate("supplierId", "name code")
            .sort({ purchaseDate: -1, createdAt: -1 })
            .lean<IPurchaseInvoice[]>();

        return NextResponse.json({ success: true, data: invoices });
    } catch (error: any) {
        return NextResponse.json(
            { success: false, error: error?.message || "Failed to fetch invoices" },
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

        const supplierId = body?.supplierId;
        const invoiceNumber = (body?.invoiceNumber || "").trim();
        const purchaseDate = body?.purchaseDate ? new Date(body.purchaseDate) : null;
        const fileUrl = (body?.fileUrl || "").trim();

        if (!supplierId) {
            return NextResponse.json(
                { success: false, error: "supplierId is required" },
                { status: 400 }
            );
        }
        if (!invoiceNumber) {
            return NextResponse.json(
                { success: false, error: "invoiceNumber is required" },
                { status: 400 }
            );
        }
        if (!purchaseDate || isNaN(purchaseDate.getTime())) {
            return NextResponse.json(
                { success: false, error: "purchaseDate is required and must be valid" },
                { status: 400 }
            );
        }
        if (!fileUrl) {
            return NextResponse.json(
                { success: false, error: "fileUrl is required (invoice PDF upload)" },
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

        const created = await PurchaseInvoiceModel.create({
            supplierId,
            invoiceNumber,
            purchaseDate,
            totalAmount:
                typeof body?.totalAmount === "number" ? body.totalAmount : undefined,
            fileUrl,
            filePublicId: body?.filePublicId?.trim(),
            notes: body?.notes?.trim(),
            createdBy: user?._id,
        });

        return NextResponse.json({ success: true, data: created }, { status: 201 });
    } catch (error: any) {
        // Duplicate invoice number per supplier
        if (error?.code === 11000) {
            return NextResponse.json(
                {
                    success: false,
                    error: "Invoice already exists for this supplier (duplicate invoice number)",
                },
                { status: 409 }
            );
        }

        return NextResponse.json(
            { success: false, error: error?.message || "Failed to create invoice" },
            { status: 500 }
        );
    }
}
