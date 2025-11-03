// /api/calendar/events/route.ts
import { CalendarEventModel } from "@/app/models/calendar-event.schema";
import { StaffMemberModel } from "@/app/models/staff-member.schema";
import { getUserFromRequest } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export type CalendarEventType = "company" | "branch" | "personal";
export const calendarEventTypes: CalendarEventType[] = ["company", "branch", "personal"];

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") as CalendarEventType;
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    if (!type || !calendarEventTypes.includes(type)) {
      return NextResponse.json({ success: false, message: "Invalid type" }, { status: 400 });
    }

    const filter: Record<string, any> = {};
    const sort: Record<string, any> = { startDateTime: 1 };

    if (startDate && endDate) {
      filter.startDateTime = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }

    await connectToDatabase();

    switch (type) {
      case "branch": {
        const staffMember = await StaffMemberModel.findOne({ userId: user._id });
        if (!staffMember) {
          return NextResponse.json({ success: false, message: "Staff member not found" }, { status: 404 });
        }
        filter.branchId = staffMember.branchId;
        break;
      }
      case "personal": {
        // You likely want "events I created or I'm attending"
        filter.$or = [{ createdById: user._id }, { attendees: user._id }];
        break;
      }
      case "company":
        // no extra filter
        break;
    }

    const events = await CalendarEventModel.find(filter).sort(sort);
    return NextResponse.json({ success: true, message: "Events fetched successfully", events }, { status: 200 });
  } catch (error) {
    console.error("Error fetching events:", error);
    return NextResponse.json({ success: false, message: "Failed to fetch events" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    await connectToDatabase();

    const response = await CalendarEventModel.create(body);
    return NextResponse.json({ success: true, message: "Event added successfully", event: response }, { status: 201 });
  } catch (error) {
    console.error("Error adding event:", error);
    return NextResponse.json({ success: false, message: "Failed to add event" }, { status: 500 });
  }
}
