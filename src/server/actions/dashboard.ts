"use server";

import { AllocationRequestModel } from "@/app/models/hr/allocation-request.schema";
import { CashUpSubmissionModel } from "@/app/models/hr/cash-up-submission.schema";
import { DailyActivityModel } from "@/app/models/hr/daily-activity.schema";
import { UserModel } from "@/app/models/hr/user.schema";
import { ClaimModel } from "@/app/models/scheme/claim.schema";
import { EasypayTransactionModel } from "@/app/models/scheme/easypay-transaction.schema";
import { EftTransactionModel } from "@/app/models/scheme/eft-transaction.schema";
import { PolicyCancellationRequestModel } from "@/app/models/scheme/policy-cancellation-request.schema";
import { PolicySignUpModel } from "@/app/models/scheme/policy-signup-request.schema";
import { PolicyModel } from "@/app/models/scheme/policy.schema";
import { SchemeSocietyModel } from "@/app/models/scheme/scheme-society.schema";
import { SocietyModel } from "@/app/models/scheme/society.schema";
import { connectToDatabase } from "@/lib/db";
import { getExpectedUsersFromDutyRoster } from "@/server/utils/duty-roster";

export const getDashboardData = async () => {
  try {
    await connectToDatabase();

    // Today's date for filtering
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Recent activity (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Transaction import activity (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Get today's date in YYYY-MM-DD format for daily activity compliance
    const todayFormatted = today.toISOString().split('T')[0];

    // Get yesterday's date for compliance checking (since cutoff is 18:00 daily)
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayFormatted = yesterday.toISOString().split('T')[0];

    // Execute all basic counts concurrently for better performance
    const [
      schemeSocietyCount,
      prepaidSocietyCount,
      eftTransactionCount,
      easypayTransactionCount,
      userCount,
      policyCount,
      todayEftTransactions,
      todayEasypayTransactions,
      todayClaims,
      todaySignupRequests,
      pendingClaims,
      pendingSignupRequests,
      pendingCancellationRequests,
      pendingEftAllocationRequests,
      pendingEasypayAllocationRequests,
    ] = await Promise.all([
      SchemeSocietyModel.countDocuments(),
      SocietyModel.countDocuments(),
      EftTransactionModel.countDocuments(),
      EasypayTransactionModel.countDocuments(),
      UserModel.countDocuments(),
      PolicyModel.countDocuments(),
      EftTransactionModel.countDocuments({
        createdAt: { $gte: today, $lt: tomorrow }
      }),
      EasypayTransactionModel.countDocuments({
        createdAt: { $gte: today, $lt: tomorrow }
      }),
      ClaimModel.countDocuments({
        createdAt: { $gte: today, $lt: tomorrow }
      }),
      PolicySignUpModel.countDocuments({
        createdAt: { $gte: today, $lt: tomorrow }
      }),
      ClaimModel.countDocuments({
        status: { $in: ["Submitted", "In Review"] }
      }),
      PolicySignUpModel.countDocuments({
        currentStatus: { $in: ["submitted", "pending_info"] }
      }),
      PolicyCancellationRequestModel.countDocuments({
        status: "pending"
      }),
      AllocationRequestModel.countDocuments({
        status: "PENDING",
        type: "EFT"
      }),
      AllocationRequestModel.countDocuments({
        status: "PENDING",
        type: "Easypay"
      }),
    ]);

    // Get all active users (excluding admins and inactive users) for daily activity compliance
    const allUsers = await UserModel.find({
      status: "Active", // Only active users
      deletedAt: { $exists: false },
      role: { $nin: ["admin", "super_admin"] } // Exclude users with admin roles
    }).select('_id name email avatarUrl status roles role').lean();

    const getUserRoles = (u: any) =>
      Array.from(
        new Set([u?.role, ...((u?.roles as string[]) || [])].filter(Boolean).map((r: string) => String(r)))
      );

    // Determine who was expected to submit (based on duty roster)
    // If no roster exists for yesterday, fall back to all active users (current behavior).
    let expectedUsersForCompliance = allUsers;
    let complianceExpectedSource: "duty_roster" | "all_active_users" = "all_active_users";
    try {
      const { expectedUsers, expectedSource } = await getExpectedUsersFromDutyRoster({
        dayStart: yesterday,
        dayEndExclusive: today,
      });

      if (expectedSource === "duty_roster") {
        expectedUsersForCompliance = expectedUsers || [];
        complianceExpectedSource = "duty_roster";
      } else {
        expectedUsersForCompliance = allUsers;
        complianceExpectedSource = "all_active_users";
      }
    } catch (e) {
      // non-fatal; keep fallback behavior
      console.error("Failed to load duty roster for compliance:", e);
    }

    // Get yesterday's daily activity reports - using DD/MM/YYYY format
    const yesterdayFormattedDDMMYYYY = yesterday.toLocaleDateString('en-GB'); // This gives DD/MM/YYYY format
    const yesterdaysDailyActivities = await DailyActivityModel.find({
      date: yesterdayFormattedDDMMYYYY
    }).select('userId userName').lean();

    // Create a set of user IDs who have submitted yesterday's report
    const compliantUserIds = new Set(yesterdaysDailyActivities.map(activity => activity.userId.toString()));

    // Separate users into compliant and non-compliant
    const compliantUsers = expectedUsersForCompliance.filter((user: any) => compliantUserIds.has(user._id.toString()));
    const nonCompliantUsers = expectedUsersForCompliance.filter((user: any) => !compliantUserIds.has(user._id.toString()));

    // Cashup submission compliance (Cashiers only)
    const cashupExpectedUsers = expectedUsersForCompliance.filter((u: any) => getUserRoles(u).includes("cashier"));

    const yesterdaysCashupSubmissions = await CashUpSubmissionModel.find({
      date: { $gte: yesterday, $lt: today },
      submittedAt: { $ne: null }, // submitted (even if it doesn't balance / gets sent back)
    })
      .select("userId")
      .lean();

    const cashupCompliantUserIds = new Set(
      yesterdaysCashupSubmissions.map((s: any) => String(s.userId)).filter(Boolean)
    );

    const cashupCompliantUsers = cashupExpectedUsers.filter((u: any) =>
      cashupCompliantUserIds.has(String(u._id))
    );
    const cashupNonCompliantUsers = cashupExpectedUsers.filter((u: any) =>
      !cashupCompliantUserIds.has(String(u._id))
    );

    // Execute recent activity queries concurrently
    const [recentDailyActivities, recentClaims, recentSignupRequests] = await Promise.all([
      DailyActivityModel.find({
        createdAt: { $gte: sevenDaysAgo }
      })
        .sort({ createdAt: -1 })
        .limit(10)
        .lean(), // Use lean() for better performance when not needing Mongoose methods

      ClaimModel.find({
        createdAt: { $gte: sevenDaysAgo }
      })
        .sort({ createdAt: -1 })
        .limit(5)
        .lean(),

      PolicySignUpModel.find({
        createdAt: { $gte: sevenDaysAgo }
      })
        .sort({ createdAt: -1 })
        .limit(5)
        .lean(),
    ]);

    // Execute transaction trend queries concurrently
    const [recentEftImports, recentEasypayImports] = await Promise.all([
      EftTransactionModel.aggregate([
        { $match: { createdAt: { $gte: thirtyDaysAgo } } },
        {
          $group: {
            _id: {
              $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
            },
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: -1 } },
        { $limit: 7 }
      ]),

      EasypayTransactionModel.aggregate([
        { $match: { createdAt: { $gte: thirtyDaysAgo } } },
        {
          $group: {
            _id: {
              $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
            },
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: -1 } },
        { $limit: 7 }
      ]),
    ]);

    return {
      success: true,
      data: {
        // Basic stats
        userCount,
        schemeSocietyCount,
        prepaidSocietyCount,
        eftTransactionCount,
        easypayTransactionCount,
        policyCount,

        // Today's activity
        todayActivity: {
          eftTransactions: todayEftTransactions,
          easypayTransactions: todayEasypayTransactions,
          claims: todayClaims,
          signupRequests: todaySignupRequests,
        },

        // Pending items
        pendingItems: {
          claims: pendingClaims,
          signupRequests: pendingSignupRequests,
          cancellationRequests: pendingCancellationRequests,
          eftAllocationRequests: pendingEftAllocationRequests,
          easypayAllocationRequests: pendingEasypayAllocationRequests,
        },

        // Daily activity compliance
        dailyActivityCompliance: {
          expectedSource: complianceExpectedSource,
          compliantUsers: compliantUsers.map(user => ({
            _id: user._id,
            name: user.name,
            email: user.email,
            avatarUrl: user.avatarUrl,
            status: user.status,
            roles: user.roles
          })),
          nonCompliantUsers: nonCompliantUsers.map(user => ({
            _id: user._id,
            name: user.name,
            email: user.email,
            avatarUrl: user.avatarUrl,
            status: user.status,
            roles: user.roles
          })),
          complianceRate: expectedUsersForCompliance.length > 0 ? (compliantUsers.length / expectedUsersForCompliance.length) * 100 : 0,
          totalUsers: expectedUsersForCompliance.length,
          compliantCount: compliantUsers.length,
          nonCompliantCount: nonCompliantUsers.length
        },

        // Cashup submission compliance (Cashiers only)
        cashUpSubmissionCompliance: {
          expectedSource: complianceExpectedSource,
          compliantUsers: cashupCompliantUsers.map((user: any) => ({
            _id: user._id,
            name: user.name,
            email: user.email,
            avatarUrl: user.avatarUrl,
            status: user.status,
            roles: user.roles,
          })),
          nonCompliantUsers: cashupNonCompliantUsers.map((user: any) => ({
            _id: user._id,
            name: user.name,
            email: user.email,
            avatarUrl: user.avatarUrl,
            status: user.status,
            roles: user.roles,
          })),
          complianceRate:
            cashupExpectedUsers.length > 0
              ? (cashupCompliantUsers.length / cashupExpectedUsers.length) * 100
              : 0,
          totalUsers: cashupExpectedUsers.length,
          compliantCount: cashupCompliantUsers.length,
          nonCompliantCount: cashupNonCompliantUsers.length,
        },

        // Recent activity
        recentActivity: {
          dailyActivities: recentDailyActivities,
          claims: recentClaims,
          signupRequests: recentSignupRequests,
        },

        // Transaction trends
        transactionTrends: {
          eft: recentEftImports,
          easypay: recentEasypayImports,
        }
      },
    };
  } catch (error: any) {
    console.error("Error fetching dashboard data:", error.message);
    return {
      success: false,
      message: "Internal Server Error ~ Error fetching dashboard data",
    };
  }
};
