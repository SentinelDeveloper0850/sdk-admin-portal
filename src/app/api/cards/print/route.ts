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

export async function POST(req: NextRequest) {
    const { policyNumber, payAtNumber, fullName } = await req.json();

    // 1) Make barcode PNG buffer
    const barcodePng: Buffer = await bwipjs.toBuffer({
        bcid: "code128",
        text: String(payAtNumber ?? ""),
        scale: 3,
        height: 12,          // mm visual bar height (we’ll scale in PDF)
        includetext: false,
        backgroundcolor: "FFFFFF",
        barcolor: "000000",
        paddingwidth: 12,    // quiet zones
        paddingheight: 6,
    });

    // 2) Create PDF
    const pdf = await PDFDocument.create();
    const widthPt = mmToPt(CARD_W_MM);
    const heightPt = mmToPt(CARD_H_MM);
    const page = pdf.addPage([widthPt, heightPt]);

    // 3) Embed fonts (use built-in first; swap to Montserrat if you want)
    const fontRegular = await pdf.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdf.embedFont(StandardFonts.HelveticaBold);

    // If you prefer your Montserrat TTFs in /public/fonts:
    // const montPath = path.join(process.cwd(), "public", "fonts", "Montserrat-Regular.ttf");
    // const montBoldPath = path.join(process.cwd(), "public", "fonts", "Montserrat-Bold.ttf");
    // const [montBytes, montBoldBytes] = await Promise.all([fs.readFile(montPath), fs.readFile(montBoldPath)]);
    // const fontRegular = await pdf.embedFont(montBytes);
    // const fontBold    = await pdf.embedFont(montBoldBytes);

    // Optional logo (/public/logo.png)
    let logoImg;
    try {
        const logoPath = path.join(process.cwd(), "public", "logo.png");
        const logoBytes = await fs.readFile(logoPath);
        logoImg = await pdf.embedPng(logoBytes);
    } catch { /* ignore if not present */ }

    // Embed barcode PNG
    const barcodeImg = await pdf.embedPng(barcodePng);

    // 4) Layout constants
    const pad = mmToPt(2);
    const stripH = mmToPt(5);

    // Colors
    const brandYellow = rgb(0.956, 0.690, 0.000); // #f4b000
    const gray = rgb(0.42, 0.45, 0.50);    // labels

    // ===== HEADER STRIP =====
    page.drawRectangle({
        x: 0, y: heightPt - stripH,
        width: widthPt, height: stripH,
        color: brandYellow,
    });

    // Brand row (inside strip)
    const headerY = heightPt - stripH - mmToPt(8.5);
    page.drawText("Somdaka Funerals", {
        x: pad, y: headerY,
        size: 12, font: fontRegular, color: rgb(0, 0, 0),
    });

    if (logoImg) {
        const logoW = mmToPt(10.0);
        const logoH = mmToPt(10.0);
        // const logoH = (logoW / logoImg.width) * logoImg.height;
        page.drawImage(logoImg, {
            x: widthPt - pad - logoW,
            y: heightPt - stripH - mmToPt(12.5),
            width: logoW,
            height: logoH,
        });
    }

    // ===== MIDDLE (policy + member) =====
    const midTop = heightPt - stripH - mmToPt(24.0);
    const sideW = (widthPt - pad * 2) / 2;

    // Policy (left)
    page.drawText("Policy", { x: pad, y: midTop + mmToPt(2.5), size: 7, font: fontRegular, color: gray });
    page.drawText(String(policyNumber ?? ""), {
        x: pad, y: midTop - mmToPt(3),
        size: 12, font: fontBold, color: rgb(0, 0, 0),
    });

    // Member (right)
    const rightX = pad + sideW;
    const rightBoxW = sideW - pad;

    page.drawText("Member", {
        x: rightX + Math.max(0, rightBoxW - fontRegular.widthOfTextAtSize("Member", 7)), y: midTop + mmToPt(2.5),
        size: 7, font: fontRegular, color: gray,
    });
    const memberText = String(fullName ?? "");
    const memberWidth = fontBold.widthOfTextAtSize(memberText, 10);
    const memberX = rightX + Math.max(0, rightBoxW - memberWidth);
    page.drawText(memberText, {
        x: memberX, y: midTop - mmToPt(3),
        size: 10, font: fontBold, color: rgb(0, 0, 0),
    });

    // ===== FOOTER (barcode + Pay@) =====
    const barcodeW = widthPt - pad * 2;
    const barcodeH = mmToPt(8);                 // visual bar height
    const barcodeY = pad + mmToPt(6);            // leave room for digits

    page.drawImage(barcodeImg, {
        x: pad,
        y: barcodeY,
        width: barcodeW,
        height: barcodeH,
    });

    const digits = String(payAtNumber ?? "");
    const digitsSize = 10;
    const digitsWidth = fontBold.widthOfTextAtSize(digits, digitsSize);
    page.drawText(digits, {
        x: (widthPt - digitsWidth) / 2,
        y: barcodeY - mmToPt(2.5),
        size: digitsSize,
        font: fontBold,
        color: rgb(0, 0, 0),
    });

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
