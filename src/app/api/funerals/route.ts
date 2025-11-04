// app/api/funerals/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";
import { FuneralModel } from "@/app/models/funeral.schema";
import { CalendarEventModel, ILocation } from "@/app/models/calendar-event.schema";
import dayjs from "dayjs";
import { upsertFuneralCalendarEvents } from "@/server/actions/funeral-calendar";

type ScheduledItemBody = {
  enabled?: boolean;
  startDateTime?: string | Date;
  endDateTime?: string | Date;
  location?: ILocation;
  notes?: string;
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
  serviceDateTime?: string | Date;
  burialDateTime?: string | Date;
  isSameDay?: boolean;

  location?: ILocation;
  cemetery?: string;
  graveNumber?: string;

  branchId?: string;
  assignments?: any[];
  transport?: any[];

  estimatedCost?: number;
  actualCost?: number;
  paymentStatus?: "unpaid" | "partial" | "paid";

  status?: string;
  notes?: string;
  
  // NEW: milestones we actually calendarize
  pickUp?: ScheduledItemBody;
  bathing?: ScheduledItemBody;
  tentErection?: ScheduledItemBody;
  delivery?: ScheduledItemBody;
  serviceEscort?: ScheduledItemBody;
  burial?: ScheduledItemBody;

  // calendar
  createCalendarEvent?: boolean; // ignored; we always upsert milestones
};

const toDateOrUndef = (v: string | Date | undefined) =>
  v ? dayjs(v).toDate() : undefined;

const normalizeSlot = (slot?: ScheduledItemBody) =>
  slot
    ? {
      ...slot,
      startDateTime: toDateOrUndef(slot.startDateTime as any),
      endDateTime: toDateOrUndef(slot.endDateTime as any),
    }
    : undefined;

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const page = Math.max(Number(searchParams.get("page") || 1), 1);
    const limit = Math.min(Math.max(Number(searchParams.get("limit") || 20), 1), 100);
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

    // Date range: match ANY milestone OR legacy fields within the range
    if (startDate || endDate) {
      const rng: any = {};
      if (startDate) rng.$gte = new Date(startDate);
      if (endDate) rng.$lte = new Date(endDate);

      filter.$or = [
        ...(filter.$or || []),
        { serviceDateTime: rng },      // legacy
        { burialDateTime: rng },       // legacy
        { "pickUp.startDateTime": rng },
        { "bathing.startDateTime": rng },
        { "tentErection.startDateTime": rng },
        { "delivery.startDateTime": rng },
        { "serviceEscort.startDateTime": rng },
        { "burial.startDateTime": rng },
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
      { success: true, items, page, limit, total, pages: Math.ceil(total / limit) },
      { status: 200 }
    );
  } catch (err) {
    console.error("GET /funerals error:", err);
    return NextResponse.json({ success: false, message: "Failed to fetch funerals" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });

    const body = (await request.json()) as CreateFuneralBody;

    // Basic validation
    if (!body?.informant?.firstName || !body?.informant?.lastName) {
      return NextResponse.json({ success: false, message: "Informant name is required" }, { status: 400 });
    }
    if (!body?.deceased?.firstName || !body?.deceased?.lastName) {
      return NextResponse.json({ success: false, message: "Deceased name is required" }, { status: 400 });
    }

    await connectToDatabase();

    // Generate referenceNumber if not provided
    const ref = body.referenceNumber ?? `FNR-${dayjs().format("YYYYMMDD-HHmmss")}`;

    // Normalize legacy times (optional)
    const serviceDT = toDateOrUndef(body.serviceDateTime as any);
    const burialDT = toDateOrUndef(body.burialDateTime as any);

    // Normalize milestone slots
    const pickUp = normalizeSlot(body.pickUp);
    const bathing = normalizeSlot(body.bathing);
    const tentErection = normalizeSlot(body.tentErection);
    const delivery = normalizeSlot(body.delivery);
    const serviceEscort = normalizeSlot(body.serviceEscort);
    const burial = normalizeSlot(body.burial);

    // Create funeral
    const funeral = await FuneralModel.create({
      ...body,
      referenceNumber: ref,
      serviceDateTime: serviceDT,
      burialDateTime: burialDT,
      pickUp,
      bathing,
      tentErection,
      delivery,
      serviceEscort,
      burial,
      createdBy: user.name || user.email,
      createdById: String(user._id),
    });

    // Create/Update calendar events per milestone
    const actor = { name: user.name || user.email, id: String(user._id) };
    await upsertFuneralCalendarEvents(funeral, actor);

    return NextResponse.json(
      { success: true, message: "Funeral created", funeral },
      { status: 201 }
    );
  } catch (err) {
    console.error("POST /funerals error:", err);
    return NextResponse.json({ success: false, message: "Failed to create funeral" }, { status: 500 });
  }
}
