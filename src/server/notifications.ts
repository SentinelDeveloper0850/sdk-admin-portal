"use server";

import { NotificationModel } from "@/app/models/notification.schema";
import { connectToDatabase } from "@/lib/db";

export type NotificationSeverity = "INFO" | "SUCCESS" | "WARNING" | "ERROR";

interface CreateNotificationInput {
  recipientUserId: string;
  type: string;
  title: string;
  message: string;
  link?: string;
  severity?: NotificationSeverity;
  data?: Record<string, any>;
}

export async function createNotification(input: CreateNotificationInput) {
  const { severity = "INFO", ...rest } = input;

  await connectToDatabase();

  return NotificationModel.create({
    ...rest,
    severity,
  });
}
