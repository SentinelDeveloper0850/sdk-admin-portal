import { NextResponse } from "next/server";

import { DailyActivityModel } from "@/app/models/daily-activity.schema";
import { connectToDatabase } from "@/lib/db";

export async function GET(request: Request) {

  // Retrieve the userId from the query string (e.g., ?userId=JohnDoe)
  const url = new URL(request.url);
  const userId = url.searchParams.get('userId');

  // If userId is not provided, return an error
  if (!userId) {
    const reports = await DailyActivityModel.find();

    if (!reports) {
      return NextResponse.json({ message: "Daily activities not found" }, { status: 404 });
    }

    return NextResponse.json(reports, { status: 200 });
  }

  try {
    // Fetch reports for the specified userId from the database
    const reports = await DailyActivityModel.find({ userId: userId });

    // If no reports are found, return a 404 error
    if (reports.length === 0) {
      return NextResponse.json({ message: 'No reports found for this user' }, { status: 404 });
    }

    // Return the reports if found
    return NextResponse.json(reports, { status: 200 });
  } catch (error) {
    console.error('Error fetching reports:', error);
    return NextResponse.json({ message: 'Failed to fetch reports' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await connectToDatabase();
    // Parse the request body
    const body = await request.json();

    const report = new DailyActivityModel(body);

    await report.save();

    // Return the updated user
    return NextResponse.json({ report }, { status: 200 });
  } catch (error) {
    console.error("Error creating report:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}

