import { CashUpAuditReportModel } from "@/app/models/hr/cash-up-audit-report.schema";
import UserModel from "@/app/models/hr/user.schema";
import { getUserFromRequest } from "@/lib/auth";
import { cloudinary } from "@/lib/cloudinary";
import { connectToDatabase } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";

function dateKeyFrom(value: unknown): string | null {
  if (value instanceof Date && !isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }
  const s = String(value ?? "").trim();
  const m = s.match(/(\d{4})[\/-](\d{2})[\/-](\d{2})/);
  if (!m) return null;
  return `${m[1]}-${m[2]}-${m[3]}`;
}

function normName(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function extractMetaAndTotals(buffer: Buffer) {
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

  // Totals: find TransactionType + Amount header row
  let headerRowIdx = -1;
  let idxTransactionType = -1;
  let idxAmount = -1;
  let idxEffDate = -1;

  const normHeaderCell = (v: unknown) => String(v ?? "").trim().toLowerCase().replace(/[\s_-]+/g, "");

  for (let i = 0; i < Math.min(rows.length, 50); i++) {
    const row = Array.isArray(rows[i]) ? (rows[i] as unknown[]) : [];
    const norm = row.map((c) => normHeaderCell(c));
    if (norm.includes("transactiontype") && norm.includes("amount")) {
      headerRowIdx = i;
      idxTransactionType = norm.findIndex((h) => h === "transactiontype");
      idxAmount = norm.findIndex((h) => h === "amount");
      idxEffDate = norm.findIndex((h) => h === "effdate" || h === "eff-date");
      break;
    }
  }

  let incomeTotal = 0;
  let expenseTotal = 0;
  let firstDateKey: string | null = null;

  const toNumber = (value: unknown) => {
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string") {
      const cleaned = value.replace(/[, ]+/g, "").trim();
      if (!cleaned) return null;
      const n = Number(cleaned);
      return Number.isFinite(n) ? n : null;
    }
    return null;
  };

  if (headerRowIdx !== -1 && idxTransactionType !== -1 && idxAmount !== -1) {
    for (let i = headerRowIdx + 1; i < rows.length; i++) {
      const row = Array.isArray(rows[i]) ? (rows[i] as unknown[]) : [];
      const t = String(row[idxTransactionType] ?? "").trim().toUpperCase();
      const n = toNumber(row[idxAmount]);
      if (!t || n === null) continue;
      const amtAbs = Math.abs(n);
      if (t === "INCOME") incomeTotal += amtAbs;
      else if (t === "EXPENSE") expenseTotal += amtAbs;
      if (!firstDateKey && idxEffDate !== -1) firstDateKey = dateKeyFrom(row[idxEffDate]);
    }
  }

  const netTotal = incomeTotal - expenseTotal;
  return {
    sheetName,
    employeeNameFromReport,
    reportFromDateKey: reportFromDateKey || firstDateKey,
    reportToDateKey: reportToDateKey || firstDateKey,
    incomeTotal,
    expenseTotal,
    netTotal,
  };
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

export async function POST(request: NextRequest) {
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

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    if (!file) {
      return NextResponse.json({ success: false, message: "No file provided" }, { status: 400 });
    }

    const fileName = String(file.name || "audit-report.xlsx");
    const buffer = Buffer.from(await file.arrayBuffer());

    const parsed = extractMetaAndTotals(buffer);
    const reportName = String(parsed.employeeNameFromReport || "").trim();
    const reportDateKey = parsed.reportFromDateKey || parsed.reportToDateKey;

    if (!reportName || !reportDateKey) {
      return NextResponse.json(
        { success: false, message: "Could not detect employee name/date from the spreadsheet." },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // Try to match user by name (must be unique)
    const candidates = await UserModel.find({
      name: { $regex: new RegExp(`^${reportName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") },
    })
      .select({ _id: 1, name: 1 })
      .lean();

    if (candidates.length !== 1) {
      return NextResponse.json(
        {
          success: false,
          message: "Could not uniquely match the report employee to a user. Please upload via a specific cashup submission instead.",
          detected: { employeeName: reportName, date: reportDateKey },
          matches: candidates.length,
        },
        { status: 400 }
      );
    }

    const targetUserId = String((candidates[0] as any)._id);
    const expectedTokens = normName(String((candidates[0] as any).name || "")).split(" ").filter(Boolean);
    const reportNorm = normName(reportName);
    const nameMatches = expectedTokens.length ? expectedTokens.every((t) => reportNorm.includes(t)) : false;
    if (!nameMatches) {
      return NextResponse.json(
        {
          success: false,
          message: "Detected employee name does not match the resolved user name.",
          detected: { employeeName: reportName, date: reportDateKey },
          expected: { employeeName: String((candidates[0] as any).name || ""), date: reportDateKey },
        },
        { status: 400 }
      );
    }

    const uploadResult = await uploadToCloudinaryRaw({
      buffer,
      folder: `cash-up/audit-reports/${targetUserId}/${reportDateKey}`,
      fileName,
    });
    const fileUrl = uploadResult?.secure_url ?? uploadResult?.url ?? null;

    await CashUpAuditReportModel.updateOne(
      { userId: targetUserId, dateKey: reportDateKey },
      {
        $set: {
          userId: targetUserId,
          dateKey: reportDateKey,
          employeeNameFromReport: reportName,
          reportFromDateKey: parsed.reportFromDateKey || reportDateKey,
          reportToDateKey: parsed.reportToDateKey || reportDateKey,
          fileUrl,
          fileName,
          incomeTotal: parsed.incomeTotal,
          expenseTotal: parsed.expenseTotal,
          netTotal: parsed.netTotal,
          uploadedById: String((user as any)._id),
          uploadedByName: String((user as any).name || ""),
        },
      },
      { upsert: true }
    );

    return NextResponse.json({
      success: true,
      message: "Audit report uploaded",
      detected: { employeeName: reportName, date: reportDateKey },
      audit: {
        incomeTotal: parsed.incomeTotal,
        expenseTotal: parsed.expenseTotal,
        netTotal: parsed.netTotal,
        fileUrl,
        fileName,
      },
    });
  } catch (error) {
    console.error("Error uploading standalone audit report:", error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Failed to upload audit report",
      },
      { status: 500 }
    );
  }
}

