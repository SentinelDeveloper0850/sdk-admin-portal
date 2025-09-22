import { DailyAuditModel } from "@/app/models/hr/daily-audit.schema";
import { getUserFromRequest } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const employeeIdParam = searchParams.get("employeeId");
    const dateParam = searchParams.get("date"); // YYYY-MM-DD

    const query: any = {};

    // Non-admins can only see their own
    const isAdmin = (user as any)?.role === "admin" || (user as any)?.role === "Admin";
    if (isAdmin) {
      if (employeeIdParam) {
        query.userId = employeeIdParam;
      }
    } else {
      query.userId = (user as any)._id;
    }

    if (dateParam) {
      const start = new Date(dateParam);
      const end = new Date(start);
      end.setDate(start.getDate() + 1);
      query.date = { $gte: start, $lt: end };
    }

    const docs = await DailyAuditModel.find(query).sort({ createdAt: -1 }).lean();

    // Map DB docs to UI shape expected by table
    const audits = docs.map((doc: any) => {
      const latestSubmission = Array.isArray(doc.submissions) && doc.submissions.length > 0
        ? doc.submissions[doc.submissions.length - 1]
        : null;

      return {
        _id: String(doc._id),
        date: new Date(doc.date).toISOString().slice(0, 10),
        employeeId: doc.userId,
        employeeName: doc.userId, // Replace with actual name lookup if needed
        batchReceiptTotal: doc.totalAmount ?? null,
        systemBalance: null,
        discrepancy: 0,
        status: doc.status || "Submitted",
        submissionStatus: doc.isLateSubmission ? "Submitted Late" : "Submitted",
        riskLevel: "low",
        submittedAt: latestSubmission?.submittedAt ?? doc.createdAt,
        reviewedBy: null,
        reviewedAt: null,
        isResolved: false,
        notes: (doc.reviewNotes && doc.reviewNotes[0]) || null,
        attachments: latestSubmission?.files || [],
      };
    });

    return NextResponse.json({
      success: true,
      audits,
    });
  } catch (error) {
    console.error("Error fetching audits:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch audits" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // In a real implementation, you would:
    // 1. Validate the request body
    // 2. Save to database
    // 3. Process OCR if needed
    // 4. Calculate status and risk level

    const newAudit = {
      _id: Date.now().toString(),
      ...body,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return NextResponse.json({
      success: true,
      audit: newAudit,
    });
  } catch (error) {
    console.error("Error creating audit:", error);
    return NextResponse.json(
      { success: false, message: "Failed to create audit" },
      { status: 500 }
    );
  }
} 