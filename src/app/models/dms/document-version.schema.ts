// src/app/models/dms/document-version.schema.ts
import { model, models, Schema, Types } from "mongoose";

/** Prefer PDF-only for printing reliability; allow DOCX if you must. */
export const ALLOWED_MIME_TYPES = [
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
] as const;

export type AllowedMimeType = (typeof ALLOWED_MIME_TYPES)[number];

export interface IDmsDocumentVersion {
    documentId: Types.ObjectId;

    versionNumber: number; // 1..n, unique per document
    isCurrent: boolean;    // enforced to one-per-document in app logic
    isArchived: boolean;

    fileUrl: string;       // Cloudinary secure_url
    filePublicId: string;  // Cloudinary public_id
    mimeType: AllowedMimeType;
    originalFileName?: string;
    fileSizeBytes?: number;

    checksum?: string;     // optional (sha256) to detect duplicate uploads
    notes?: string;        // change log

    uploadedBy?: Types.ObjectId;
    uploadedAt: Date;

    createdAt: Date;
    updatedAt: Date;
}

const DmsDocumentVersionSchema = new Schema<IDmsDocumentVersion>(
    {
        documentId: {
            type: Schema.Types.ObjectId,
            ref: "DmsDocument",
            required: true,
            index: true,
        },

        versionNumber: { type: Number, required: true, min: 1 },

        isCurrent: { type: Boolean, default: false, index: true },
        isArchived: { type: Boolean, default: false, index: true },

        fileUrl: { type: String, required: true },
        filePublicId: { type: String, required: true },

        mimeType: { type: String, required: true, enum: ALLOWED_MIME_TYPES },

        originalFileName: { type: String, default: "" },
        fileSizeBytes: { type: Number },

        checksum: { type: String, default: "" },
        notes: { type: String, trim: true, default: "" },

        uploadedBy: { type: Schema.Types.ObjectId, ref: "users" },
        uploadedAt: { type: Date, default: () => new Date() },
    },
    { timestamps: true }
);

/** Each document version number must be unique per document */
DmsDocumentVersionSchema.index({ documentId: 1, versionNumber: 1 }, { unique: true });

/** Fast retrieval for "current version per document" */
DmsDocumentVersionSchema.index({ documentId: 1, isCurrent: 1, isArchived: 1 });

/**
 * Optional safety net:
 * “Only one current per document” partial unique index.
 * This works well in MongoDB with partialFilterExpression.
 */
DmsDocumentVersionSchema.index(
    { documentId: 1, isCurrent: 1 },
    { unique: true, partialFilterExpression: { isCurrent: true } }
);

export const DmsDocumentVersionModel =
    models.DmsDocumentVersion ||
    model<IDmsDocumentVersion>("DmsDocumentVersion", DmsDocumentVersionSchema);
