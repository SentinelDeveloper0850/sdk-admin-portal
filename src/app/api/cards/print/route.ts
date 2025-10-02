export const runtime = "nodejs";

import bwipjs from "bwip-js";
import { NextRequest, NextResponse } from "next/server";
import PDFDocument from "pdfkit";

const mmToPt = (mm: number) => (mm / 25.4) * 72;
const CARD_W_MM = 85.6;
const CARD_H_MM = 53.98;

export async function POST(req: NextRequest) {
    const { policyNumber, payAtNumber, fullName } = await req.json();

    const barcodePng: Buffer = await bwipjs.toBuffer({
        bcid: "code128",
        text: String(payAtNumber ?? ""),
        scale: 3,
        height: 12,
        includetext: false,
        backgroundcolor: "FFFFFF",
        barcolor: "000000",
        paddingwidth: 12,
        paddingheight: 6,
    });

    const widthPt = mmToPt(CARD_W_MM);
    const heightPt = mmToPt(CARD_H_MM);

    const stream = new ReadableStream({
        start(controller) {
            const doc = new PDFDocument({
                size: [widthPt, heightPt],
                margins: { top: 0, bottom: 0, left: 0, right: 0 },
            });
            doc.on("data", (c) => controller.enqueue(c));
            doc.on("end", () => controller.close());

            const pad = mmToPt(2);
            const stripH = mmToPt(5);

            // header strip
            doc.rect(0, 0, widthPt, stripH).fill("#f4b000");

            // brand text
            doc.fillColor("#000").fontSize(9).text("Somdaka Funerals", pad, mmToPt(1.2), {
                width: widthPt - pad * 2,
                align: "left",
            });

            // middle (policy/member)
            const midTop = stripH + mmToPt(3.5);
            const sideW = (widthPt - pad * 2) / 2;

            doc.fontSize(7).fillColor("#6b7280").text("Policy", pad, midTop);
            doc.fontSize(12).fillColor("#000").text(String(policyNumber ?? ""), pad, midTop + mmToPt(3));

            doc.fontSize(7).fillColor("#6b7280").text("Member", pad + sideW, midTop, {
                width: sideW - pad,
                align: "right",
            });
            doc.fontSize(10).fillColor("#000").text(String(fullName ?? ""), pad + sideW, midTop + mmToPt(3), {
                width: sideW - pad,
                align: "right",
            });

            // footer (barcode + digits)
            const barcodeW = widthPt - pad * 2;
            const barcodeY = heightPt - pad - mmToPt(13);
            doc.image(barcodePng, pad, barcodeY, { width: barcodeW, align: "center" });
            doc.fontSize(10).fillColor("#000").text(String(payAtNumber ?? ""), pad, barcodeY + mmToPt(10.5), {
                width: barcodeW,
                align: "center",
            });

            doc.end();
        },
    });

    return new NextResponse(stream as any, {
        headers: {
            "Content-Type": "application/pdf",
            "Content-Disposition": `inline; filename="card-${policyNumber || "member"}.pdf"`,
            "Cache-Control": "no-store",
        },
    });
}
