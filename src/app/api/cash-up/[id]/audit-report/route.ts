import { CashUpSubmissionModel } from "@/app/models/hr/cash-up-submission.schema";
import { CashUpAuditReportModel } from "@/app/models/hr/cash-up-audit-report.schema";
import { NotificationModel } from "@/app/models/notification.schema";
import UserModel from "@/app/models/hr/user.schema";
import { getUserFromRequest } from "@/lib/auth";
import { cloudinary } from "@/lib/cloudinary";
import { connectToDatabase } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";

function toNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const cleaned = value.replace(/[, ]+/g, "").trim();
    if (!cleaned) return null;
    const n = Number(cleaned);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function normHeaderCell(value: unknown) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, "");
}

function normName(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function dateKeyFrom(value: unknown): string | null {
  // Supports "YYYY/MM/DD" or "YYYY-MM-DD" and Date objects
  if (value instanceof Date && !isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }
  const s = String(value ?? "").trim();
  const m = s.match(/(\d{4})[\/-](\d{2})[\/-](\d{2})/);
  if (!m) return null;
  return `${m[1]}-${m[2]}-${m[3]}`;
}

function extractTotalsFromWorkbook(buffer: Buffer) {
  const wb = XLSX.read(buffer, { type: "buffer", cellDates: true });
  const sheetName = wb.SheetNames[0];
  if (!sheetName) {
    throw new Error("No worksheet found in the uploaded file.");
  }
  const ws = wb.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, raw: true }) as unknown[][];

  // Find header row that contains "TransactionType" and "Amount"
  let headerRowIdx = -1;
  for (let i = 0; i < Math.min(rows.length, 50); i++) {
    const row = Array.isArray(rows[i]) ? (rows[i] as unknown[]) : [];
    const norm = row.map((c) => normHeaderCell(c));
    if (norm.includes("transactiontype") && norm.includes("amount")) {
      headerRowIdx = i;
      break;
    }
  }
  if (headerRowIdx === -1) {
    throw new Error("Could not find the TransactionType/Amount header row in the spreadsheet.");
  }

  const headerRow = Array.isArray(rows[headerRowIdx]) ? (rows[headerRowIdx] as unknown[]) : [];
  const headerNorm = headerRow.map((c) => normHeaderCell(c));
  const idxTransactionType = headerNorm.findIndex((h) => h === "transactiontype");
  const idxAmount = headerNorm.findIndex((h) => h === "amount");
  if (idxTransactionType === -1 || idxAmount === -1) {
    throw new Error("Spreadsheet headers are missing TransactionType or Amount columns.");
  }

  const idxEffDate = headerNorm.findIndex((h) => h === "effdate" || h === "eff-date");

  let incomeTotal = 0;
  let expenseTotal = 0;
  let rowsParsed = 0;
  let firstDateKey: string | null = null;

  for (let i = headerRowIdx + 1; i < rows.length; i++) {
    const row = rows[i] || [];
    const t = String(row[idxTransactionType] ?? "").trim().toUpperCase();
    const n = toNumber(row[idxAmount]);
    if (!t && n === null) continue;
    if (!t) continue;
    if (n === null) continue;

    const amtAbs = Math.abs(n);
    if (t === "INCOME") incomeTotal += amtAbs;
    else if (t === "EXPENSE") expenseTotal += amtAbs;
    else continue;

    rowsParsed += 1;

    if (!firstDateKey && idxEffDate !== -1) {
      firstDateKey = dateKeyFrom(row[idxEffDate]);
    }
  }

  const netTotal = incomeTotal - expenseTotal;
  return { incomeTotal, expenseTotal, netTotal, rowsParsed, sheetName, firstDateKey };
}

