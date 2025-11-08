import { NextResponse } from "next/server";

import { DailyActivityModel } from "@/app/models/hr/daily-activity.schema";
import UserModel from "@/app/models/hr/user.schema";
import { connectToDatabase } from "@/lib/db";

export async function GET(request: Request) {
  await connectToDatabase();

  const url = new URL(request.url);
  const userId = url.searchParams.get("userId");
  const date = url.searchParams.get("date");

  try {
    const reports = userId
      ? await DailyActivityModel.find({ userId, date }).sort({ createdAt: -1 })
      : await DailyActivityModel.find({ date }).sort({ createdAt: -1 });

    if (!reports || reports.length === 0) {
      return NextResponse.json(
        { message: "No reports found" },
        { status: 404 }
      );
    }

    const reportsWithAuthor = await Promise.all(
      reports.map(async (report) => {
        const user = await UserModel.findById(report.userId).select(
          "name email avatarUrl"
        );
        return {
          ...report.toObject(),
          author: user
            ? {
              _id: user._id,
              name: user.name,
              email: user.email,
              avatarUrl: user.avatarUrl,
            }
            : null,
        };
      })
    );

    return NextResponse.json(reportsWithAuthor, { status: 200 });
  } catch (error) {
    console.error("Error fetching reports:", error);
    return NextResponse.json(
      { message: "Failed to fetch reports" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    await connectToDatabase();

    const body = await request.json();

    const report = new DailyActivityModel(body);

    await report.save();

    // Return the updated user
    return NextResponse.json({ report }, { status: 200 });
  } catch (error) {
    console.error("Error creating report:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
