import { DailyAuditModel } from "@/app/models/hr/daily-audit.schema";
import { getUserFromRequest } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    await connectToDatabase();

    let audits = [];

    if (user.role !== "admin") {
      audits = await DailyAuditModel.find({ userId: user._id }).sort({ createdAt: -1 });
    } else {
      audits = await DailyAuditModel.find().sort({ createdAt: -1 });
    }

    return NextResponse.json({ success: true, audits });
  } catch (error) {
    console.error("Error fetching daily audits:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch daily audits" },
      { status: 500 }
    );
  }
}