function extractMetaFromWorkbook(buffer: Buffer) {
  const wb = XLSX.read(buffer, { type: "buffer", cellDates: true });
  const sheetName = wb.SheetNames[0];
  if (!sheetName) throw new Error("No worksheet found in the uploaded file.");
  const ws = wb.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, raw: true }) as unknown[][];

  let employeeNameFromReport: string | null = null;
  let reportFromDateKey: string | null = null;
  let reportToDateKey: string | null = null;

  for (let i = 0; i < Math.min(rows.length, 30); i++) {
    const row = Array.isArray(rows[i]) ? (rows[i] as unknown[]) : [];
    const line = row.map((c) => String(c ?? "").trim()).filter(Boolean).join(" ");
    const upper = line.toUpperCase();

    const nameMatch = upper.match(/TRANSACTION REPORT\s+FOR\s+(.+)$/i);
    if (!employeeNameFromReport && nameMatch?.[1]) {
      employeeNameFromReport = String(nameMatch[1]).trim();
    }

    const fromToMatch = upper.match(/FROM\s+(\d{4}[\/-]\d{2}[\/-]\d{2})\s+TO\s+(\d{4}[\/-]\d{2}[\/-]\d{2})/i);
    if (!reportFromDateKey && fromToMatch?.[1]) reportFromDateKey = dateKeyFrom(fromToMatch[1]);
    if (!reportToDateKey && fromToMatch?.[2]) reportToDateKey = dateKeyFrom(fromToMatch[2]);
  }

  return { employeeNameFromReport, reportFromDateKey, reportToDateKey };
}

