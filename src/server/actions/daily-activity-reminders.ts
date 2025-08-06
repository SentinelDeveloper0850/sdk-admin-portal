"use server";

import { DailyActivityModel } from "@/app/models/hr/daily-activity.schema";
import { UserModel } from "@/app/models/hr/user.schema";
import { DailyActivityReminderConfigModel } from "@/app/models/system/daily-activity-reminder.schema";
import { connectToDatabase } from "@/lib/db";
import { createDailyActivityReminderNotification, getDiscordWebhookUrl, sendDiscordNotification } from "@/lib/discord";
import { sendDailyActivityReminderEmail } from "@/lib/email";
import dayjs from "dayjs";

export interface ReminderResult {
  success: boolean;
  message: string;
  remindersSent: number;
  errors: string[];
  nextRunAt?: Date;
  discordNotificationSent?: boolean;
}

export interface ReminderConfig {
  isEnabled: boolean;
  reminderTime: string;
  cutoffTime: string;
  excludeWeekends: boolean;
  excludeHolidays: boolean;
  excludeDates: string[];
  sendFirstReminder: boolean;
  firstReminderOffset: number;
  sendFinalReminder: boolean;
  finalReminderOffset: number;
  sendToAllUsers: boolean;
  excludeRoles: string[];
  includeRoles: string[];
  emailSubject: string;
  emailTemplate: string;
}

/**
 * Get the current reminder configuration
 */
export const getReminderConfig = async (): Promise<ReminderConfig | null> => {
  try {
    await connectToDatabase();

    const config = await DailyActivityReminderConfigModel.findOne().sort({ createdAt: -1 });

    if (!config) {
      return null;
    }

    return {
      isEnabled: config.isEnabled,
      reminderTime: config.reminderTime,
      cutoffTime: config.cutoffTime,
      excludeWeekends: config.excludeWeekends,
      excludeHolidays: config.excludeHolidays,
      excludeDates: config.excludeDates,
      sendFirstReminder: config.sendFirstReminder,
      firstReminderOffset: config.firstReminderOffset,
      sendFinalReminder: config.sendFinalReminder,
      finalReminderOffset: config.finalReminderOffset,
      sendToAllUsers: config.sendToAllUsers,
      excludeRoles: config.excludeRoles,
      includeRoles: config.includeRoles,
      emailSubject: config.emailSubject,
      emailTemplate: config.emailTemplate,
    };
  } catch (error) {
    console.error("Error getting reminder config:", error);
    return null;
  }
};

/**
 * Create or update reminder configuration
 */
export const saveReminderConfig = async (
  config: Partial<ReminderConfig>,
  userId: string
): Promise<{ success: boolean; message: string }> => {
  try {
    await connectToDatabase();

    // Find existing config or create new one
    let existingConfig = await DailyActivityReminderConfigModel.findOne().sort({ createdAt: -1 });

    if (existingConfig) {
      // Update existing config
      Object.assign(existingConfig, config, { updatedBy: userId });
      await existingConfig.save();
    } else {
      // Create new config
      existingConfig = new DailyActivityReminderConfigModel({
        ...config,
        createdBy: userId,
        updatedBy: userId,
      });
      await existingConfig.save();
    }

    return {
      success: true,
      message: "Reminder configuration saved successfully",
    };
  } catch (error) {
    console.error("Error saving reminder config:", error);
    return {
      success: false,
      message: "Failed to save reminder configuration",
    };
  }
};

/**
 * Get users who should receive reminders
 */
const getReminderRecipients = async (config: ReminderConfig): Promise<any[]> => {
  const query: any = {
    status: "Active",
    deletedAt: { $exists: false },
  };

  if (!config.sendToAllUsers && config.includeRoles.length > 0) {
    query.$or = [
      { role: { $in: config.includeRoles } },
      { roles: { $in: config.includeRoles } },
    ];
  }

  if (config.excludeRoles.length > 0) {
    query.$and = [
      { role: { $nin: config.excludeRoles } },
      { roles: { $nin: config.excludeRoles } },
    ];
  }

  return await UserModel.find(query).select("_id name email role roles").lean();
}

/**
 * Check if user has submitted report for today
 */
const hasSubmittedToday = async (userId: string, date: string): Promise<boolean> => {
  const report = await DailyActivityModel.findOne({
    userId: userId.toString(),
    date: date,
  });

  return !!report;
}

/**
 * Send reminder emails to non-compliant users
 */
const sendReminders = async (
  config: ReminderConfig,
  recipients: any[],
  date: string,
  isFirstReminder: boolean
): Promise<{ sent: number; errors: string[] }> => {
  let sent = 0;
  const errors: string[] = [];

  for (const user of recipients) {
    try {
      // Check if user has already submitted
      const hasSubmitted = await hasSubmittedToday(user._id, date);

      if (hasSubmitted) {
        continue; // Skip users who have already submitted
      }

      // Send reminder email
      const emailResult = await sendDailyActivityReminderEmail({
        to: user.email,
        name: user.name,
        date: date,
        cutoffTime: config.cutoffTime,
        isFirstReminder,
      });

      if (emailResult.success) {
        sent++;
      } else {
        errors.push(`Failed to send email to ${user.email}: ${emailResult.error}`);
      }
    } catch (error) {
      errors.push(`Error processing user ${user.email}: ${error}`);
    }
  }

  return { sent, errors };
};

/**
 * Main function to process daily activity reminders
 */
