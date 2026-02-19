// src/app/models/ams/asset.schema.ts
import { model, models, Schema, Types } from "mongoose";

export type AssetCategory =
    | "Laptop"
    | "Desktop"
    | "Monitor"
    | "Printer"
    | "Router"
    | "Switch"
    | "UPS"
    | "Mobile Device"
    | "Other";

export interface IAsset {
    assetTag: string; // AMS-000001
    name: string;
    category: AssetCategory;

    brand?: string;
    model?: string;

    serialNumber: string;

    purchasePrice?: number;
    purchaseDate: Date;

    supplierId: Types.ObjectId;
    invoiceId: Types.ObjectId;

    warrantyMonths?: number;
    warrantyExpiryDate?: Date;
    warrantyDocUrl?: string;
    warrantyDocPublicId?: string;

    status: "In Storage" | "Assigned";
    assignedTo?: Types.ObjectId; // Staff/User later
    assignedAt?: Date;

    notes?: string;

    createdBy: Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const AssetSchema = new Schema<IAsset>(
    {
        assetTag: { type: String, required: true, trim: true, unique: true },
        name: { type: String, required: true, trim: true },
        category: {
            type: String,
            required: true,
            enum: [
                "Laptop",
                "Desktop",
                "Monitor",
                "Printer",
                "Router",
                "Switch",
                "UPS",
                "Mobile Device",
                "Other",
            ],
        },

        brand: { type: String, trim: true },
        model: { type: String, trim: true },

        serialNumber: { type: String, required: true, trim: true },

        purchasePrice: { type: Number, min: 0 },
        purchaseDate: { type: Date, required: true },

        supplierId: { type: Schema.Types.ObjectId, ref: "Supplier", required: true },
        invoiceId: { type: Schema.Types.ObjectId, ref: "PurchaseInvoice", required: true },

        warrantyMonths: { type: Number, min: 0 },
        warrantyExpiryDate: { type: Date },
        warrantyDocUrl: { type: String, trim: true },
        warrantyDocPublicId: { type: String, trim: true },

        status: { type: String, enum: ["In Storage", "Assigned"], default: "In Storage" },
        assignedTo: { type: Schema.Types.ObjectId, ref: "User" },
        assignedAt: { type: Date },

        notes: { type: String, trim: true },

        createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    },
    { timestamps: true }
);

// Serial numbers must be unique (case-insensitive-ish approach)
AssetSchema.index(
    { serialNumber: 1 },
    { unique: true, collation: { locale: "en", strength: 2 } }
);

export const AssetModel = models.Asset || model<IAsset>("Asset", AssetSchema);
