import { NextRequest, NextResponse } from "next/server";

import { getAllShiftsForCalendar } from "@/server/actions/shifts";

// GET all shifts (for frontend calendar)
export async function GET(req: NextRequest) {
  const data = await getAllShiftsForCalendar();
  return NextResponse.json({ success: true, data });
}
