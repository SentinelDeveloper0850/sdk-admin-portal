// src/app/models/ams/supplier.schema.ts
import { model, models, Schema, Types } from "mongoose";

export interface ISupplier {
    name: string; // "PC International"
    code?: string; // "PCINT" (optional, for tagging)
    vatNumber?: string;

    contactName?: string;
    contactEmail?: string;
    contactPhone?: string;

    addressLine1?: string;
    addressLine2?: string;
    city?: string;
    province?: string;
    postalCode?: string;
    country?: string; // default "South Africa"

    defaultWarrantyMonths?: number; // e.g. 12
    isActive: boolean;

    createdBy?: Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const SupplierSchema = new Schema<ISupplier>(
    {
        name: { type: String, required: true, trim: true, unique: true },
        code: { type: String, trim: true },
        vatNumber: { type: String, trim: true },

        contactName: { type: String, trim: true },
        contactEmail: { type: String, trim: true },
        contactPhone: { type: String, trim: true },

        addressLine1: { type: String, trim: true },
        addressLine2: { type: String, trim: true },
        city: { type: String, trim: true },
        province: { type: String, trim: true },
        postalCode: { type: String, trim: true },
        country: { type: String, trim: true, default: "South Africa" },

        defaultWarrantyMonths: { type: Number, min: 0 },
        isActive: { type: Boolean, default: true },

        createdBy: { type: Schema.Types.ObjectId, ref: "User" },
    },
    { timestamps: true }
);

SupplierSchema.index({ name: 1 }, { unique: true });

export const SupplierModel =
    models.Supplier || model<ISupplier>("Supplier", SupplierSchema);
