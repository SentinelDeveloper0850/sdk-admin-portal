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

const SetCurrentSchema = z.object({
    versionId: z.string().min(10),
});

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

        const documentId = params.id;

        const body = await request.json();
        const parsed = SetCurrentSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json(
                { success: false, error: { message: "Invalid payload", details: parsed.error.flatten() } },
                { status: 400 }
            );
        }

        const { versionId } = parsed.data;

        const doc = await DmsDocumentModel.findOne({ _id: documentId });
        if (!doc) return NextResponse.json({ success: false, error: { message: "Document not found" } }, { status: 404 });

        const version = await DmsDocumentVersionModel.findOne({ _id: versionId, documentId, isArchived: false });
        if (!version) return NextResponse.json({ success: false, error: { message: "Version not found" } }, { status: 404 });

        await session.withTransaction(async () => {
            await DmsDocumentVersionModel.updateMany(
                { documentId, isCurrent: true },
                { $set: { isCurrent: false } },
                { session }
            );

            await DmsDocumentVersionModel.updateOne(
                { _id: versionId },
                { $set: { isCurrent: true } },
                { session }
            );

            doc.currentVersionId = version._id;
            doc.updatedBy = user._id;
            await doc.save({ session });
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("DMS set current error:", error);
        return NextResponse.json(
            { success: false, error: { message: "Failed to set current version", details: error?.message } },
            { status: 500 }
        );
    } finally {
        session.endSession();
    }
}
