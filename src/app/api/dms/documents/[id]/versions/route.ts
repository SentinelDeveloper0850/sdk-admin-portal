import mongoose from "mongoose";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { getUserFromRequest } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";

import { DmsDocumentVersionModel } from "@/app/models/dms/document-version.schema";
import { DmsDocumentModel } from "@/app/models/dms/document.schema";

function userHasAnyRole(user: any, roles: string[]) {
    const userRoles: string[] = user?.roles ?? (user?.role ? [user.role] : []);
    return roles.some((r) => userRoles.includes(r));
}

const UploadVersionSchema = z.object({
    // Cloudinary
    fileUrl: z.string().url(),
    filePublicId: z.string().min(2),
    mimeType: z.enum([
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ]),
    originalFileName: z.string().optional(),
    fileSizeBytes: z.number().int().positive().optional(),

    // DMS
    notes: z.string().optional(),
    setAsCurrent: z.boolean().optional().default(true),
});

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
    const session = await mongoose.startSession();

    try {
        const user = await getUserFromRequest(request);

        // Restrict to authenticated users
        if (!user) {
            return NextResponse.json(
                { success: false, error: { message: "Not authenticated" } },
                { status: 401 }
            );
        }

        const userRoles = user.roles ?? [];
        const roles = [user.role!, ...userRoles];

        // Check if roles contains "admin" or "manager"
        if (!roles.includes("admin") && !roles.includes("manager")) {
            return NextResponse.json(
                { success: false, error: { message: "Not authorized" } },
                { status: 403 }
            );
        }

        await connectToDatabase();

        const documentId = params.id;

        const body = await request.json();
        const parsed = UploadVersionSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json(
                { success: false, error: { message: "Invalid payload", details: parsed.error.flatten() } },
                { status: 400 }
            );
        }

        const payload = parsed.data;

        const doc = await DmsDocumentModel.findOne({ _id: documentId });
        if (!doc) {
            return NextResponse.json({ success: false, error: { message: "Document not found" } }, { status: 404 });
        }

        // Determine next version number
        const last = await DmsDocumentVersionModel.findOne({ documentId })
            .sort({ versionNumber: -1 });

        const nextVersion = (last?.versionNumber ?? 0) + 1;

        // Use transaction when possible (replica set); otherwise it still works without atomic guarantees.
        let createdVersion: any = null;

        await session.withTransaction(async () => {
            // If setting current, unset any existing current first
            if (payload.setAsCurrent) {
                await DmsDocumentVersionModel.updateMany(
                    { documentId, isCurrent: true },
                    { $set: { isCurrent: false } },
                    { session }
                );
            }

            createdVersion = await DmsDocumentVersionModel.create(
                [
                    {
                        documentId,
                        versionNumber: nextVersion,
                        isCurrent: Boolean(payload.setAsCurrent),
                        isArchived: false,

                        fileUrl: payload.fileUrl,
                        filePublicId: payload.filePublicId,
                        mimeType: payload.mimeType,
                        originalFileName: payload.originalFileName ?? "",
                        fileSizeBytes: payload.fileSizeBytes,

                        notes: payload.notes ?? "",
                        uploadedBy: user._id,
                        uploadedAt: new Date(),
                    },
                ],
                { session }
            ).then((arr) => arr[0]);

            // Update document pointer
            if (payload.setAsCurrent) {
                doc.currentVersionId = createdVersion._id;
            }
            doc.updatedBy = user._id;
            await doc.save({ session });
        });

        return NextResponse.json({ success: true, data: createdVersion });
    } catch (error: any) {
        console.error("DMS upload version error:", error);
        return NextResponse.json(
            { success: false, error: { message: "Failed to upload version", details: error?.message } },
            { status: 500 }
        );
    } finally {
        session.endSession();
    }
}
