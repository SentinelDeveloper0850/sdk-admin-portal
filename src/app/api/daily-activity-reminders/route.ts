import { NextRequest, NextResponse } from "next/server";

import { getUserFromRequest } from "@/lib/auth";
import {
  createDailyActivityReminderNotification,
  getDiscordWebhookUrl,
  sendDiscordNotification,
} from "@/lib/discord";
import {
  getReminderConfig,
  getReminderStats,
  processDailyActivityReminders,
  saveReminderConfig,
} from "@/server/actions/daily-activity-reminders";

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
    const isAdmin = user.role === "admin" || user.roles?.includes("admin");
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
        data: stats,
      });
    } else if (action === "config") {
      // Get reminder configuration
      const config = await getReminderConfig();
      return NextResponse.json({
        success: true,
        data: config,
      });
    } else {
      // Default: get both stats and config
      const [stats, config] = await Promise.all([
        getReminderStats(),
        getReminderConfig(),
      ]);

      return NextResponse.json({
        success: true,
        data: {
          stats,
          config,
        },
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
    const isAdmin = user.role === "admin" || user.roles?.includes("admin");
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

      // Send Discord notification for manual trigger
      let discordNotificationSent = false;
      const webhookUrl = getDiscordWebhookUrl();
      if (webhookUrl && result.success && result.remindersSent > 0) {
        try {
          const discordPayload = createDailyActivityReminderNotification(
            result.remindersSent,
            result.remindersSent, // For manual trigger, we don't have exact non-compliant count
            result.remindersSent, // For manual trigger, we don't have exact total count
            0, // Compliance rate not available for manual trigger
            user.name || user.email || "Admin User" // triggered by user
          );

          const discordResult = await sendDiscordNotification(
            webhookUrl,
            discordPayload,
            "daily-activity-reminders-manual" // separate rate limit key for manual triggers
          );

          discordNotificationSent = discordResult.success;

          if (!discordResult.success) {
            console.warn(
              "Failed to send Discord notification for manual trigger:",
              discordResult.error
            );
          }
        } catch (error) {
          console.error(
            "Error sending Discord notification for manual trigger:",
            error
          );
        }
      }

      return NextResponse.json({
        success: result.success,
        message: result.message,
        data: {
          remindersSent: result.remindersSent,
          errors: result.errors,
          nextRunAt: result.nextRunAt,
          discordNotificationSent,
        },
      });
    } else if (action === "save") {
      // Save reminder configuration
      const { config } = body;
      const result = await saveReminderConfig(config, user?._id as string);

      return NextResponse.json({
        success: result.success,
        message: result.message,
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
