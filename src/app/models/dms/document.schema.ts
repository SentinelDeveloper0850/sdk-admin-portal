// src/app/models/dms/document.schema.ts
import { model, models, Schema, Types } from "mongoose";

/** Keep categories tight. You can expand later. */
export const DOCUMENT_CATEGORIES = [
    "FORMS",
    "CLAIMS",
    "TERMS",
    "POLICIES",
    "HR",
    "BRANCH_OPS",
    "OTHER",
] as const;

export type DocumentCategory = (typeof DOCUMENT_CATEGORIES)[number];

export interface IDmsDocument {
    title: string;              // "Joining Form"
    slug: string;               // "joining-form" (unique per org)
    baseSlug?: string;           // "joining-form" (original slug, for immutability if slug changes)
    category: DocumentCategory;

    description?: string;
    tags?: string[];

    /** Points at the current version document_versions._id */
    currentVersionId?: Types.ObjectId;
    regionId?: Types.ObjectId | null;

    isActive: boolean;

    createdBy?: Types.ObjectId;
    updatedBy?: Types.ObjectId;

    createdAt: Date;
    updatedAt: Date;
}

const DmsDocumentSchema = new Schema<IDmsDocument>(
    {
        title: { type: String, required: true, trim: true },
        slug: { type: String, required: true, trim: true, lowercase: true },
        baseSlug: { type: String, trim: true, lowercase: true, default: "" }, // optional but helpful

        category: {
            type: String,
            required: true,
            enum: DOCUMENT_CATEGORIES,
            index: true,
        },

        description: { type: String, trim: true, default: "" },
        tags: { type: [String], default: [] },

        currentVersionId: { type: Schema.Types.ObjectId, ref: "DmsDocumentVersion" },
        regionId: { type: Schema.Types.ObjectId, ref: "Region", default: null, index: true },

        isActive: { type: Boolean, default: true, index: true },

        createdBy: { type: Schema.Types.ObjectId, ref: "User" },
        updatedBy: { type: Schema.Types.ObjectId, ref: "User" },
    },
    { timestamps: true }
);

/**
 * Slug unique PER org (multi-tenant).
 * This prevents two "joining-form" inside same org.
 */
DmsDocumentSchema.index({ slug: 1 }, { unique: true });

/** Optional: quick lookup for lists */
DmsDocumentSchema.index({ regionId: 1, category: 1, isActive: 1, updatedAt: -1 });

export const DmsDocumentModel =
    models.DmsDocument || model<IDmsDocument>("DmsDocument", DmsDocumentSchema);
