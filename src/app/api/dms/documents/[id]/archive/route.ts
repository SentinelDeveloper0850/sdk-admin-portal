import { getUserFromRequest } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import mongoose from "mongoose";
import { NextRequest, NextResponse } from "next/server";

import { DmsDocumentVersionModel } from "@/app/models/dms/document-version.schema";
import { DmsDocumentModel } from "@/app/models/dms/document.schema";

function userHasAnyRole(user: any, roles: string[]) {
    const userRoles: string[] = user?.roles ?? (user?.role ? [user.role] : []);
    return roles.some((r) => userRoles.includes(r));
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
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

        if (!userHasAnyRole(user, ["SYSTEM_ADMIN", "ADMIN", "MANAGER"])) {
            return NextResponse.json({ success: false, error: { message: "Not authorized" } }, { status: 403 });
        }

        await connectToDatabase();

        const versionId = params.id;

        const version = await DmsDocumentVersionModel.findOne({ _id: versionId });
        if (!version) return NextResponse.json({ success: false, error: { message: "Version not found" } }, { status: 404 });

        // If it is current, we must also clear the document's pointer (or force-select another version)
        const doc = await DmsDocumentModel.findOne({ _id: version.documentId });
        if (!doc) return NextResponse.json({ success: false, error: { message: "Document not found" } }, { status: 404 });

        await session.withTransaction(async () => {
            await DmsDocumentVersionModel.updateOne(
                { _id: versionId },
                { $set: { isArchived: true, isCurrent: false } },
                { session }
            );

            if (doc.currentVersionId && String(doc.currentVersionId) === String(version._id)) {
                doc.currentVersionId = undefined;

                // Optional “auto fallback to latest non-archived version”
                const fallback = await DmsDocumentVersionModel.findOne({
                    documentId: doc._id,
                    isArchived: false,
                    _id: { $ne: version._id },
                })
                    .sort({ versionNumber: -1 })
                    .session(session);

                if (fallback) {
                    doc.currentVersionId = fallback._id;
                    await DmsDocumentVersionModel.updateOne(
                        { _id: fallback._id },
                        { $set: { isCurrent: true } },
                        { session }
                    );
                }
            }

            doc.updatedBy = user._id;
            await doc.save({ session });
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("DMS archive version error:", error);
        return NextResponse.json(
            { success: false, error: { message: "Failed to archive version", details: error?.message } },
            { status: 500 }
        );
    } finally {
        session.endSession();
    }
}
