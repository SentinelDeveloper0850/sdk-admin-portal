// src/app/api/funerals/route.ts
import { NextRequest, NextResponse } from "next/server";

import dayjs from "dayjs";

import type { ILocation } from "@/app/models/calendar-event.schema";
import {
  type FuneralMilestoneType,
  FuneralModel,
  FuneralStatus,
  PaymentStatus,
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
  via?: ILocation | null; // ✅ add
  destination?: ILocation | null;

  cemeteryCode?: string | null; // ✅ add
  graveNumber?: string | null; // ✅ add

  status?: ScheduledItemStatus;
  calendarEventId?: string | null;

  notes?: any[];
};

export type CreateFuneralBody = {
  referenceNumber?: string;
  policyNumber?: string;

  informant: {
    firstName: string;
    lastName: string;
    idNumber?: string;
    passportNumber?: string;
    address?: string;
    phoneNumber?: string;
    email?: string;
    relationship?: string;
  };

  deceased: {
    firstName: string;
    lastName: string;
    idNumber?: string;
    passportNumber?: string;
    dateOfBirth?: string | Date;
    dateOfDeath?: string | Date;
    gender?: "male" | "female" | "other";
  };

  branchId: string;

  // optional “summary” dates (still useful for list filters)
  serviceDateTime?: string | Date | null;
  burialDateTime?: string | Date | null;
  isSameDay?: boolean;

  serviceLocation?: ILocation;

  // if you moved these into the Burial milestone, remove them from body/schema
  cemetery?: string;
  graveNumber?: string;

  assignments?: any[];
  transport?: any[];

  estimatedCost?: number;
  actualCost?: number;
  paymentStatus?: PaymentStatus;

  status?: FuneralStatus;

  notes?: any[];

  milestones: MilestoneBody[]; // ✅ canonical only
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
    durationMinutes: m.durationMinutes ?? 60,

    location: m.location ?? undefined,
    origin: m.origin ?? undefined,
    via: m.via ?? undefined, // ✅ keep
    destination: m.destination ?? undefined,

    cemeteryCode: m.cemeteryCode ?? undefined, // ✅ keep
    graveNumber: m.graveNumber ?? undefined, // ✅ keep

    status: m.status ?? ScheduledItemStatus.PENDING,
    calendarEventId: m.calendarEventId ?? undefined,
    notes: Array.isArray(m.notes) ? m.notes : [],
  };
};

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user)
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );

    const { searchParams } = new URL(request.url);
    const page = Math.max(Number(searchParams.get("page") || 1), 1);
    const limit = Math.min(
      Math.max(Number(searchParams.get("limit") || 20), 1),
      100
    );

    const branchId = searchParams.get("branchId") || undefined;
    const status = searchParams.get("status") || undefined;
    const q = searchParams.get("q") || undefined;

    const startDate = searchParams.get("startDate") || undefined;
    const endDate = searchParams.get("endDate") || undefined;

    const filter: Record<string, any> = {};
    if (branchId) filter.branchId = branchId;
    if (status) filter.status = status;

    if (q) {
      filter.$or = [
        { referenceNumber: new RegExp(q, "i") },
        { policyNumber: new RegExp(q, "i") },
        { "deceased.firstName": new RegExp(q, "i") },
        { "deceased.lastName": new RegExp(q, "i") },
        { "informant.firstName": new RegExp(q, "i") },
        { "informant.lastName": new RegExp(q, "i") },
      ];
    }

    // date range: milestone.startDateTime is canonical
    if (startDate || endDate) {
      const rng: any = {};
      if (startDate) rng.$gte = new Date(startDate);
      if (endDate) rng.$lte = new Date(endDate);

      filter.$or = [
        ...(filter.$or || []),
        { "milestones.startDateTime": rng },
        // optional: keep if you still use these:
        { serviceDateTime: rng },
        { burialDateTime: rng },
      ];
    }

    await connectToDatabase();

    const [items, total] = await Promise.all([
      FuneralModel.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      FuneralModel.countDocuments(filter),
    ]);

    return NextResponse.json(
      {
        success: true,
        items,
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("GET /funerals error:", err);
    return NextResponse.json(
      { success: false, message: "Failed to fetch funerals" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user)
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );

    const body = (await request.json()) as CreateFuneralBody;

    if (!body?.informant?.firstName || !body?.informant?.lastName) {
      return NextResponse.json(
        { success: false, message: "Informant name is required" },
        { status: 400 }
      );
    }
    if (!body?.deceased?.firstName || !body?.deceased?.lastName) {
      return NextResponse.json(
        { success: false, message: "Deceased name is required" },
        { status: 400 }
      );
    }
    if (!body.branchId) {
      return NextResponse.json(
        { success: false, message: "branchId is required" },
        { status: 400 }
      );
    }
    if (!Array.isArray(body.milestones)) {
      return NextResponse.json(
        { success: false, message: "milestones[] is required" },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const ref =
      body.referenceNumber ?? `FNR-${dayjs().format("YYYYMMDD-HHmmss")}`;

    const serviceDT =
      body.serviceDateTime === null
        ? undefined
        : toDateOrUndef(body.serviceDateTime);
    const burialDT =
      body.burialDateTime === null
        ? undefined
        : toDateOrUndef(body.burialDateTime);

    const milestones = body.milestones.map(normalizeMilestone);

    const funeral = await FuneralModel.create({
      ...body,
      referenceNumber: ref,
      serviceDateTime: serviceDT,
      burialDateTime: burialDT,
      milestones,
      notes: Array.isArray(body.notes) ? body.notes : [],
      createdBy: user.name || user.email,
      createdById: String(user._id),
    });

    await upsertFuneralCalendarEvents(funeral, {
      name: user.name || user.email,
      id: String(user._id),
    });

    return NextResponse.json(
      { success: true, message: "Funeral created", funeral },
      { status: 201 }
    );
  } catch (err) {
    console.error("POST /funerals error:", err);
    return NextResponse.json(
      { success: false, message: "Failed to create funeral" },
      { status: 500 }
    );
  }
}
