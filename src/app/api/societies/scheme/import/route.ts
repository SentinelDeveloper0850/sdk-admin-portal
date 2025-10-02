import { NextRequest, NextResponse } from "next/server";

import { writeFile } from "fs/promises";
import os from "os";
import path from "path";
import { v4 as uuid } from "uuid";

import { getUserFromRequest } from "@/lib/auth";
import { createAuditLog } from "@/server/actions/audit";
import { importSocietiesFromCSV } from "@/server/actions/societies/scheme";

// Must enable streaming for multipart parsing
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("file") as File;

  if (!file) {
    return NextResponse.json({ message: "No file uploaded" }, { status: 400 });
  }

  try {
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const tmpUploadPath = path.join(os.tmpdir(), `${uuid()}.csv`);
    await writeFile(tmpUploadPath, buffer);

    await importSocietiesFromCSV(tmpUploadPath);

    // Audit log (success)
    try {
      const user = await getUserFromRequest(req);
      const ipHeader = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip");
      const ip = (ipHeader ? ipHeader.split(",")[0].trim() : null) as string | null;
      const userAgent = req.headers.get("user-agent") || null;

      await createAuditLog({
        action: "scheme-societies.import",
        resourceType: "prepaid-society",
        performedBy: user
          ? {
            id: user._id?.toString?.(),
            name: (user as any).name,
            email: (user as any).email,
            role: (user as any).role,
          }
          : {},
        ip,
        userAgent,
        details: {
          fileName: file.name,
          fileSize: buffer.byteLength,
          tempPath: tmpUploadPath,
        },
        outcome: "success",
        severity: "high",
        tags: ["import"],
      });
    } catch (e) {
      console.error("Failed to write audit log for scheme-societies import:", (e as any)?.message);
    }

    return NextResponse.json({ message: "CSV imported successfully" });
  } catch (error: any) {
    console.error(error);
    // Audit log (failure)
    try {
      const user = await getUserFromRequest(req as any);
      const ipHeader = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip");
      const ip = (ipHeader ? ipHeader.split(",")[0].trim() : null) as string | null;
      const userAgent = req.headers.get("user-agent") || null;

      await createAuditLog({
        action: "scheme-societies.import",
        resourceType: "prepaid-society",
        performedBy: user
          ? {
            id: user._id?.toString?.(),
            name: (user as any).name,
            email: (user as any).email,
            role: (user as any).role,
          }
          : {},
        ip,
        userAgent,
        details: {
          error: error?.message,
        },
        outcome: "failure",
        severity: "high",
        tags: ["import"],
      });
    } catch (e) {
      console.error("Failed to write audit log for scheme-societies import (failure):", (e as any)?.message);
    }
    return NextResponse.json(
      { message: error.message || "Failed to import scheme societies" },
      { status: 500 }
    );
  }
}
