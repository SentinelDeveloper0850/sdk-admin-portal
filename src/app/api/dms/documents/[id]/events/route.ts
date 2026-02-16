import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { getUserFromRequest } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";

import { DmsDocumentEventModel } from "@/app/models/dms/document-event.schema";
import { DmsDocumentModel } from "@/app/models/dms/document.schema";

const EventSchema = z.object({
    eventType: z.enum(["PRINT"]),
});

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const user = await getUserFromRequest(request);
        if (!user) {
            return NextResponse.json({ success: false, error: { message: "Not authenticated" } }, { status: 401 });
        }

        await connectToDatabase();

        const body = await request.json();
        const parsed = EventSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json(
                { success: false, error: { message: "Invalid payload", details: parsed.error.flatten() } },
                { status: 400 }
            );
        }

        const documentId = params.id;

        // Ensure doc exists (prevents garbage stats)
        const doc = await DmsDocumentModel.findById(documentId).select("regionId");
        if (!doc) {
            return NextResponse.json({ success: false, error: { message: "Document not found" } }, { status: 404 });
        }

        await DmsDocumentEventModel.create({
            documentId,
            userId: user._id,
            regionId: doc.regionId ?? null,
            eventType: parsed.data.eventType,
            userAgent: request.headers.get("user-agent") ?? "",
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json(
            { success: false, error: { message: "Failed to log event", details: error?.message } },
            { status: 500 }
        );
    }
}
