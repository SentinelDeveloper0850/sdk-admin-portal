// src/app/api/funerals/[id]/milestones/[type]/complete/route.ts
import { NextRequest, NextResponse } from "next/server";

import dayjs from "dayjs";
import mongoose from "mongoose";

import { FuneralModel } from "@/app/models/funeral.schema";
import { getUserFromRequest } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import { upsertFuneralCalendarEvents } from "@/server/actions/funeral-calendar";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string; type: string } }
) {
  try {
    const user = await getUserFromRequest(req);
    if (!user)
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );

    const { id, type } = params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, message: "Invalid id" },
        { status: 400 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const completedAt = body?.completedAt
      ? dayjs(body.completedAt).toDate()
      : new Date();

    await connectToDatabase();

    const funeral = await FuneralModel.findById(id);
    if (!funeral)
      return NextResponse.json(
        { success: false, message: "Not found" },
        { status: 404 }
      );

    const ms = (funeral.milestones || []).find((m: any) => m.type === type);
    if (!ms)
      return NextResponse.json(
        { success: false, message: "Milestone not found" },
        { status: 404 }
      );

    ms.enabled = true; // if it's completed, it's definitely enabled
    ms.status = "completed";
    ms.completedAt = completedAt;
    ms.completedBy = { id: String(user._id), name: user.name || user.email };

    // if no startDateTime yet, assume it happened at completedAt
    if (!ms.startDateTime) ms.startDateTime = completedAt;

    await funeral.save();

    // keep calendar in sync (optional: set calendar event status COMPLETED)
    await upsertFuneralCalendarEvents(funeral, {
      id: String(user._id),
      name: user.name || user.email,
    });

    return NextResponse.json({ success: true, funeral }, { status: 200 });
  } catch (err) {
    console.error("PATCH milestone complete error:", err);
    return NextResponse.json(
      { success: false, message: "Failed to complete milestone" },
      { status: 500 }
    );
  }
}
