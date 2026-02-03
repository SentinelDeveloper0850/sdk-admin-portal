import { NextRequest, NextResponse } from "next/server";

import { RegionModel } from "@/app/models/system/region.schema";
import { getUserFromRequest } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";

export async function GET() {
  try {
    await connectToDatabase();
    const regions = await RegionModel.find({}).sort({ updatedAt: -1 });
    return NextResponse.json({ success: true, data: regions });
  } catch (error) {
    console.error("Error fetching regions:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch regions" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user)
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );

    await connectToDatabase();
    const body = await request.json();

    const name = String(body?.name ?? "").trim();
    const code = String(body?.code ?? "")
      .trim()
      .toUpperCase();
    const province = body?.province;
    const manager = body?.manager ?? null;
    const isActive =
      body?.isActive !== undefined ? Boolean(body.isActive) : true;

    if (!name || !code) {
      return NextResponse.json(
        { success: false, error: "Missing required fields: name, code" },
        { status: 400 }
      );
    }

    const existing = await RegionModel.findOne({ code });
    if (existing) {
      return NextResponse.json(
        { success: false, error: "Region code already exists" },
        { status: 409 }
      );
    }

    // business id (simple + stable). Swap to nanoid later if you want.
    const id = body?.id ? String(body.id).trim() : code;

    const existingId = await RegionModel.findOne({ id });
    if (existingId) {
      return NextResponse.json(
        { success: false, error: "Region ID already exists" },
        { status: 409 }
      );
    }

    const created = await RegionModel.create({
      id,
      name,
      code,
      province,
      manager,
      isActive,
      createdBy: user._id,
      updatedBy: user._id,
    });

    return NextResponse.json({
      success: true,
      data: created,
      message: "Region created successfully",
    });
  } catch (error) {
    console.error("Error creating region:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create region" },
      { status: 500 }
    );
  }
}
