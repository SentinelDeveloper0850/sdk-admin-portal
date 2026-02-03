import { NextRequest, NextResponse } from "next/server";

import mongoose from "mongoose";

import { CemeteryModel } from "@/app/models/cemetery.schema";
import { getUserFromRequest } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";

function jsonOk(data: any, init?: ResponseInit) {
  return NextResponse.json(
    { success: true, ...data },
    { status: 200, ...init }
  );
}
function jsonErr(message: string, status = 400) {
  return NextResponse.json({ success: false, message }, { status });
}

const CODE_RE = /^[A-Z0-9-]+$/;

function normalizeCode(input?: string) {
  const s = String(input ?? "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "-");
  return s || undefined;
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return jsonErr("Unauthorized", 401);

    const { id } = params;
    if (!mongoose.Types.ObjectId.isValid(id)) return jsonErr("Invalid id", 400);

    await connectToDatabase();

    const item = await CemeteryModel.findById(id).lean();
    if (!item) return jsonErr("Not found", 404);

    return jsonOk({ data: item });
  } catch (e) {
    console.error("GET /configurations/cemeteries/:id error:", e);
    return jsonErr("Failed to fetch cemetery", 500);
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return jsonErr("Unauthorized", 401);

    const { id } = params;
    if (!mongoose.Types.ObjectId.isValid(id)) return jsonErr("Invalid id", 400);

    const body = await req.json();

    const patch: any = {};

    if (body?.name !== undefined) patch.name = String(body.name).trim();
    if (body?.code !== undefined) patch.code = normalizeCode(body.code);
    if (body?.address !== undefined) patch.address = String(body.address || "");
    if (body?.city !== undefined) patch.city = String(body.city || "");
    if (body?.province !== undefined)
      patch.province = String(body.province || "");
    if (body?.postalCode !== undefined)
      patch.postalCode = String(body.postalCode || "");
    if (body?.latitude !== undefined)
      patch.latitude = body.latitude ?? undefined;
    if (body?.longitude !== undefined)
      patch.longitude = body.longitude ?? undefined;
    if (body?.isActive !== undefined) patch.isActive = !!body.isActive;

    if (patch.code && !CODE_RE.test(patch.code)) {
      return jsonErr("Invalid code. Use only A-Z, 0-9 and -", 400);
    }

    patch.updatedBy = String(user._id);

    await connectToDatabase();

    // Prevent code collisions if code is being changed
    if (patch.code) {
      const dup = await CemeteryModel.findOne({
        _id: { $ne: id },
        code: patch.code,
      }).lean();
      if (dup) return jsonErr("Cemetery code already exists", 409);
    }

    const updated = await CemeteryModel.findByIdAndUpdate(id, patch, {
      new: true,
    });
    if (!updated) return jsonErr("Not found", 404);

    return jsonOk({ data: updated });
  } catch (e: any) {
    console.error("PUT /configurations/cemeteries/:id error:", e);
    if (e?.code === 11000)
      return jsonErr("Duplicate cemetery (name/code).", 409);
    return jsonErr("Failed to update cemetery", 500);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return jsonErr("Unauthorized", 401);

    const { id } = params;
    if (!mongoose.Types.ObjectId.isValid(id)) return jsonErr("Invalid id", 400);

    await connectToDatabase();

    const deleted = await CemeteryModel.findByIdAndDelete(id);
    if (!deleted) return jsonErr("Not found", 404);

    return jsonOk({ message: "Cemetery deleted" });
  } catch (e) {
    console.error("DELETE /configurations/cemeteries/:id error:", e);
    return jsonErr("Failed to delete cemetery", 500);
  }
}
