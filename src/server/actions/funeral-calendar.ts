// src/server/actions/funeral-calendar.ts
import dayjs from "dayjs";
import mongoose from "mongoose";

import {
  CalendarEventModel,
  CalendarEventStatus,
} from "@/app/models/calendar-event.schema";
import { FuneralMilestoneType } from "@/app/models/funeral.schema";
import type { IFuneral } from "@/types/funeral";

type Actor = { name?: string; id?: string };

/**
 * Opinionated mapping:
 * - milestone.type => calendar subtype/title defaults
 * - used for naming + default durations + milestone string stored on CalendarEvent
 */
const MAPPING: Record<
  FuneralMilestoneType,
  { subType: string; titlePrefix: string; defaultMins: number }
> = {
  [FuneralMilestoneType.PICKUP]: {
    subType: "funeral_pickup",
    titlePrefix: "Pickup",
    defaultMins: 60,
  },
  [FuneralMilestoneType.BATHING]: {
    subType: "funeral_bathing",
    titlePrefix: "Bathing",
    defaultMins: 90,
  },
  [FuneralMilestoneType.TENT_ERECTION]: {
    subType: "funeral_tent",
    titlePrefix: "Tent Erection",
    defaultMins: 180,
  },
  [FuneralMilestoneType.DELIVERY]: {
    subType: "funeral_delivery",
    titlePrefix: "Delivery",
    defaultMins: 60,
  },
  [FuneralMilestoneType.SERVICE]: {
    subType: "funeral_service",
    titlePrefix: "Service",
    defaultMins: 120,
  },
  [FuneralMilestoneType.ESCORT]: {
    subType: "funeral_escort",
    titlePrefix: "Escort",
    defaultMins: 120,
  },
  [FuneralMilestoneType.BURIAL]: {
    subType: "funeral_burial",
    titlePrefix: "Burial",
    defaultMins: 90,
  },
};

function buildMilestoneKey(type: FuneralMilestoneType) {
  // Stored on CalendarEvent.milestone to make deterministic lookups possible
  return `funeral_${type}`;
}

function getFullName(funeral: IFuneral) {
  return `${funeral.deceased?.firstName ?? ""} ${funeral.deceased?.lastName ?? ""}`.trim();
}

function getInformantName(funeral: IFuneral) {
  return `${funeral.informant?.firstName ?? ""} ${funeral.informant?.lastName ?? ""}`.trim();
}

/**
 * Upsert calendar events for all funeral milestones.
 * - If milestone.enabled && milestone.startDateTime => ensure calendar event exists and is published
 * - If milestone disabled or missing startDateTime => cancel related calendar event (if exists)
 */
export async function upsertFuneralCalendarEvents(
  funeral: IFuneral,
  actor: Actor
) {
  const fullName = getFullName(funeral);
  const relatedId = funeral._id as unknown as mongoose.Types.ObjectId;

  let changed = false;

  const milestones = ((funeral as any).milestones ?? []) as any[];
  if (!Array.isArray(milestones)) return;

  for (const m of milestones) {
    if (!m?.type) continue;

    const map = MAPPING[m.type as FuneralMilestoneType];
    if (!map) continue; // ignore unknown milestone types safely

    const milestoneKey = buildMilestoneKey(m.type);

    const shouldHaveEvent = !!m.enabled && !!m.startDateTime;

    // Try resolve existing calendar event by:
    // 1) calendarEventId stored on milestone
    // 2) deterministic lookup: relatedId + milestone
    let ce = null as any;

    if (m.calendarEventId) {
      ce = await CalendarEventModel.findById(m.calendarEventId);
    }
    if (!ce) {
      ce = await CalendarEventModel.findOne({
        relatedModel: "funeral",
        relatedId,
        milestone: milestoneKey,
      });
    }

    // If milestone is disabled or missing start time: cancel existing event if present
    if (!shouldHaveEvent) {
      if (ce) {
        // Cancel rather than delete: keeps history & avoids "where did it go?" arguments
        ce.status = CalendarEventStatus.CANCELLED;
        ce.updatedAt = new Date();
        await ce.save();

        // Optional: also clear calendarEventId on milestone to avoid re-using cancelled events
        // If you prefer to keep the link, comment this out.
        m.calendarEventId = undefined;
        changed = true;
      }
      continue;
    }

    const isCompleted = String(m.status || "").toLowerCase() === "completed";

    if (m.status === "completed" && !m.startDateTime && m.completedAt) {
      m.startDateTime = m.completedAt;
      changed = true;
    }

    const start = dayjs(m.startDateTime);
    const defaultMins = m.durationMinutes ?? map.defaultMins;
    const end = m.endDateTime
      ? dayjs(m.endDateTime)
      : start.add(defaultMins, "minute");

    // Choose location preference:
    // - milestone location wins
    // - otherwise serviceLocation (if exists)
    // - otherwise undefined
    const location = m.location ?? (funeral as any).serviceLocation;

    const eventPayload = {
      name: `${isCompleted ? "✅ " : ""}${map.titlePrefix}: ${fullName}`,
      description: Array.isArray((funeral as any).notes)
        ? (funeral as any).notes
            .map((n: any) => n?.note)
            .filter(Boolean)
            .join("\n")
        : (funeral as any).notes || "",
      type: "funeral", // keep "funeral" as event.type
      subType: map.subType, // actual milestone subtype
      branchId: funeral.branchId,
      isAllDayEvent: false,
      isSingleDayEvent: start.isSame(end, "day"),
      startDateTime: start.toDate(),
      endDateTime: end.toDate(),
      start: start.toISOString(),
      end: end.toISOString(),
      startTime: start.format("HH:mm"),
      endTime: end.format("HH:mm"),
      durationMinutes: defaultMins,
      location,
      status: isCompleted
        ? CalendarEventStatus.COMPLETED
        : CalendarEventStatus.PUBLISHED,
      relatedModel: "funeral",
      relatedId,
      milestone: milestoneKey,
      attendees: [
        {
          name: getInformantName(funeral),
          phone: funeral.informant?.phoneNumber,
        },
      ].filter((a) => a.name || a.phone),
    };

    // Upsert
    if (ce) {
      Object.assign(ce, {
        ...eventPayload,
        // preserve createdBy fields on updates
      });
      await ce.save();
    } else {
      ce = await CalendarEventModel.create({
        ...eventPayload,
        createdBy: actor.name,
        createdById: actor.id,
      });
    }

    // Ensure calendarEventId is stored on milestone
    if (!m.calendarEventId || String(m.calendarEventId) !== String(ce._id)) {
      m.calendarEventId = ce._id;
      changed = true;
    }
  }

  if (changed) {
    await (funeral as any).save();
  }
}
