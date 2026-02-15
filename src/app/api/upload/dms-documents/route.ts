import { NextRequest, NextResponse } from "next/server";

import { cloudinary } from "@/lib/cloudinary";

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get("file") as File | null;

        if (!file) {
            return NextResponse.json(
                { success: false, message: "No file provided" },
                { status: 400 }
            );
        }

        // Optional: enforce PDF only for v1 uploads
        if (file.type !== "application/pdf") {
            return NextResponse.json(
                { success: false, message: "Only PDF files are allowed" },
                { status: 400 }
            );
        }

        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const uploadResult = await new Promise<any>((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
                {
                    folder: "dms/documents",
                    resource_type: "auto",
                },
                (err, result) => {
                    if (err) {
                        console.error("Cloudinary upload error:", err);
                        reject(err);
                    } else {
                        resolve(result);
                    }
                }
            );
            stream.end(buffer);
        });

        return NextResponse.json({
            success: true,
            data: {
                url: uploadResult.secure_url,
                publicId: uploadResult.public_id,
                bytes: uploadResult.bytes,
                originalFilename: uploadResult.original_filename,
                format: uploadResult.format, // e.g. "pdf"
            },
        });
    } catch (err) {
        console.error("DMS document upload failed:", err);
        return NextResponse.json(
            { success: false, message: "Internal Server Error" },
            { status: 500 }
        );
    }
}
