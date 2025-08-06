"use server";

import { DailyActivityModel } from "@/app/models/hr/daily-activity.schema";
import { UserModel } from "@/app/models/hr/user.schema";
import { ClaimModel } from "@/app/models/scheme/claim.schema";
import { EasypayTransactionModel } from "@/app/models/scheme/easypay-transaction.schema";
import { EftTransactionModel } from "@/app/models/scheme/eft-transaction.schema";
import PolicyCancellationRequestModel from "@/app/models/scheme/policy-cancellation-request.schema";
import { PolicySignUpModel } from "@/app/models/scheme/policy-signup-request.schema";
import { PolicyModel } from "@/app/models/scheme/policy.schema";
import { SocietyModel } from "@/app/models/scheme/society.schema";
import { connectToDatabase } from "@/lib/db";

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
    ] = await Promise.all([
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
    ]);

    // Get all active users (excluding admins and inactive users) for daily activity compliance
    const allUsers = await UserModel.find({
      status: "Active", // Only active users
      deletedAt: { $exists: false },
      role: { $nin: ["admin", "super_admin"] } // Exclude users with admin roles
    }).select('_id name email avatarUrl status roles role').lean();

    // Get yesterday's daily activity reports
    const yesterdaysDailyActivities = await DailyActivityModel.find({
      date: yesterdayFormatted
    }).select('userId userName').lean();

    // Create a set of user IDs who have submitted yesterday's report
    const compliantUserIds = new Set(yesterdaysDailyActivities.map(activity => activity.userId.toString()));

    // Separate users into compliant and non-compliant
    const compliantUsers = allUsers.filter((user: any) => user.role !== "admin" && user.role !== "super_admin" && user.status !== "Inactive").filter((user: any) => compliantUserIds.has(user._id.toString()));
    const nonCompliantUsers = allUsers.filter((user: any) => user.role !== "admin" && user.role !== "super_admin" && user.status !== "Inactive").filter((user: any) => !compliantUserIds.has(user._id.toString()));

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
        },

        // Daily activity compliance
        dailyActivityCompliance: {
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
          complianceRate: allUsers.length > 0 ? (compliantUsers.length / allUsers.length) * 100 : 0,
          totalUsers: allUsers.length,
          compliantCount: compliantUsers.length,
          nonCompliantCount: nonCompliantUsers.length
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
