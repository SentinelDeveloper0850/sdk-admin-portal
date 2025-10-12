"use client";

import { IAssitPolicy } from "@/app/models/scheme/assit-policy.schema";
import { IMemberPolicy } from "@/app/(protected)/policies/view/page";
import { Button, Drawer, Form, Input, Space } from "antd";
import Image from "next/image";
import React, { useEffect, useMemo, useRef } from "react";

interface Props {
  open: boolean;
  onClose: () => void;
  policy: IAssitPolicy;
}

const CR80_RATIO = 85.6 / 53.98; // ~1.586 (w / h)

const PolicyPrintCardDrawer: React.FC<Props> = ({ open, onClose, policy }) => {
  const [printCardForm] = Form.useForm<IAssitPolicy>();
  const watched = Form.useWatch([], printCardForm);

  // Barcode SVG ref
  const barcodeRef = useRef<SVGSVGElement | null>(null);

  // Seed form when opened
  useEffect(() => {
    if (open && policy) {
      console.log("policy", policy);
      printCardForm.setFieldsValue({
        membershipID: policy?.membershipID || "TMB0000",
        payAtNumber: policy?.payAtNumber || "11536100264",
        fullName: policy?.fullName || "John Doe",
      });
    }
  }, [open, policy, printCardForm]);

  // Re-render barcode whenever payAtNumber changes
  useEffect(() => {
    const render = async () => {
      if (!barcodeRef.current) return;
      const JsBarcode = (await import("jsbarcode")).default;
      const value = String(watched?.payAtNumber || "");
      if (!value) {
        barcodeRef.current.innerHTML = "";
        return;
      }
      // Clean previous contents (important when re-rendering SVG)
      while (barcodeRef.current.firstChild) {
        barcodeRef.current.removeChild(barcodeRef.current.firstChild);
      }
      // Render into <svg>
      JsBarcode(barcodeRef.current, value, {
        format: "CODE128",
        displayValue: false,
        height: 44,      // tune visually for your preview box
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
      brandHex: "#0B3B2E",
    }),
    [watched]
  );

  // Hit the PDF endpoint and open print dialog
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

  // preview sizing (keeps ratio; width can be tweaked)
  const previewWidth = 340; // px
  const previewHeight = Math.round(previewWidth / CR80_RATIO);

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
          <Form form={printCardForm} layout="vertical">
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
            <Form.Item name="fullName" label="Full Name" rules={[{ required: true }]}>
              <Input />
            </Form.Item>
          </Form>
        </div>

        {/* ===== Right: Live Preview (CR80) ===== */}
        <div>
          <div
            className="rounded-md overflow-hidden relative select-none shadow-lg"
            style={{
              width: previewWidth,
              height: previewHeight,
              background: "#fff",
              color: "#000",
              fontFamily:
                "Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial",
            }}
          >
            {/* Brand strip background */}
            <div className="bg-primary"
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                top: 0,
                height: 18,
                // background: "#0B3B2E",
              }}
            />

            {/* 3-zone layout */}
            <div className="relative z-10 h-full w-full flex flex-col pt-8 px-1">
              {/* ==== HEADER (brand row) ==== */}
              <div className="flex items-center justify-between px-3" style={{ height: 18 }}>
                <div className="text-md font-semibold leading-none">Somdaka Funerals</div>
                <Image
                  src="/logo.png"
                  alt="logo"
                  width={36}
                  height={36}
                  className="block"
                  priority
                />
              </div>

              {/* ==== MIDDLE (policy + member row) ==== */}
              <div className="flex-1 flex items-center px-3">
                <div className="w-full flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-[10px] opacity-80 leading-none mb-1">Policy</div>
                    <div className="text-[14px] font-semibold leading-[1.1]">
                      {payload.policyNumber}
                    </div>
                  </div>
                  <div className="min-w-0 text-right">
                    <div className="text-[10px] opacity-80 leading-none mb-1">Member</div>
                    <div
                      className="text-[12px] font-semibold ml-auto"
                      title={payload.fullName}
                    >
                      {payload.fullName}
                    </div>
                  </div>
                </div>
              </div>

              {/* ==== FOOTER (barcode + Pay@) ==== */}
              <div className="px-3 pb-2 flex flex-col items-center justify-end">
                <svg ref={barcodeRef} style={{ width: "96%", height: 32 }} />
                <div className="text-[12px] font-bold mt-1 text-center">
                  {payload.payAtNumber}
                </div>
              </div>
            </div>

            {/* Optional safe-zone guide (preview only) */}
            <div
              style={{
                position: "absolute",
                inset: 6,
                border: "1px dashed rgba(255,255,255,0.15)",
                borderRadius: 6,
                pointerEvents: "none",
              }}
            />
          </div>

          <div className="text-xs text-muted-foreground mt-2">
            Preview is to scale (CR80). Actual print uses a PDF exactly sized for the Zenius.
          </div>
        </div>

      </div>
    </Drawer >
  );
};

export default PolicyPrintCardDrawer;
