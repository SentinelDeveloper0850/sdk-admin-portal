import { NextRequest, NextResponse } from "next/server";

import {
  createSystemNotification,
  getDiscordWebhookUrl,
  sendDiscordNotification,
} from "@/lib/discord";

export async function POST(request: NextRequest) {
  try {
    const webhookUrl = getDiscordWebhookUrl();

    if (!webhookUrl) {
      return NextResponse.json(
        { success: false, message: "Discord webhook URL not configured" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { message, type = "info" } = body;

    const payload = createSystemNotification(
      "Test Notification",
      message || "This is a test notification from SDK Admin Portal",
      type as "info" | "warning" | "error" | "success"
    );

    const result = await sendDiscordNotification(
      webhookUrl,
      payload,
      "test-discord" // rate limit key
    );

    return NextResponse.json({
      success: result.success,
      message: result.message,
      error: result.error,
    });
  } catch (error) {
    console.error("Error in test Discord endpoint:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
