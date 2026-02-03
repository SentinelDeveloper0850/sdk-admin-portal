// src/app/api/funerals/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";

import dayjs from "dayjs";
import mongoose from "mongoose";

import type { ILocation } from "@/app/models/calendar-event.schema";
import { CalendarEventModel } from "@/app/models/calendar-event.schema";
import {
  type FuneralMilestoneType,
  FuneralModel,
  ScheduledItemStatus,
} from "@/app/models/funeral.schema";
import { getUserFromRequest } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import { upsertFuneralCalendarEvents } from "@/server/actions/funeral-calendar";

type MilestoneBody = {
  type: FuneralMilestoneType;
  enabled?: boolean;
  startDateTime?: string | Date | null;
  endDateTime?: string | Date | null;
  durationMinutes?: number | null;

  location?: ILocation | null;
  origin?: ILocation | null;
  destination?: ILocation | null;

  status?: ScheduledItemStatus;
  calendarEventId?: string | null;
  notes?: any[];
};

const toDateOrUndef = (v: any) => (v ? dayjs(v).toDate() : undefined);

const normalizeMilestone = (m: MilestoneBody) => {
  const start =
    m.startDateTime === null ? undefined : toDateOrUndef(m.startDateTime);
  const end = m.endDateTime === null ? undefined : toDateOrUndef(m.endDateTime);

  return {
    type: m.type,
    enabled: !!m.enabled,
    startDateTime: start,
    endDateTime: end,
    durationMinutes: m.durationMinutes ?? undefined,
    location: m.location ?? undefined,
    origin: m.origin ?? undefined,
    destination: m.destination ?? undefined,
    status: m.status ?? ScheduledItemStatus.PENDING,
    calendarEventId: m.calendarEventId ?? undefined,
    notes: Array.isArray(m.notes) ? m.notes : [],
  };
};

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, message: "Invalid id" },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const funeral = await FuneralModel.findById(id);
    if (!funeral)
      return NextResponse.json(
        { success: false, message: "Not found" },
        { status: 404 }
      );

    return NextResponse.json({ success: true, funeral }, { status: 200 });
  } catch (err) {
    console.error("GET /funerals/:id error:", err);
    return NextResponse.json(
      { success: false, message: "Failed to fetch funeral" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUserFromRequest(request);
    if (!user)
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );

    const { id } = params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, message: "Invalid id" },
        { status: 400 }
      );
    }

    const body = await request.json();

    await connectToDatabase();

    const funeral = await FuneralModel.findById(id);
    if (!funeral)
      return NextResponse.json(
        { success: false, message: "Not found" },
        { status: 404 }
      );

    const serviceDT =
      body.serviceDateTime === null
        ? undefined
        : toDateOrUndef(body.serviceDateTime);
    const burialDT =
      body.burialDateTime === null
        ? undefined
        : toDateOrUndef(body.burialDateTime);

    // canonical only
    const milestones = Array.isArray(body.milestones)
      ? body.milestones.map(normalizeMilestone)
      : undefined;

    Object.assign(funeral, {
      ...body,
      ...(body.serviceDateTime !== undefined
        ? { serviceDateTime: serviceDT }
        : {}),
      ...(body.burialDateTime !== undefined
        ? { burialDateTime: burialDT }
        : {}),
      ...(milestones !== undefined ? { milestones } : {}),
      ...(body.notes !== undefined
        ? { notes: Array.isArray(body.notes) ? body.notes : [] }
        : {}),
      updatedBy: user.name || user.email,
      updatedById: String(user._id),
    });

    await funeral.save();

    await upsertFuneralCalendarEvents(funeral, {
      name: user.name || user.email,
      id: String(user._id),
    });

    return NextResponse.json(
      { success: true, message: "Funeral updated", funeral },
      { status: 200 }
    );
  } catch (err) {
    console.error("PUT /funerals/:id error:", err);
    return NextResponse.json(
      { success: false, message: "Failed to update funeral" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getUserFromRequest(request);
    if (!user)
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );

    const { id } = params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, message: "Invalid id" },
        { status: 400 }
      );
    }

    const { searchParams } = new URL(request.url);
    const alsoDeleteCalendar = searchParams.get("deleteCalendar") === "true";

    await connectToDatabase();

    const funeral = await FuneralModel.findById(id);
    if (!funeral)
      return NextResponse.json(
        { success: false, message: "Not found" },
        { status: 404 }
      );

    // delete funeral
    await FuneralModel.findByIdAndDelete(id);

    if (alsoDeleteCalendar) {
      const ids = (funeral.milestones || [])
        .map((m: any) => m?.calendarEventId)
        .filter(Boolean);

      if (ids.length) {
        await CalendarEventModel.deleteMany({ _id: { $in: ids } });
      }
    }

    return NextResponse.json(
      { success: true, message: "Funeral deleted" },
      { status: 200 }
    );
  } catch (err) {
    console.error("DELETE /funerals/:id error:", err);
    return NextResponse.json(
      { success: false, message: "Failed to delete funeral" },
      { status: 500 }
    );
  }
}
