import { CashUpSubmissionModel } from "@/app/models/hr/cash-up-submission.schema";
import { NotificationModel } from "@/app/models/notification.schema";
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
    const row = rows[i] || [];
    const norm = row.map((c) => String(c ?? "").trim().toLowerCase());
    if (norm.includes("transactiontype") && norm.includes("amount")) {
      headerRowIdx = i;
      break;
    }
  }
  if (headerRowIdx === -1) {
    throw new Error("Could not find the TransactionType/Amount header row in the spreadsheet.");
  }

  const header = (rows[headerRowIdx] || []).map((c) => String(c ?? "").trim());
  const idxTransactionType = header.findIndex((h) => h.toLowerCase() === "transactiontype");
  const idxAmount = header.findIndex((h) => h.toLowerCase() === "amount");
  if (idxTransactionType === -1 || idxAmount === -1) {
    throw new Error("Spreadsheet headers are missing TransactionType or Amount columns.");
  }

  let incomeTotal = 0;
  let expenseTotal = 0;
  let rowsParsed = 0;

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
  }

  const netTotal = incomeTotal - expenseTotal;
  return { incomeTotal, expenseTotal, netTotal, rowsParsed, sheetName };
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

    await connectToDatabase();
    const submission = await CashUpSubmissionModel.findById(id);
    if (!submission) {
      return NextResponse.json({ success: false, message: "Cash up submission not found" }, { status: 404 });
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

    (submission as any).auditReport = {
      fileUrl: uploadResult?.secure_url ?? uploadResult?.url ?? null,
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
    if (!balanced) {
      (submission as any).status = "needs_changes";
      (submission as any).reviewedAt = new Date();
      (submission as any).reviewedById = String((user as any)._id);
      (submission as any).reviewedByName = String((user as any).name || "");
      (submission as any).reviewNotes = [
        ...(((submission as any).reviewNotes as string[]) || []),
        `[${new Date().toISOString()}] System: Audit report mismatch (expected net ${totals.netTotal.toFixed(2)} vs cashup ${cashupTotal.toFixed(2)}, delta ${delta.toFixed(2)}). Submission sent back.`,
      ];

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

      action = "sent_back";
    }

    await submission.save();

    return NextResponse.json({
      success: true,
      message: balanced ? "Audit report uploaded" : "Audit report uploaded — submission sent back (does not balance)",
      action,
      audit: {
        incomeTotal: totals.incomeTotal,
        expenseTotal: totals.expenseTotal,
        netTotal: totals.netTotal,
        cashupTotal,
        delta,
        balanced,
        rowsParsed: totals.rowsParsed,
        sheetName: totals.sheetName,
        fileUrl: uploadResult?.secure_url ?? uploadResult?.url ?? null,
        fileName,
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

