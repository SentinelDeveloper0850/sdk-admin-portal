import { NextRequest, NextResponse } from "next/server";

import { RegionModel } from "@/app/models/system/region.schema";
import { getUserFromRequest } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromRequest(request);
    if (!user)
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );

    const { id } = await params;
    const body = await request.json();
    await connectToDatabase();

    const allowed: Record<string, any> = {};
    if (body?.name !== undefined) allowed.name = String(body.name).trim();
    if (body?.code !== undefined)
      allowed.code = String(body.code).trim().toUpperCase();
    if (body?.province !== undefined) allowed.province = body.province;
    if (body?.manager !== undefined) allowed.manager = body.manager;
    if (body?.isActive !== undefined) allowed.isActive = Boolean(body.isActive);

    const updated = await RegionModel.findByIdAndUpdate(
      id,
      { $set: { ...allowed, updatedBy: user._id, updatedAt: new Date() } },
      { new: true, runValidators: true }
    );

    if (!updated) {
      return NextResponse.json(
        { success: false, error: "Region not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: updated,
      message: "Region updated successfully",
    });
  } catch (error) {
    console.error("Error updating region:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update region" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromRequest(request);
    if (!user)
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );

    const { id } = await params;
    await connectToDatabase();

    const deleted = await RegionModel.findByIdAndDelete(id);
    if (!deleted) {
      return NextResponse.json(
        { success: false, error: "Region not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Region deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting region:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete region" },
      { status: 500 }
    );
  }
}
