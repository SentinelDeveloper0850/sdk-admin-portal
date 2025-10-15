// app/api/cards/print/route.ts
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import bwipjs from "bwip-js";
import fs from "node:fs/promises";
import path from "node:path";

const mmToPt = (mm: number) => (mm / 25.4) * 72;
const CARD_W_MM = 85.6;
const CARD_H_MM = 53.98;

// Brand colours (tuned to preview)
const GOLD = rgb(1.0, 0.675, 0.0);     // header band
const TEXT = rgb(0.07, 0.08, 0.09);    // #121417-ish
const LABEL = rgb(0.07, 0.08, 0.09);   // used with opacity for light labels

export async function POST(req: NextRequest) {
    const { policyNumber, payAtNumber, fullName } = await req.json();

    // 1) Barcode PNG (keep your existing settings if you prefer)
    const barcodePng: Buffer = await bwipjs.toBuffer({
        bcid: "code128",
        text: String(payAtNumber ?? ""),
        scale: 2,
        height: 90,            // px bar height (we will size in PDF)
        includetext: false,
        backgroundcolor: "FFFFFF",
        monochrome: true,
        paddingwidth: 0,
        paddingheight: 0,
    });

    // 2) Create PDF
    const pdf = await PDFDocument.create();
    const widthPt = mmToPt(CARD_W_MM);
    const heightPt = mmToPt(CARD_H_MM);
    const page = pdf.addPage([widthPt, heightPt]);

    // 3) Fonts (built-ins to avoid fontkit)
    const fontRegular = await pdf.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdf.embedFont(StandardFonts.HelveticaBold);

    // 4) Assets
    let crestImg, payatImg;
    try {
        const crest = await fs.readFile(path.join(process.cwd(), "public", "logo.png"));
        crestImg = await pdf.embedPng(crest);
    } catch { }
    try {
        const payat = await fs.readFile(path.join(process.cwd(), "public", "payat.png"));
        payatImg = await pdf.embedPng(payat);
    } catch { }

    const barcodeImg = await pdf.embedPng(barcodePng);

    // ---- Layout tokens (match preview) ----
    const pad = mmToPt(3);                // outer padding
    const headerH = mmToPt(12);           // tall gold band
    const crestSize = mmToPt(8);          // crest in header
    const contentLeft = pad + mmToPt(2);  // left margin for text
    const contentTopY = heightPt - headerH - mmToPt(5.5);

    // Background
    page.drawRectangle({ x: 0, y: 0, width: widthPt, height: heightPt, color: rgb(1, 1, 1) });

    // Header band
    page.drawRectangle({ x: 0, y: heightPt - headerH, width: widthPt, height: headerH, color: GOLD });

    // Crest (left in header)
    if (crestImg) {
        page.drawImage(crestImg, {
            x: pad,
            y: heightPt - headerH + (headerH - crestSize) / 2,
            width: crestSize,
            height: crestSize,
        });
    }

    // Title in header
    page.drawText("SOMDAKA FUNERALS", {
        x: pad + crestSize + mmToPt(2.5),
        y: heightPt - headerH + (headerH - 12) / 2 + 1,
        size: 10,
        font: fontBold,
        color: rgb(0,0,0), // white in band
    });

    // Watermark (large, faint crest)
    if (crestImg) {
        const wmSize = heightPt * 1.15;
        page.drawImage(crestImg, {
            x: (widthPt - wmSize) / 2,
            y: (heightPt - wmSize) / 2 - mmToPt(1.5),
            width: wmSize,
            height: wmSize,
            opacity: 0.06,
        });
    }

    // ---- Middle content (labels + values) ----
    let y = contentTopY;

    // Policy No.
    page.drawText("Policy No.", {
        x: contentLeft,
        y,
        size: 8,
        font: fontRegular,
        color: LABEL,
        opacity: 0.68,
    });
    y -= mmToPt(4.2);
    page.drawText(String(policyNumber ?? ""), {
        x: contentLeft,
        y,
        size: 13,
        font: fontBold,
        color: TEXT,
    });

    // Member
    y -= mmToPt(6.2);
    page.drawText("Member", {
        x: contentLeft,
        y,
        size: 8,
        font: fontRegular,
        color: LABEL,
        opacity: 0.68,
    });
    y -= mmToPt(4.2);
    page.drawText(String(fullName ?? "").toUpperCase(), {
        x: contentLeft,
        y,
        size: 13,
        font: fontBold,
        color: TEXT,
    });

    // ---- Barcode centered + digits ----
    const barcodeW = widthPt * 0.82;
    const barcodeH = mmToPt(6);            // visual height in card units
    const barcodeX = (widthPt - barcodeW) / 2;
    const barcodeY = pad + mmToPt(9);       // leaves space for digits + Pay@

    page.drawImage(barcodeImg, {
        x: barcodeX,
        y: barcodeY,
        width: barcodeW,
        height: barcodeH,
    });

    const digits = String(payAtNumber ?? "");
    const digitsSize = 10.5;
    const digitsWidth = fontBold.widthOfTextAtSize(digits, digitsSize);
    page.drawText(digits, {
        x: (widthPt - digitsWidth) / 2,
        y: barcodeY - mmToPt(4),
        size: digitsSize,
        font: fontBold,
        color: TEXT,
    });

    // ---- Pay@ bottom-right ----
    if (payatImg) {
        const payW = mmToPt(18);
        const payH = (payW / payatImg.width) * payatImg.height;
        page.drawImage(payatImg, {
            x: widthPt - payW - mmToPt(3),
            y: mmToPt(3),
            width: payW,
            height: payH,
        });
    }

    // 5) Return PDF
    const bytes = await pdf.save();
    return new NextResponse(Buffer.from(bytes), {
        headers: {
            "Content-Type": "application/pdf",
            "Content-Disposition": `inline; filename="card-${policyNumber || "member"}.pdf"`,
            "Cache-Control": "no-store",
        },
    });
}
