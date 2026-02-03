interface DiscordWebhookPayload {
  content?: string;
  embeds?: DiscordEmbed[];
  username?: string;
  avatar_url?: string;
}

interface DiscordEmbed {
  title?: string;
  description?: string;
  color?: number;
  url?: string;
  fields?: DiscordField[];
  timestamp?: string;
  footer?: DiscordFooter;
  author?: DiscordAuthor;
}

interface DiscordField {
  name: string;
  value: string;
  inline?: boolean;
}

interface DiscordFooter {
  text: string;
  icon_url?: string;
}

interface DiscordAuthor {
  name: string;
  url?: string;
  icon_url?: string;
}

interface DiscordNotificationResult {
  success: boolean;
  message: string;
  error?: string;
}

// Rate limiting storage
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

/**
 * Send a Discord webhook notification
 */
export const sendDiscordNotification = async (
  webhookUrl: string,
  payload: DiscordWebhookPayload,
  rateLimitKey?: string
): Promise<DiscordNotificationResult> => {
  try {
    // If no webhook URL provided, fall back to environment config similar to discord-v2
    let resolvedWebhookUrl = webhookUrl;
    if (!resolvedWebhookUrl) {
      resolvedWebhookUrl = getDiscordWebhookUrl() || "";
    }

    if (!resolvedWebhookUrl) {
      return {
        success: false,
        message: "Discord webhook URL is not configured",
        error: "WEBHOOK_URL_MISSING",
      };
    }

    // Check rate limiting if a key is provided
    if (rateLimitKey) {
      const now = Date.now();
      const rateLimit = rateLimitStore.get(rateLimitKey);

      if (rateLimit) {
        if (now < rateLimit.resetTime) {
          if (rateLimit.count >= 5) {
            // Max 5 messages per window
            return {
              success: false,
              message:
                "Rate limit exceeded. Please wait before sending another notification.",
              error: "RATE_LIMIT_EXCEEDED",
            };
          }
          rateLimit.count++;
        } else {
          // Reset rate limit window
          rateLimitStore.set(rateLimitKey, {
            count: 1,
            resetTime: now + 60000,
          }); // 1 minute window
        }
      } else {
        // Initialize rate limit
        rateLimitStore.set(rateLimitKey, { count: 1, resetTime: now + 60000 });
      }
    }

    const response = await fetch(resolvedWebhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(
        "Failed to send Discord message:",
        response.status,
        errorText
      );
      return {
        success: false,
        message: "Failed to send Discord notification",
        error: `HTTP ${response.status}`,
      };
    }

    return {
      success: true,
      message: "Discord notification sent successfully",
    };
  } catch (error) {
    console.error("Error sending Discord notification:", error);
    return {
      success: false,
      message: "Failed to send Discord notification",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};

/**
 * Create a daily activity reminder notification for Discord
 */
export const createDailyActivityReminderNotification = (
  remindersSent: number,
  nonCompliantCount: number,
  totalUsers: number,
  complianceRate: number,
  triggeredBy: string
): DiscordWebhookPayload => {
  const embed: DiscordEmbed = {
    title: "📋 Daily Activity Reminders Sent",
    description: `Daily activity reminders have been triggered by **${triggeredBy}**`,
    color: 0x00ff00, // Green
    fields: [
      {
        name: "📤 Reminders Sent",
        value: `${remindersSent} users`,
        inline: true,
      },
      {
        name: "⚠️ Non-Compliant Users",
        value: `${nonCompliantCount} users`,
        inline: true,
      },
      {
        name: "📊 Total Users",
        value: `${totalUsers} users`,
        inline: true,
      },
      {
        name: "📈 Compliance Rate",
        value: `${complianceRate.toFixed(1)}%`,
        inline: true,
      },
      {
        name: "⏰ Timestamp",
        value: new Date().toLocaleString("en-ZA", {
          timeZone: "Africa/Johannesburg",
          year: "numeric",
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
        inline: true,
      },
    ],
    timestamp: new Date().toISOString(),
    footer: {
      text: "SDK Admin Portal - Daily Activity System",
    },
  };

  return {
    embeds: [embed],
    username: "SDK Admin Portal",
    avatar_url:
      "https://cdn.discordapp.com/attachments/123456789/123456789/logo.png", // Replace with actual logo URL
  };
};

/**
 * Create a system notification for Discord
 */
export const createSystemNotification = (
  title: string,
  description: string,
  type: "info" | "warning" | "error" | "success" = "info",
  fields?: DiscordField[]
): DiscordWebhookPayload => {
  const colors = {
    info: 0x0099ff,
    warning: 0xff9900,
    error: 0xff0000,
    success: 0x00ff00,
  };

  const embed: DiscordEmbed = {
    title,
    description,
    color: colors[type],
    fields,
    timestamp: new Date().toISOString(),
    footer: {
      text: "SDK Admin Portal",
    },
  };

  return {
    embeds: [embed],
    username: "SDK Admin Portal",
    avatar_url:
      "https://cdn.discordapp.com/attachments/123456789/123456789/logo.png", // Replace with actual logo URL
  };
};

/**
 * Get the Discord webhook URL from environment variables
 */
export const getDiscordWebhookUrl = (): string | null => {
  // Prefer the working variable used in discord-v2, but support the legacy name
  return (
    process.env.DISCORD_WEBHOOK_URL ||
    process.env.DISCORD_GENERAL_WEBHOOK ||
    null
  );
};

/**
 * Clear rate limit for a specific key (useful for testing)
 */
export const clearRateLimit = (rateLimitKey: string): void => {
  rateLimitStore.delete(rateLimitKey);
};

/**
 * Get current rate limit status for a key
 */
export const getRateLimitStatus = (
  rateLimitKey: string
): { count: number; resetTime: number } | null => {
  return rateLimitStore.get(rateLimitKey) || null;
};
