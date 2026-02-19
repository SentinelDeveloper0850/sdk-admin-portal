// src/app/models/ams/purchase-invoice.schema.ts
import { model, models, Schema, Types } from "mongoose";

export interface IPurchaseInvoice {
    supplierId: Types.ObjectId;

    invoiceNumber: string;
    purchaseDate: Date;
    totalAmount?: number;

    fileUrl: string;       // Cloudinary URL
    filePublicId?: string; // Cloudinary public_id

    notes?: string;

    createdBy: Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const PurchaseInvoiceSchema = new Schema<IPurchaseInvoice>(
    {
        supplierId: { type: Schema.Types.ObjectId, ref: "Supplier", required: true },

        invoiceNumber: { type: String, required: true, trim: true },
        purchaseDate: { type: Date, required: true },
        totalAmount: { type: Number, min: 0 },

        fileUrl: { type: String, required: true, trim: true },
        filePublicId: { type: String, trim: true },

        notes: { type: String, trim: true },

        createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    },
    { timestamps: true }
);

// prevent duplicates per supplier
PurchaseInvoiceSchema.index({ supplierId: 1, invoiceNumber: 1 }, { unique: true });

export const PurchaseInvoiceModel =
    models.PurchaseInvoice ||
    model<IPurchaseInvoice>("PurchaseInvoice", PurchaseInvoiceSchema);
