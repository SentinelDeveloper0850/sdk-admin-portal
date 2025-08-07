import { processDailyActivityReminders } from "@/server/actions/daily-activity-reminders";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret if provided
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get("secret");

    // Optional: Add a secret key for security
    const expectedSecret = process.env.CRON_SECRET;
    if (expectedSecret && secret !== expectedSecret) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    // Process daily activity reminders
    const result = await processDailyActivityReminders();

    return NextResponse.json({
      success: result.success,
      message: result.message,
      data: {
        remindersSent: result.remindersSent,
        errors: result.errors,
        nextRunAt: result.nextRunAt,
        timestamp: new Date().toISOString(),
      }
    });

  } catch (error: any) {
    console.error("Error in daily activity reminders cron:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
        error: error?.toString() || "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

// Also support POST for compatibility
export async function POST(request: NextRequest) {
  return GET(request);
} 