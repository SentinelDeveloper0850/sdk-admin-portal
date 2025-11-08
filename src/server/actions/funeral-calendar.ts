// app/server/funeral-calendar.ts
import dayjs from "dayjs";
import { CalendarEventModel } from "@/app/models/calendar-event.schema";
import type { IFuneral } from "@/types/funeral";
import mongoose from "mongoose";

type MilestoneKey = "pickUp" | "bathing" | "tentErection" | "delivery" | "serviceEscort" | "burial";

const MAPPING: Record<MilestoneKey, { type: string; titlePrefix: string; defaultMins?: number }> = {
  pickUp: { type: "funeral_pickup", titlePrefix: "Pickup", defaultMins: 60 },
  bathing: { type: "funeral_bathing", titlePrefix: "Bathing", defaultMins: 90 },
  tentErection: { type: "funeral_tent", titlePrefix: "Tent Erection", defaultMins: 180 },
  delivery: { type: "funeral_delivery", titlePrefix: "Delivery", defaultMins: 60 },
  serviceEscort: { type: "funeral_service", titlePrefix: "Service Escort", defaultMins: 120 },
  burial: { type: "funeral_burial", titlePrefix: "Burial", defaultMins: 90 },
};

export async function upsertFuneralCalendarEvents(funeral: IFuneral, actor: { name?: string; id?: string }) {
  const fullName = `${funeral.deceased.firstName} ${funeral.deceased.lastName}`.trim();

  for (const key of Object.keys(MAPPING) as MilestoneKey[]) {
    const slot = (funeral as any)[key];
    if (!slot?.enabled || !slot?.startDateTime) continue;

    const meta = MAPPING[key];
    const start = dayjs(slot.startDateTime);
    const end = slot.endDateTime
      ? dayjs(slot.endDateTime)
      : start.add(meta.defaultMins ?? 60, "minute");

    // Create vs update
    if (slot.calendarEventId) {
      const ce = await CalendarEventModel.findById(slot.calendarEventId);
      if (ce) {
        ce.name = `${meta.titlePrefix}: ${fullName}`;
        ce.type = meta.type;
        ce.branchId = funeral.branchId;
        ce.location = slot.location ?? funeral.location;
        ce.isAllDayEvent = false;
        ce.startDateTime = start.toDate();
        ce.endDateTime = end.toDate();
        ce.start = start.toISOString();
        ce.end = end.toISOString();
        ce.startTime = start.format("HH:mm");
        ce.endTime = end.format("HH:mm");
        ce.relatedModel = "funeral";
        ce.relatedId = funeral._id as mongoose.Types.ObjectId;
        ce.milestone = meta.type;
        await ce.save();
        continue;
      }
      // stale id: fall through to create
    }

    const created = await CalendarEventModel.create({
      name: `${meta.titlePrefix}: ${fullName}`,
      description: funeral.notes,
      type: meta.type,
      branchId: funeral.branchId,
      isAllDayEvent: false,
      isSingleDayEvent: start.isSame(end, "day"),
      startDateTime: start.toDate(),
      endDateTime: end.toDate(),
      start: start.toISOString(),
      end: end.toISOString(),
      startTime: start.format("HH:mm"),
      endTime: end.format("HH:mm"),
      location: slot.location ?? funeral.location,
      status: "published",
      createdBy: actor.name,
      createdById: actor.id,
      relatedModel: "funeral",
      relatedId: funeral._id as mongoose.Types.ObjectId,
      milestone: meta.type,
      attendees: [
        // lightweight context for Drawer
        { name: `${funeral.informant.firstName} ${funeral.informant.lastName}`.trim(), phone: funeral.informant.phoneNumber },
      ],
    });

    // store id back into the funeral doc
    slot.calendarEventId = created._id as any;
  }

  await (funeral as any).save();
}
