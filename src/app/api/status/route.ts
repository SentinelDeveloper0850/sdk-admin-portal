import { NextRequest, NextResponse } from "next/server";

import { CalendarEventModel } from "@/app/models/calendar-event.schema";
import { FuneralModel } from "@/app/models/funeral.schema";
import AllocationRequestModel from "@/app/models/hr/allocation-request.schema";
import { DailyActivityModel } from "@/app/models/hr/daily-activity.schema";
import { UserModel } from "@/app/models/hr/user.schema";
import { NotificationModel } from "@/app/models/notification.schema";
import { ClaimModel } from "@/app/models/scheme/claim.schema";
import EasypayTransactionModel from "@/app/models/scheme/easypay-transaction.schema";
import EftTransactionModel from "@/app/models/scheme/eft-transaction.schema";
import { PolicyCancellationRequestModel } from "@/app/models/scheme/policy-cancellation-request.schema";
import { PolicySignUpModel } from "@/app/models/scheme/policy-signup-request.schema";
import { PolicyModel } from "@/app/models/scheme/policy.schema";
import { SchemeSocietyModel } from "@/app/models/scheme/scheme-society.schema";
import {
  AnnouncementAckModel,
  AnnouncementModel,
  AnnouncementReadModel,
} from "@/app/models/system/announcement.schema";
import { AuditLogModel } from "@/app/models/system/audit-log.schema";
import { BranchModel } from "@/app/models/system/branch.schema";
import { ConfigurationModel } from "@/app/models/system/configuration.schema";
import { connectToDatabase } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();

    // Check if all the models are connected
    const [
      branchCount,
      userCount,
      policyCount,
      funeralCount,
      calendarEventCount,
      notificationCount,
      configurationCount,
      auditLogCount,
      announcementCount,
      announcementReadCount,
      announcementAckCount,
      eftTransactionCount,
      easypayTransactionCount,
      allocationRequestCount,
      policySignUpCount,
      policyCancellationRequestCount,
      claimCount,
      dailyActivityCount,
      schemeSocietyCount,
    ] = await Promise.all([
      BranchModel.countDocuments(),
      UserModel.countDocuments(),
      PolicyModel.countDocuments(),
      FuneralModel.countDocuments(),
      CalendarEventModel.countDocuments(),
      NotificationModel.countDocuments(),
      ConfigurationModel.countDocuments(),
      AuditLogModel.countDocuments(),
      AnnouncementModel.countDocuments(),
      AnnouncementReadModel.countDocuments(),
      AnnouncementAckModel.countDocuments(),
      EftTransactionModel.countDocuments(),
      EasypayTransactionModel.countDocuments(),
      AllocationRequestModel.countDocuments(),
      PolicySignUpModel.countDocuments(),
      PolicyCancellationRequestModel.countDocuments(),
      ClaimModel.countDocuments(),
      DailyActivityModel.countDocuments(),
      SchemeSocietyModel.countDocuments(),
    ]);

    const status = {
      database: true,
      models: {
        branch: { count: branchCount, name: "Branch" },
        user: { count: userCount, name: "User" },
        policy: { count: policyCount, name: "Policy" },
        funeral: { count: funeralCount, name: "Funeral" },
        calendarEvent: { count: calendarEventCount, name: "Calendar Event" },
        notification: { count: notificationCount, name: "Notification" },
        configuration: { count: configurationCount, name: "Configuration" },
        auditLog: { count: auditLogCount, name: "Audit Log" },
        announcement: { count: announcementCount, name: "Announcement" },
        announcementRead: {
          count: announcementReadCount,
          name: "Announcement Read",
        },
        announcementAck: {
          count: announcementAckCount,
          name: "Announcement Ack",
        },
        eftTransaction: { count: eftTransactionCount, name: "EFT Transaction" },
        easypayTransaction: {
          count: easypayTransactionCount,
          name: "EasyPay Transaction",
        },
        allocationRequest: {
          count: allocationRequestCount,
          name: "Allocation Request",
        },
        policySignUp: { count: policySignUpCount, name: "Policy Sign Up" },
        policyCancellationRequest: {
          count: policyCancellationRequestCount,
          name: "Policy Cancellation Request",
        },
        claim: { count: claimCount, name: "Claim" },
        dailyActivity: { count: dailyActivityCount, name: "Daily Activity" },
        schemeSociety: { count: schemeSocietyCount, name: "Scheme Society" },
      },
      system: {
        version: process.env.VERSION,
        commit: process.env.COMMIT,
        branch: process.env.BRANCH,
        buildTime: process.env.BUILD_TIME,
        buildNumber: process.env.BUILD_NUMBER,
      },
    };

    return NextResponse.json({ success: true, data: status }, { status: 200 });
  } catch (error) {
    console.error("Error fetching status:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch status" },
      { status: 500 }
    );
  }
}
