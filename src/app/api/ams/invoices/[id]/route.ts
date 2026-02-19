import { NextRequest, NextResponse } from "next/server";

import { requireManagementFromRequest } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";

import { AssetModel } from "@/app/models/ams/asset.schema";
import { PurchaseInvoiceModel } from "@/app/models/ams/purchase-invoice.schema";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectToDatabase();

    const auth = await requireManagementFromRequest(request);
    if (auth instanceof Response) return auth;

    const invoiceId = params.id;

    const invoice = await PurchaseInvoiceModel.findById(invoiceId)
      .populate("supplierId", "name code contactName contactEmail contactPhone")
      .lean();

    if (!invoice) {
      return NextResponse.json(
        { success: false, error: "Invoice not found" },
        { status: 404 }
      );
    }

    const assets = await AssetModel.find({ invoiceId })
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      data: {
        invoice,
        assets,
        assetCount: assets.length,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to fetch invoice details",
      },
      { status: 500 }
    );
  }
}