async function uploadToCloudinaryRaw(params: { buffer: Buffer; folder: string; fileName: string }) {
  const { buffer, folder, fileName } = params;
  const uploadResult = await new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "raw",
        public_id: fileName.replace(/\.[^/.]+$/, ""),
        use_filename: true,
        unique_filename: true,
      },
      (err, result) => {
        if (err) reject(err);
        else resolve(result);
      }
    );
    stream.end(buffer);
  });
  return uploadResult as any;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const roles = [(user as any)?.role, ...(((user as any)?.roles as string[]) || [])].filter(Boolean);
    const canReview = roles.includes("admin") || roles.includes("cashup_reviewer");
    if (!canReview) {
      return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    if (!file) {
      return NextResponse.json({ success: false, message: "No file provided" }, { status: 400 });
    }

    const fileName = String(file.name || "audit-report.xlsx");
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const totals = extractTotalsFromWorkbook(buffer);
    const meta = extractMetaFromWorkbook(buffer);

    await connectToDatabase();
    const submission = await CashUpSubmissionModel.findById(id);
    if (!submission) {
      return NextResponse.json({ success: false, message: "Cash up submission not found" }, { status: 404 });
    }

    const submissionDateKey = new Date((submission as any).date).toISOString().slice(0, 10);
    const submissionUserId = String((submission as any).userId);
    const submissionUser = await UserModel.findById(submissionUserId).select({ name: 1 }).lean();
    const expectedName = String((submissionUser as any)?.name || "").trim();

    const reportName = String(meta.employeeNameFromReport || "").trim();
    const reportFrom = meta.reportFromDateKey || totals.firstDateKey;
    const reportTo = meta.reportToDateKey || totals.firstDateKey;

    const reportDateKey = reportFrom || reportTo;
    if (!reportName || !reportDateKey) {
      return NextResponse.json(
        {
          success: false,
          message: "Could not detect employee name and/or report date from the spreadsheet.",
        },
        { status: 400 }
      );
    }

    // Validate report belongs to this cashier and date
    const expectedTokens = normName(expectedName).split(" ").filter(Boolean);
    const reportNorm = normName(reportName);
    const nameMatches = expectedTokens.length ? expectedTokens.every((t) => reportNorm.includes(t)) : false;
    const dateMatches = reportDateKey === submissionDateKey;

    if (!nameMatches || !dateMatches) {
      return NextResponse.json(
        {
          success: false,
          message: "Uploaded report does not match the selected employee/date. Please upload the correct report.",
          expected: { employeeName: expectedName, date: submissionDateKey },
          detected: { employeeName: reportName, date: reportDateKey },
        },
        { status: 400 }
      );
    }

    const cashupTotal = Number((submission as any).totalAmount ?? 0) || 0;
    const delta = totals.netTotal - cashupTotal;
    const balanced = Math.abs(delta) <= 0.01;

    // Upload evidence file
    const uploadResult = await uploadToCloudinaryRaw({
      buffer,
      folder: `cash-up/audit-reports/${id}`,
      fileName,
    });

    const fileUrl = uploadResult?.secure_url ?? uploadResult?.url ?? null;

    // Upsert report for user+date (so we can reuse it even if cashup wasn't submitted yet)
    await CashUpAuditReportModel.updateOne(
      { userId: submissionUserId, dateKey: submissionDateKey },
      {
        $set: {
          userId: submissionUserId,
          dateKey: submissionDateKey,
          employeeNameFromReport: reportName,
          reportFromDateKey: reportFrom || submissionDateKey,
          reportToDateKey: reportTo || submissionDateKey,
          fileUrl,
          fileName,
          incomeTotal: totals.incomeTotal,
          expenseTotal: totals.expenseTotal,
          netTotal: totals.netTotal,
          uploadedById: String((user as any)._id),
          uploadedByName: String((user as any).name || ""),
        },
      },
      { upsert: true }
    );

    // Mirror summary on the submission for quick rendering
    (submission as any).auditReport = {
      fileUrl,
      fileName,
      incomeTotal: totals.incomeTotal,
      expenseTotal: totals.expenseTotal,
      netTotal: totals.netTotal,
      cashupTotal,
      delta,
      balanced,
      uploadedAt: new Date(),
      uploadedById: String((user as any)._id),
      uploadedByName: String((user as any).name || ""),
    };

    // If it doesn't balance: auto send-back + notify submitter
    let action: "stored" | "sent_back" = "stored";
    let notifyFailed = false;
    if (!balanced) {
      (submission as any).status = "needs_changes";
      (submission as any).reviewedAt = new Date();
      (submission as any).reviewedById = String((user as any)._id);
      (submission as any).reviewedByName = String((user as any).name || "");
      (submission as any).reviewNotes = [
        ...(((submission as any).reviewNotes as string[]) || []),
        `[${new Date().toISOString()}] System: Audit report mismatch (expected net ${totals.netTotal.toFixed(2)} vs cashup ${cashupTotal.toFixed(2)}, delta ${delta.toFixed(2)}). Submission sent back.`,
      ];

      action = "sent_back";
    }

    await submission.save();

    // Best-effort notification (do not fail the request if this times out)
    if (action === "sent_back") {
      try {
        const recipientUserId = String((submission as any).userId);
        await NotificationModel.create({
          recipientUserId,
          actorUserId: String((user as any)._id),
          type: "CASHUP_BALANCE_MISMATCH",
          title: "Cashup requires attention",
          message: `Your cashup does not balance against the uploaded audit report. Please review and resubmit.`,
          link: "/cash-up/dashboard",
          severity: "WARNING",
          data: {
            cashupSubmissionId: String((submission as any)._id),
            date: new Date((submission as any).date).toISOString().slice(0, 10),
            audit: {
              incomeTotal: totals.incomeTotal,
              expenseTotal: totals.expenseTotal,
              netTotal: totals.netTotal,
              cashupTotal,
              delta,
            },
          },
          readAt: null,
        });
      } catch (e) {
        notifyFailed = true;
        console.error("Failed to create cashup mismatch notification:", e);
      }
    }

    return NextResponse.json({
      success: true,
      message: balanced
        ? "Audit report uploaded"
        : notifyFailed
          ? "Audit report uploaded — submission sent back (notification failed)"
          : "Audit report uploaded — submission sent back (does not balance)",
      action,
      notifyFailed,
      audit: {
        incomeTotal: totals.incomeTotal,
        expenseTotal: totals.expenseTotal,
        netTotal: totals.netTotal,
        cashupTotal,
        delta,
        balanced,
        rowsParsed: totals.rowsParsed,
        sheetName: totals.sheetName,
        fileUrl,
        fileName,
        expected: { employeeName: expectedName, date: submissionDateKey },
        detected: { employeeName: reportName, date: reportDateKey },
      },
    });
  } catch (error) {
    console.error("Error uploading audit report:", error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Failed to upload audit report",
      },
      { status: 500 }
    );
  }
}

