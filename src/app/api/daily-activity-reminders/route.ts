import { getUserFromRequest } from "@/lib/auth";
import { getReminderConfig, getReminderStats, processDailyActivityReminders, saveReminderConfig } from "@/server/actions/daily-activity-reminders";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check if user has admin role
    const isAdmin = user.role === 'admin' || user.roles?.includes('admin');
    if (!isAdmin) {
      return NextResponse.json(
        { success: false, message: "Admin access required" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");

    if (action === "stats") {
      // Get reminder statistics
      const stats = await getReminderStats();
      return NextResponse.json({
        success: true,
        data: stats
      });
    } else if (action === "config") {
      // Get reminder configuration
      const config = await getReminderConfig();
      return NextResponse.json({
        success: true,
        data: config
      });
    } else {
      // Default: get both stats and config
      const [stats, config] = await Promise.all([
        getReminderStats(),
        getReminderConfig()
      ]);

      return NextResponse.json({
        success: true,
        data: {
          stats,
          config
        }
      });
    }

  } catch (error) {
    console.error("Error in daily activity reminders GET:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check if user has admin role
    const isAdmin = user.role === 'admin' || user.roles?.includes('admin');
    if (!isAdmin) {
      return NextResponse.json(
        { success: false, message: "Admin access required" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { action } = body;

    if (action === "trigger") {
      // Manually trigger reminder processing
      const result = await processDailyActivityReminders();

      return NextResponse.json({
        success: result.success,
        message: result.message,
        data: {
          remindersSent: result.remindersSent,
          errors: result.errors,
          nextRunAt: result.nextRunAt
        }
      });
    } else if (action === "save") {
      // Save reminder configuration
      const { config } = body;
      const result = await saveReminderConfig(config, user._id.toString());

      return NextResponse.json({
        success: result.success,
        message: result.message
      });
    } else {
      return NextResponse.json(
        { success: false, message: "Invalid action" },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error("Error in daily activity reminders POST:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
} 