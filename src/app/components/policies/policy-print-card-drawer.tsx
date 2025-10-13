"use client";

import { IAssitPolicy } from "@/app/models/scheme/assit-policy.schema";
import { Button, Drawer, Form, Input, Space } from "antd";
import Image from "next/image";
import React, { useEffect, useMemo, useRef } from "react";

interface Props {
  open: boolean;
  onClose: () => void;
  policy: IAssitPolicy;
}

const CR80_RATIO = 85.6 / 53.98; // ~1.586 (w / h)

// Brand tokens (tweak as needed)
const GOLD = "#ffac00";        // header band
const TEXT = "#121417";
const SUBTEXT = "rgba(18,20,23,0.68)";

const PolicyPrintCardDrawer: React.FC<Props> = ({ open, onClose, policy }) => {
  const [form] = Form.useForm<IAssitPolicy>();
  const watched = Form.useWatch([], form);

  // Barcode SVG ref
  const barcodeRef = useRef<SVGSVGElement | null>(null);

  // Seed form when opened
  useEffect(() => {
    if (open && policy) {
      form.setFieldsValue({
        membershipID: policy?.membershipID || "TMS196",
        payAtNumber: policy?.payAtNumber || "11536110020",
        fullName: policy?.fullName || "S MANDLAZI",
      });
    }
  }, [open, policy, form]);

  // Re-render barcode whenever payAtNumber changes
  useEffect(() => {
    const render = async () => {
      if (!barcodeRef.current) return;
      const JsBarcode = (await import("jsbarcode")).default;
      const value = String(watched?.payAtNumber || "");
      while (barcodeRef.current.firstChild) {
        barcodeRef.current.removeChild(barcodeRef.current.firstChild);
      }
      if (!value) return;
      JsBarcode(barcodeRef.current, value, {
        format: "CODE128",
        displayValue: false,
        height: 40,
        margin: 0,
      });
    };
    render();
  }, [watched?.payAtNumber]);

  const payload = useMemo(
    () => ({
      policyNumber: watched?.membershipID || "",
      payAtNumber: watched?.payAtNumber || "",
      fullName: watched?.fullName || "",
      orgName: "Somdaka Funerals",
      brandHex: "#ffac00",
    }),
    [watched]
  );

  // Print
  const handlePrint = async () => {
    const res = await fetch("/api/cards/print", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank");
  };

  // Preview sizing (keeps CR80 ratio)
  const previewWidth = 340; // px
  const previewHeight = Math.round(previewWidth / CR80_RATIO);
  const headerH = 48;       // px

  return (
    <Drawer
      title={`Policy Print Card - ${policy?.membershipID || ""}`}
      placement="right"
      width="60%"
      onClose={onClose}
      open={open}
      extra={
        <Space>
          <Button onClick={onClose}>Close</Button>
          <Button type="primary" onClick={handlePrint}>
            Print
          </Button>
        </Space>
      }
    >
      <div className="grid grid-cols-2 gap-6">
        {/* ===== Left: Form ===== */}
        <div>
          <Form form={form} layout="vertical">
            <Form.Item name="membershipID" label="Policy Number" rules={[{ required: true }]}>
              <Input />
            </Form.Item>
            <Form.Item
              name="payAtNumber"
              label="Pay@ Number"
              rules={[{ required: true, message: "Pay@ number is required" }]}
            >
              <Input />
            </Form.Item>
            <Form.Item name="fullName" label="Member Name" rules={[{ required: true }]}>
              <Input />
            </Form.Item>
          </Form>
        </div>

        {/* ===== Right: Live Preview (CR80) ===== */}
        <div>
          <div
            className="rounded-lg overflow-hidden relative select-none shadow-lg"
            style={{
              width: previewWidth,
              height: previewHeight,
              background: "#fff",
              color: TEXT,
              fontFamily:
                "Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial",
            }}
          >
            {/* HEADER (gold band with crest + title) */}
            <div
              style={{
                position: "absolute",
                insetInline: 0,
                top: 0,
                height: headerH,
                background: "#ffac00",
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "0 14px",
              }}
            >
              <Image
                src="/logo.png"
                alt="Somdaka crest"
                width={28}
                height={28}
                style={{ display: "block" }}
                priority
              />
              <div
                style={{
                  fontWeight: 700,
                  letterSpacing: 0.25,
                  color: "#000",
                  fontSize: 14,
                }}
              >
                SOMDAKA FUNERALS
              </div>
            </div>

            {/* WATERMARK (large crest, very faint) */}
            <Image
              src="/logo.png"
              alt="watermark"
              fill
              style={{
                objectFit: "contain",
                opacity: 0.06,
                transform: "scale(1.3)",
                marginTop: headerH,
              }}
            />

            {/* CONTENT */}
            <div className="relative z-10 h-full w-full flex flex-col" style={{ paddingTop: headerH }}>
              {/* Middle: labels + values */}
              <div className="flex-1 px-4 py-3 flex flex-col gap-2 justify-center">
                <div>
                  <div style={{ fontSize: 10, color: SUBTEXT, lineHeight: 1 }}>Policy No.</div>
                  <div style={{ fontSize: 16, fontWeight: 800, lineHeight: 1.15 }}>
                    {payload.policyNumber || "\u00A0"}
                  </div>
                </div>

                <div style={{ marginTop: 6 }}>
                  <div style={{ fontSize: 10, color: SUBTEXT, lineHeight: 1 }}>Member</div>
                  <div
                    style={{
                      fontSize: 16,
                      fontWeight: 800,
                      lineHeight: 1.1,
                      textTransform: "uppercase",
                      letterSpacing: 0.2,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                    title={payload.fullName}
                  >
                    {payload.fullName || "\u00A0"}
                  </div>
                </div>
              </div>

              {/* Footer: barcode centered + Pay@ bottom-right */}
              <div className="px-3 pb-2 relative">
                <div className="flex flex-col items-center">
                  <svg ref={barcodeRef} style={{ width: "92%", height: 36 }} />
                  <div className="text-[12px] font-bold mt-1 text-center tracking-wider">
                    {payload.payAtNumber}
                  </div>
                </div>

                {/* Pay@ logo */}
                <Image
                  src="/payat.png"
                  alt="Pay@"
                  width={60}
                  height={20}
                  className="absolute"
                  style={{ right: 8, bottom: 8 }}
                />
              </div>
            </div>

            {/* Safe-zone guide (preview only) */}
            <div
              style={{
                position: "absolute",
                inset: 6,
                border: "1px dashed rgba(18,20,23,0.12)",
                borderRadius: 8,
                pointerEvents: "none",
              }}
            />
          </div>

          <div className="text-xs text-muted-foreground mt-2">
            Preview is to scale (CR80). The PDF print will match this layout exactly.
          </div>
        </div>
      </div>
    </Drawer>
  );
};

export default PolicyPrintCardDrawer;