export const processDailyActivityReminders = async (): Promise<ReminderResult> => {
  try {
    await connectToDatabase();

    // Get current configuration
    const config = await getReminderConfig();
    if (!config || !config.isEnabled) {
      return {
        success: true,
        message: "Reminder system is disabled",
        remindersSent: 0,
        errors: [],
      };
    }

    // Check if reminder should run today
    const today = new Date();
    const todayStr = dayjs(today).format("DD/MM/YYYY");
    const todayISO = dayjs(today).format("YYYY-MM-DD");

    // Check excluded dates
    if (config.excludeDates.includes(todayISO)) {
      return {
        success: true,
        message: "Today is excluded from reminders",
        remindersSent: 0,
        errors: [],
      };
    }

    // Check weekends
    if (config.excludeWeekends && (today.getDay() === 0 || today.getDay() === 6)) {
      return {
        success: true,
        message: "Weekends are excluded from reminders",
        remindersSent: 0,
        errors: [],
      };
    }

    // Get current time
    const currentTime = dayjs();
    const reminderTime = dayjs(today).format("YYYY-MM-DD") + " " + config.reminderTime;
    const cutoffTime = dayjs(today).format("YYYY-MM-DD") + " " + config.cutoffTime;

    // Calculate reminder windows
    const firstReminderTime = dayjs(cutoffTime).subtract(config.firstReminderOffset, "minute");
    const finalReminderTime = dayjs(cutoffTime).subtract(config.finalReminderOffset, "minute");

    // Determine which reminder to send
    let shouldSendFirst = false;
    let shouldSendFinal = false;

    if (config.sendFirstReminder && currentTime.isAfter(firstReminderTime) && currentTime.isBefore(finalReminderTime)) {
      shouldSendFirst = true;
    } else if (config.sendFinalReminder && currentTime.isAfter(finalReminderTime) && currentTime.isBefore(cutoffTime)) {
      shouldSendFinal = true;
    }

    if (!shouldSendFirst && !shouldSendFinal) {
      return {
        success: true,
        message: "Not time for reminders yet",
        remindersSent: 0,
        errors: [],
      };
    }

    // Get recipients
    const recipients = await getReminderRecipients(config);
    if (recipients.length === 0) {
      return {
        success: true,
        message: "No recipients found for reminders",
        remindersSent: 0,
        errors: [],
      };
    }

    // Send reminders
    const isFirstReminder = shouldSendFirst;
    const result = await sendReminders(config, recipients, todayStr, isFirstReminder);

    // Send Discord notification
    let discordNotificationSent = false;
    const webhookUrl = getDiscordWebhookUrl();
    if (webhookUrl && result.sent > 0) {
      try {
        const discordPayload = createDailyActivityReminderNotification(
          result.sent,
          recipients.length - result.sent, // non-compliant count
          recipients.length, // total users
          ((result.sent / recipients.length) * 100), // compliance rate
          "System" // triggered by system
        );

        const discordResult = await sendDiscordNotification(
          webhookUrl,
          discordPayload,
          "daily-activity-reminders" // rate limit key
        );

        discordNotificationSent = discordResult.success;

        if (!discordResult.success) {
          console.warn("Failed to send Discord notification:", discordResult.error);
        }
      } catch (error) {
        console.error("Error sending Discord notification:", error);
      }
    }

    // Update configuration with last run time and count
    const configDoc = await DailyActivityReminderConfigModel.findOne().sort({ createdAt: -1 });
    if (configDoc) {
      configDoc.lastRunAt = new Date();
      configDoc.totalRemindersSent += result.sent;
      configDoc.calculateNextRunTime();
      await configDoc.save();
    }

    return {
      success: true,
      message: `Successfully sent ${result.sent} ${isFirstReminder ? "first" : "final"} reminders`,
      remindersSent: result.sent,
      errors: result.errors,
      nextRunAt: configDoc?.nextRunAt,
      discordNotificationSent,
    };

  } catch (error) {
    console.error("Error processing daily activity reminders:", error);
    return {
      success: false,
      message: "Failed to process reminders",
      remindersSent: 0,
      errors: [error instanceof Error ? error.message : String(error)],
    };
  }
};

/**
 * Get reminder statistics
 */
export const getReminderStats = async () => {
  try {
    await connectToDatabase();

    const config = await DailyActivityReminderConfigModel.findOne().sort({ createdAt: -1 });
    if (!config) {
      return null;
    }

    const today = dayjs().format("DD/MM/YYYY");
    const recipients = await getReminderRecipients({
      isEnabled: config.isEnabled,
      reminderTime: config.reminderTime,
      cutoffTime: config.cutoffTime,
      excludeWeekends: config.excludeWeekends,
      excludeHolidays: config.excludeHolidays,
      excludeDates: config.excludeDates,
      sendFirstReminder: config.sendFirstReminder,
      firstReminderOffset: config.firstReminderOffset,
      sendFinalReminder: config.sendFinalReminder,
      finalReminderOffset: config.finalReminderOffset,
      sendToAllUsers: config.sendToAllUsers,
      excludeRoles: config.excludeRoles,
      includeRoles: config.includeRoles,
      emailSubject: config.emailSubject,
      emailTemplate: config.emailTemplate,
    });

    // Count users who have submitted today
    let submittedCount = 0;
    for (const user of recipients) {
      const hasSubmitted = await hasSubmittedToday(user._id, today);
      if (hasSubmitted) submittedCount++;
    }

    return {
      totalRecipients: recipients.length,
      submittedToday: submittedCount,
      pendingToday: recipients.length - submittedCount,
      lastRunAt: config.lastRunAt,
      nextRunAt: config.nextRunAt,
      totalRemindersSent: config.totalRemindersSent,
      isEnabled: config.isEnabled,
    };
  } catch (error) {
    console.error("Error getting reminder stats:", error);
    return null;
  }
}; 