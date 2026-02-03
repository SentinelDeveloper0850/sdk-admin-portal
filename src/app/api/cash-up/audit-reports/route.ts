import { NextRequest, NextResponse } from "next/server";

import { CashUpAuditReportModel } from "@/app/models/hr/cash-up-audit-report.schema";
import UserModel from "@/app/models/hr/user.schema";
import { getUserFromRequest } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const roles = [
      (user as any)?.role,
      ...(((user as any)?.roles as string[]) || []),
    ].filter(Boolean);
    if (!roles.includes("cashup_reviewer")) {
      return NextResponse.json(
        { success: false, message: "Forbidden" },
        { status: 403 }
      );
    }

    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const dateKey = searchParams.get("dateKey");
    const limit = Math.min(Number(searchParams.get("limit") ?? "50"), 200);

    const where: any = {};
    if (userId) where.userId = userId;
    if (dateKey) where.dateKey = dateKey;

    const reports = await CashUpAuditReportModel.find(where)
      .sort({ uploadedAt: -1 })
      .limit(limit)
      .lean();
    const userIds = Array.from(
      new Set(reports.map((r: any) => String(r.userId)).filter(Boolean))
    );
    const users = await UserModel.find({ _id: { $in: userIds } })
      .select({ _id: 1, name: 1 })
      .lean();
    const nameById = new Map(
      users.map((u: any) => [String(u._id), String(u.name || "")])
    );

    return NextResponse.json({
      success: true,
      reports: reports.map((r: any) => ({
        _id: String(r._id),
        userId: String(r.userId),
        userName: nameById.get(String(r.userId)) || String(r.userId),
        dateKey: String(r.dateKey),
        employeeNameFromReport: r.employeeNameFromReport,
        reportFromDateKey: r.reportFromDateKey,
        reportToDateKey: r.reportToDateKey,
        incomeTotal: r.incomeTotal,
        expenseTotal: r.expenseTotal,
        netTotal: r.netTotal,
        fileUrl: r.fileUrl,
        fileName: r.fileName,
        uploadedAt: r.uploadedAt,
        uploadedByName: r.uploadedByName ?? null,
      })),
    });
  } catch (error) {
    console.error("Error fetching audit reports:", error);
    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to fetch audit reports",
      },
      { status: 500 }
    );
  }
}
