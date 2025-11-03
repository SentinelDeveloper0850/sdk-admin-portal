// /api/calendar/events/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";
import { CalendarEventModel } from "@/app/models/calendar-event.schema";
import mongoose from "mongoose";

type UpdatePayload = {
  start?: string | null; // ISO
  end?: string | null;   // ISO
  allDay?: boolean;
  extendedProps?: Record<string, any>;
  action?: "move" | "resize" | "receive";
};

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ success: false, message: "Invalid event id" }, { status: 400 });
    }

    const body = (await request.json()) as UpdatePayload;

    await connectToDatabase();

    // Load the event first (for auth/ownership checks if needed)
    const existing = await CalendarEventModel.findById(id);
    if (!existing) {
      return NextResponse.json({ success: false, message: "Event not found" }, { status: 404 });
    }

    // Optional: authorization checks. For example:
    // - Personal events: only creator/attendee can edit
    // - Branch/company events: check role/branch membership
    // if (String(existing.createdById) !== String(user._id)) {
    //   return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
    // }

    const update: Record<string, any> = {};
    if (body.start !== undefined) update.startDateTime = body.start ? new Date(body.start) : null;
    if (body.start !== undefined) update.start = body.start;

    if (body.end !== undefined) update.endDateTime = body.end ? new Date(body.end) : null;
    if (body.end !== undefined) update.end = body.end;

    if (typeof body.allDay === "boolean") update.allDay = body.allDay;

    // If you store extra props on the event document, merge them here.
    // Adjust keys to match your schema (e.g., meta, details, etc.).
    if (body.extendedProps && typeof body.extendedProps === "object") {
      // Example: shallow-merge into an existing meta field
      update.$set = {
        ...(update.$set || {}),
        ...body.extendedProps,
      };
    }

    const updated = await CalendarEventModel.findByIdAndUpdate(id, update, { new: true });

    return NextResponse.json(
      { success: true, message: "Event updated", event: updated },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating event:", error);
    return NextResponse.json({ success: false, message: "Failed to update event" }, { status: 500 });
  }
}
