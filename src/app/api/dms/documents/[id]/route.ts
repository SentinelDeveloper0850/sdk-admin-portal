import { getUserFromRequest } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

import { DmsDocumentVersionModel } from "@/app/models/dms/document-version.schema";
import { DmsDocumentModel } from "@/app/models/dms/document.schema";

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const user = await getUserFromRequest(request);
        await connectToDatabase();

        const docId = params.id;

        const doc = await DmsDocumentModel.findOne({ _id: docId }).lean();
        if (!doc) {
            return NextResponse.json({ success: false, error: { message: "Not found" } }, { status: 404 });
        }

        const versions = await DmsDocumentVersionModel.find({ documentId: docId })
            .sort({ versionNumber: -1 })
            .lean();

        return NextResponse.json({
            success: true,
            data: {
                ...doc,
                versions,
            },
        });
    } catch (error: any) {
        console.error("DMS document GET error:", error);
        return NextResponse.json(
            { success: false, error: { message: "Failed to fetch document", details: error?.message } },
            { status: 500 }
        );
    }
}
