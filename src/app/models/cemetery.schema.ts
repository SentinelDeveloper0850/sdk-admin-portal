// src/app/models/configuration/cemetery.schema.ts (or wherever you keep it)
import mongoose, { Schema } from "mongoose";

export interface ICemetery {
  code: string; // stable identifier (unique)
  name: string; // display name (not unique by itself)

  // form fields
  branchId?: string; // optional single link (matches your UI)
  address?: string;
  city: string;
  province: string;
  postalCode?: string;

  latitude?: number;
  longitude?: number;

  isActive: boolean;

  createdBy?: string;
  updatedBy?: string;

  createdAt?: Date;
  updatedAt?: Date;
}

const CemeterySchema = new Schema<ICemetery>(
  {
    code: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    name: { type: String, required: true, trim: true },

    branchId: { type: String, index: true }, // optional

    address: { type: String, trim: true },
    city: { type: String, required: true, trim: true, index: true },
    province: { type: String, required: true, trim: true, index: true },
    postalCode: { type: String, trim: true },

    latitude: { type: Number, min: -90, max: 90 },
    longitude: { type: Number, min: -180, max: 180 },

    isActive: { type: Boolean, default: true, index: true },

    createdBy: { type: String },
    updatedBy: { type: String },
  },
  { timestamps: true }
);

// ✅ real-world uniqueness: same name can exist in other cities/provinces
CemeterySchema.index({ name: 1, city: 1, province: 1 }, { unique: true });

// ✅ system identity
CemeterySchema.index({ code: 1 }, { unique: true });

export const CemeteryModel =
  mongoose.models.cemeteries ||
  mongoose.model<ICemetery>("cemeteries", CemeterySchema, "cemeteries");
