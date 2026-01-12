import { CashUpSubmissionModel } from "@/app/models/hr/cash-up-submission.schema";
import UserModel from "@/app/models/hr/user.schema";
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
    const roles = [(user as any)?.role, ...(((user as any)?.roles as string[]) || [])].filter(Boolean);
    const isAdmin = roles.includes("admin") || roles.includes("Admin");
    const isCashupReviewer = roles.includes("cashup_reviewer");
    const canReviewAll = isAdmin || isCashupReviewer;

    if (canReviewAll) {
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

    const docs = await CashUpSubmissionModel.find(query).sort({ createdAt: -1 }).lean();

    const userIds = Array.from(new Set(docs.map((d: any) => String(d.userId)).filter(Boolean)));
    const users = await UserModel.find({ _id: { $in: userIds } }).select({ _id: 1, name: 1 }).lean();
    const userNameById = new Map(users.map((u: any) => [String(u._id), String(u.name || "")]));

    // Map DB docs to UI shape expected by table
    const cashUpSubmissions = docs.map((doc: any) => {
      const latestSubmission = Array.isArray(doc.submissions) && doc.submissions.length > 0
        ? doc.submissions[doc.submissions.length - 1]
        : null;

      const allAttachments = Array.isArray(doc.submissions)
        ? doc.submissions.flatMap((s: any) => (Array.isArray(s?.files) ? s.files : [])).filter(Boolean)
        : [];

      return {
        _id: String(doc._id),
        date: new Date(doc.date).toISOString().slice(0, 10),
        employeeId: doc.userId,
        employeeName: userNameById.get(String(doc.userId)) || String(doc.userId),
        batchReceiptTotal: doc.totalAmount ?? null,
        systemBalance: null,
        discrepancy: 0,
        status: doc.status || "draft",
        submissionStatus: doc.status || "draft",
        riskLevel: "low",
        submittedAt: doc.submittedAt ?? latestSubmission?.submittedAt ?? doc.createdAt,
        reviewedBy: doc.reviewedByName ?? doc.reviewedById ?? null,
        reviewedAt: doc.reviewedAt ?? null,
        isResolved: false,
        notes: (doc.reviewNotes && doc.reviewNotes.length ? doc.reviewNotes.join("\n\n") : null),
        attachments: allAttachments.length ? allAttachments : (latestSubmission?.files || []),
        isLateSubmission: !!doc.isLateSubmission,
      };
    });

    return NextResponse.json({
      success: true,
      cashUpSubmissions,
    });
  } catch (error) {
    console.error("Error fetching cash up submissions:", error);
    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to fetch cash up submissions",
      },
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

    const newCashUpSubmission = {
      _id: Date.now().toString(),
      ...body,
      status: "draft",
      submissionStatus: "pending",
      riskLevel: "low",
      submittedAt: null,
      reviewedBy: null,
      reviewedAt: null,
      isResolved: false,
      notes: [],
      attachments: [],
      reviewNotes: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return NextResponse.json({
      success: true,
      cashUpSubmission: newCashUpSubmission,
    });
  } catch (error) {
    console.error("Error creating cash up submission:", error);
    return NextResponse.json(
      { success: false, message: "Failed to create cash up submission" },
      { status: 500 }
    );
  }
} 