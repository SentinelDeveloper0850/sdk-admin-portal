// app/api/funerals/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import dayjs from "dayjs";
import { connectToDatabase } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";
import { FuneralModel } from "@/app/models/funeral.schema";
import { CalendarEventModel } from "@/app/models/calendar-event.schema";
import { upsertFuneralCalendarEvents } from "@/server/actions/funeral-calendar";

const toDateOrUndef = (v: any) => (v ? dayjs(v).toDate() : undefined);
const normalizeSlot = (slot?: any) =>
  slot
    ? {
      ...slot,
      startDateTime: toDateOrUndef(slot.startDateTime),
      endDateTime: toDateOrUndef(slot.endDateTime),
    }
    : undefined;

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, message: "Invalid id" }, { status: 400 });
    }
    await connectToDatabase();
    const funeral = await FuneralModel.findById(id);
    if (!funeral) return NextResponse.json({ success: false, message: "Not found" }, { status: 404 });
    return NextResponse.json({ success: true, funeral }, { status: 200 });
  } catch (err) {
    console.error("GET /funerals/:id error:", err);
    return NextResponse.json({ success: false, message: "Failed to fetch funeral" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });

    const { id } = params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, message: "Invalid id" }, { status: 400 });
    }

    const body = await request.json();

    await connectToDatabase();

    const funeral = await FuneralModel.findById(id);
    if (!funeral) return NextResponse.json({ success: false, message: "Not found" }, { status: 404 });

    const serviceDT = toDateOrUndef(body.serviceDateTime);
    const burialDT = toDateOrUndef(body.burialDateTime);

    Object.assign(funeral, {
      ...body,
      ...(serviceDT ? { serviceDateTime: serviceDT } : {}),
      ...(burialDT ? { burialDateTime: burialDT } : {}),
      ...(body.pickUp !== undefined ? { pickUp: normalizeSlot(body.pickUp) } : {}),
      ...(body.bathing !== undefined ? { bathing: normalizeSlot(body.bathing) } : {}),
      ...(body.tentErection !== undefined ? { tentErection: normalizeSlot(body.tentErection) } : {}),
      ...(body.delivery !== undefined ? { delivery: normalizeSlot(body.delivery) } : {}),
      ...(body.serviceEscort !== undefined ? { serviceEscort: normalizeSlot(body.serviceEscort) } : {}),
      ...(body.burial !== undefined ? { burial: normalizeSlot(body.burial) } : {}),
    });

    await funeral.save();

    const actor = { name: user.name, id: String(user._id) };
    await upsertFuneralCalendarEvents(funeral, actor);

    return NextResponse.json({ success: true, message: "Funeral updated", funeral }, { status: 200 });
  } catch (err) {
    console.error("PUT /funerals/:id error:", err);
    return NextResponse.json({ success: false, message: "Failed to update funeral" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const alsoDeleteCalendar = searchParams.get("deleteCalendar") === "true";

    const { id } = params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, message: "Invalid id" }, { status: 400 });
    }

    await connectToDatabase();

    const funeral = await FuneralModel.findById(id);
    if (!funeral) return NextResponse.json({ success: false, message: "Not found" }, { status: 404 });

    // delete funeral
    await FuneralModel.findByIdAndDelete(id);

    if (alsoDeleteCalendar) {
      const ids = [
        funeral.pickUp?.calendarEventId,
        funeral.bathing?.calendarEventId,
        funeral.tentErection?.calendarEventId,
        funeral.delivery?.calendarEventId,
        funeral.serviceEscort?.calendarEventId,
        funeral.burial?.calendarEventId,
      ].filter(Boolean);
      if (ids.length) await CalendarEventModel.deleteMany({ _id: { $in: ids } });
      // Optional legacy:
      if (funeral.calendarEventId) {
        await CalendarEventModel.findByIdAndDelete(funeral.calendarEventId);
      }
    }

    return NextResponse.json({ success: true, message: "Funeral deleted" }, { status: 200 });
  } catch (err) {
    console.error("DELETE /funerals/:id error:", err);
    return NextResponse.json({ success: false, message: "Failed to delete funeral" }, { status: 500 });
  }
}
