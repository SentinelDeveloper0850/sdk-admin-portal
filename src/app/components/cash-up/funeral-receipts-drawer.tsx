"use client";

import React, { useState } from "react";

import { UploadOutlined } from "@ant-design/icons";
import { Alert, Button, DatePicker, Drawer, Form, Input, InputNumber, message, Space, Typography, Upload, Select } from "antd";
import dayjs from "dayjs";

// import { useAuth } from "@/context/auth-context";

const { TextArea } = Input;
const { Title, Text } = Typography;
const { Option } = Select;

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmitted: () => void;
}

// OCR removed for now

const FuneralReceiptsDrawer: React.FC<Props> = ({ open, onClose, onSubmitted }) => {
  // const { user } = useAuth();
  const [form] = Form.useForm();
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [fileList, setFileList] = useState<any[]>([]);
  // OCR removed for now
  const [isLateSubmission, setIsLateSubmission] = useState(false);
  // Direct pre-upload removed; we'll upload on submit

  // Watch key fields so we can disable submit until valid
  const wDate = Form.useWatch("date", form);
  const wInvoiceNumber = Form.useWatch("invoiceNumber", form);
  const wSubmittedAmount = Form.useWatch("submittedAmount", form);
  const wPaymentMethod = Form.useWatch("paymentMethod", form);
  const wCashAmount = Form.useWatch("cashAmount", form);
  const wCardAmount = Form.useWatch("cardAmount", form);
  const wBankDepositReference = Form.useWatch("bankDepositReference", form);

  const uploadFiles = async (files: File[], submissionIdSuffix: string) => {
    const uploadedFiles: any[] = [];
    for (const file of files) {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("submissionIdSuffix", submissionIdSuffix);
      const res = await fetch("/api/upload/cash-up/funeral-receipts", {
        method: "POST",
        body: formData,
      });
      const json = await res.json();
      if (!json?.success) throw new Error(json?.message || "Upload failed");
      uploadedFiles.push(json.url);
    }
    return uploadedFiles;
  };

  const pmWatch = String(wPaymentMethod || "").toLowerCase();
  const invoiceOk = typeof wInvoiceNumber === "string" && wInvoiceNumber.trim().length > 0;
  const dateOk = !!wDate;
  const amountOk = wSubmittedAmount !== undefined && wSubmittedAmount !== null && Number(wSubmittedAmount) >= 0;
  const paymentOk = ["cash", "card", "both", "bank_deposit"].includes(pmWatch);
  const splitOk =
    pmWatch !== "both" ||
    (wCashAmount !== undefined &&
      wCashAmount !== null &&
      wCardAmount !== undefined &&
      wCardAmount !== null &&
      Math.round((Number(wCashAmount) + Number(wCardAmount)) * 100) === Math.round(Number(wSubmittedAmount) * 100));
  const bankDepositOk =
    pmWatch !== "bank_deposit" ||
    (typeof wBankDepositReference === "string" && wBankDepositReference.trim().length > 0);

  const canSubmit =
    fileList.length > 0 &&
    !processing &&
    !uploading &&
    dateOk &&
    invoiceOk &&
    amountOk &&
    paymentOk &&
    splitOk &&
    bankDepositOk;

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();

      setProcessing(true);

      // Get submission identifier suffix (date)
      const submissionIdSuffix = dayjs().format("YYYYMMDD");

      const files: File[] = fileList.map((file) => file.originFileObj as File);

      // Upload files to Cloudinary (collect URLs)
      setUploading(true);
      const uploadedFiles = await uploadFiles(files, submissionIdSuffix);
      setUploading(false);

      const pm = String(values.paymentMethod || "").toLowerCase();
      const submitted = Number(values.submittedAmount || 0);
      const inv = String(values.invoiceNumber || "").trim();

      if (!["cash", "card", "both", "bank_deposit"].includes(pm)) {
        message.error("Please select a payment method (cash, card, both, or bank deposit).");
        return;
      }
      if (!inv) {
        message.error("Please enter the invoice number.");
        return;
      }

      const cash = Number(values.cashAmount ?? 0);
      const card = Number(values.cardAmount ?? 0);
      if (pm === "both" && Math.round((cash + card) * 100) !== Math.round(submitted * 100)) {
        message.error("Cash + card must equal the submitted amount.");
        return;
      }

      if (pm === "bank_deposit") {
        const ref = String(values.bankDepositReference || "").trim();
        if (!ref) {
          message.error("Please enter the bank deposit reference.");
          return;
        }
      }

      const submissionData = {
        submissionIdSuffix,
        files: uploadedFiles,
        date: dayjs(values.date).format("YYYY-MM-DD"),
        invoiceNumber: inv,
        submittedAmount: submitted,
        paymentMethod: pm,
        cashAmount: pm === "both" ? cash : pm === "cash" ? submitted : undefined,
        cardAmount: pm === "both" ? card : pm === "card" ? submitted : undefined,
        bankDepositReference: pm === "bank_deposit" ? String(values.bankDepositReference || "").trim() : undefined,
        bankName: pm === "bank_deposit" ? String(values.bankName || "").trim() : undefined,
        depositorName: pm === "bank_deposit" ? String(values.depositorName || "").trim() : undefined,
        notes: values.notes || "",
        submittedAt: new Date().toISOString(),
      };

      const res = await fetch("/api/cash-up/funeral-receipts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(submissionData),
      });

      const json = await res.json();

      if (json.success) {
        message.success(json.message || "Receipts submitted successfully!");
        // Close first (controlled by parent), then clear local form state
        onClose();
        resetForm();
        onSubmitted();
      } else {
        message.error(json.message || "Error submitting receipts");
      }
    } catch (error) {
      message.error("Please correct the errors in the form.");
    } finally {
      setProcessing(false);
    }
  };

  const resetForm = () => {
    form.resetFields();
    setFileList([]);
    setIsLateSubmission(false);
  };

  const checkSubmissionTiming = (date: dayjs.Dayjs) => {
    const now = dayjs();
    const submissionDate = date || now;
    const cutoff = submissionDate.hour(20).minute(0).second(0);
    const gracePeriod = cutoff.add(30, 'minute');

    setIsLateSubmission(now.isAfter(gracePeriod));
  };

  const uploadProps = {
    // prevent auto upload; we'll upload on submit
    beforeUpload: () => false,
    fileList,
    onChange: ({ fileList }: any) => setFileList(fileList),
    accept: ".jpg,.jpeg,.png,.pdf",
    maxCount: 10,
    disabled: processing,
  };

  return (
    <Drawer
      title="Submit Funeral Receipts"
      placement="right"
      width="60%"
      open={open}
      onClose={() => {
        resetForm();
        onClose();
      }}
      footer={
        <Space>
          <Button onClick={() => {
            resetForm();
            onClose();
          }}>
            Cancel
          </Button>
          <Button
            type="primary"
            onClick={handleSubmit}
            loading={processing || uploading}
            disabled={!canSubmit}
          >
            Submit Receipts
          </Button>
        </Space>
      }
    >
      <div className="space-y-6">
        {/* Cash Up Cutoff Warning */}
        <Alert
          message="Cash Up Submission Deadline"
          description="All receipts must be submitted by 8:00 PM daily. Late submissions will be flagged for review."
          type="info"
          showIcon
        />

        {/* Late Submission Warning */}
        {isLateSubmission && (
          <Alert
            message="Late Submission"
            description="This submission is after the grace period and will be flagged as late."
            type="warning"
            showIcon
          />
        )}

        <Form form={form} layout="vertical">
          <Form.Item
            name="date"
            label="Receipt Date"
            rules={[{ required: true, message: "Please select the receipt date" }]}
          >
            <DatePicker
              style={{ width: "100%" }}
              disabledDate={(current) => current && current.isAfter(dayjs(), "day")}
              onChange={checkSubmissionTiming}
              defaultValue={dayjs()}
            />
          </Form.Item>

          <Form.Item
            name="invoiceNumber"
            label="Invoice Number"
            rules={[
              { required: true, whitespace: true, message: "Please enter the invoice number" },
              {
                validator: async (_, value) => {
                  const v = String(value ?? "").trim();
                  if (!v) throw new Error("Please enter the invoice number");
                },
              },
            ]}
          >
            <Input placeholder="Enter invoice number" disabled={processing} />
          </Form.Item>

          <Form.Item name="submittedAmount" label="Submitted Amount" rules={[{ required: true, message: "Please enter the submitted amount" }]}>
            <InputNumber prefix="R" min={0} step={100} style={{ width: "100%" }} />
          </Form.Item>

          <Form.Item
            name="paymentMethod"
            label="Payment Method"
            rules={[{ required: true, message: "Please select a payment method" }]}
          >
            <Select placeholder="Select payment method" disabled={processing}>
              <Option value="cash">Cash</Option>
              <Option value="card">Card</Option>
              <Option value="both">Both (part payments)</Option>
              <Option value="bank_deposit">Bank Deposit (POP)</Option>
            </Select>
          </Form.Item>

          <Form.Item shouldUpdate={(prev, cur) => prev.paymentMethod !== cur.paymentMethod || prev.submittedAmount !== cur.submittedAmount}>
            {() => {
              const pm = String(form.getFieldValue("paymentMethod") || "").toLowerCase();
              if (pm !== "both") return null;
              return (
                <div className="grid grid-cols-2 gap-4">
                  <Form.Item
                    name="cashAmount"
                    label="Cash Amount"
                    rules={[{ required: true, message: "Enter cash amount" }]}
                  >
                    <InputNumber prefix="R" min={0} step={50} style={{ width: "100%" }} disabled={processing} />
                  </Form.Item>
                  <Form.Item
                    name="cardAmount"
                    label="Card Amount"
                    rules={[{ required: true, message: "Enter card amount" }]}
                  >
                    <InputNumber prefix="R" min={0} step={50} style={{ width: "100%" }} disabled={processing} />
                  </Form.Item>
                </div>
              );
            }}
          </Form.Item>

          <Form.Item shouldUpdate={(prev, cur) => prev.paymentMethod !== cur.paymentMethod}>
            {() => {
              const pm = String(form.getFieldValue("paymentMethod") || "").toLowerCase();
              if (pm !== "bank_deposit") return null;
              return (
                <div className="grid grid-cols-1 gap-4">
                  <Form.Item
                    name="bankDepositReference"
                    label="Deposit Reference"
                    rules={[
                      { required: true, whitespace: true, message: "Please enter the deposit reference" },
                      {
                        validator: async (_, value) => {
                          const v = String(value ?? "").trim();
                          if (!v) throw new Error("Please enter the deposit reference");
                        },
                      },
                    ]}
                  >
                    <Input placeholder="e.g. bank ref / receipt ref" disabled={processing} />
                  </Form.Item>
                  <Form.Item name="bankName" label="Bank (Optional)">
                    <Input placeholder="e.g. ABSA / FNB / Standard Bank" disabled={processing} />
                  </Form.Item>
                  <Form.Item name="depositorName" label="Depositor Name (Optional)">
                    <Input placeholder="Name on the deposit slip" disabled={processing} />
                  </Form.Item>
                </div>
              );
            }}
          </Form.Item>

          <Form.Item
            name="notes"
            label="Notes (Optional)"
          >
            <TextArea
              rows={3}
              placeholder="Add any notes about today's receipts..."
            />
          </Form.Item>

          {/* File Upload Section */}
          <div className="space-y-4">
            <Title level={5}>Upload Receipt Images</Title>

            <Upload.Dragger {...uploadProps}>
              <p className="ant-upload-drag-icon">
                <UploadOutlined />
              </p>
              <p className="ant-upload-text">Click or drag receipt images to upload</p>
              <p className="ant-upload-hint">
                Support for JPG, PNG, PDF files. Max file size: 10MB
              </p>
            </Upload.Dragger>

            {uploading && (
              <div className="text-center py-4">
                <div className="text-blue-500">Uploading and processing...</div>
              </div>
            )}
          </div>
        </Form>
      </div>
    </Drawer>
  );
};

export default FuneralReceiptsDrawer; 