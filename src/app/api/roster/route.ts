import { NextRequest, NextResponse } from "next/server";

import { DutyRosterModel } from "@/app/models/hr/duty-roster.schema";
import { StaffMemberModel } from "@/app/models/staff-member.schema";
import { getUserFromRequest } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";

function startOfDay(date: Date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user)
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );

    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get("date"); // YYYY-MM-DD
    if (!dateParam) {
      return NextResponse.json(
        { success: false, message: "Missing date" },
        { status: 400 }
      );
    }

    const d = startOfDay(new Date(dateParam));
    const end = new Date(d);
    end.setDate(end.getDate() + 1);

    await connectToDatabase();

    const roster = await DutyRosterModel.findOne({
      date: { $gte: d, $lt: end },
    }).lean();
    if (!roster) {
      return NextResponse.json({ success: true, roster: null });
    }

    const staffIds = Array.isArray((roster as any).staffMemberIds)
      ? (roster as any).staffMemberIds
      : [];
    const staff = await StaffMemberModel.find({ _id: { $in: staffIds } })
      .select({
        _id: 1,
        firstNames: 1,
        lastName: 1,
        initials: 1,
        userId: 1,
        employment: 1,
      })
      .lean();

    return NextResponse.json({
      success: true,
      roster: {
        _id: String((roster as any)._id),
        date: new Date((roster as any).date).toISOString().slice(0, 10),
        note: (roster as any).note || "",
        staff: staff.map((s: any) => ({
          _id: String(s._id),
          name: `${String(s.firstNames || "").trim()} ${String(s.lastName || "").trim()}`.trim(),
          initials: s.initials,
          userId: s.userId ? String(s.userId) : null,
          branch: s.employment?.branch ?? null,
          position: s.employment?.position ?? null,
          isPortalUser: !!s.userId,
        })),
      },
    });
  } catch (error) {
    console.error("Error fetching duty roster:", error);
    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error ? error.message : "Failed to fetch roster",
      },
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

    const body = await request.json();
    const dateParam = String(body?.date || "").trim(); // YYYY-MM-DD
    const staffMemberIds = Array.isArray(body?.staffMemberIds)
      ? body.staffMemberIds.map(String)
      : [];
    const note = String(body?.note || "");

    if (!dateParam) {
      return NextResponse.json(
        { success: false, message: "Missing date" },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const d = startOfDay(new Date(dateParam));

    await DutyRosterModel.updateOne(
      { date: d },
      {
        $set: {
          date: d,
          staffMemberIds,
          note,
          updatedById: String((user as any)._id),
        },
        $setOnInsert: {
          createdById: String((user as any)._id),
        },
      },
      { upsert: true }
    );

    return NextResponse.json({ success: true, message: "Roster saved" });
  } catch (error) {
    console.error("Error saving duty roster:", error);
    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error ? error.message : "Failed to save roster",
      },
      { status: 500 }
    );
  }
}
