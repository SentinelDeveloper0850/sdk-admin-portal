import { NextResponse } from "next/server";
import { importSocietiesFromCSV } from "@/server/actions/societies";
import { writeFile } from "fs/promises";
import path from "path";
import os from "os";
import { v4 as uuid } from "uuid";

// Must enable streaming for multipart parsing
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
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

    return NextResponse.json({ message: "CSV imported successfully" });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json(
      { message: error.message || "Failed to import prepaid societies" },
      { status: 500 }
    );
  }
}
