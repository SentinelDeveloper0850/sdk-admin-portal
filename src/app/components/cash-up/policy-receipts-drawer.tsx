"use client";

import React, { useEffect, useState } from "react";

import { UploadOutlined } from "@ant-design/icons";
import { Alert, Button, Col, DatePicker, Drawer, Form, Input, InputNumber, message, Row, Select, Space, Typography, Upload } from "antd";
import dayjs from "dayjs";

import { useAuth } from "@/context/auth-context";

const { TextArea } = Input;
const { Title, Text } = Typography;
const { Option } = Select;

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmitted: () => void;
  defaultDate?: string; // YYYY-MM-DD
}

// OCR removed for now

const PolicyReceiptsDrawer: React.FC<Props> = ({ open, onClose, onSubmitted, defaultDate }) => {
  const { user } = useAuth();
  const [form] = Form.useForm();
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [fileList, setFileList] = useState<any[]>([]);
  // OCR removed for now
  const [isLateSubmission, setIsLateSubmission] = useState(false);

  // Watch key fields so we can disable submit until valid
  const wDate = Form.useWatch("date", form);
  const wSubmittedAmount = Form.useWatch("submittedAmount", form);
  const wPaymentMethod = Form.useWatch("paymentMethod", form);
  const wCashAmount = Form.useWatch("cashAmount", form);
  const wCardAmount = Form.useWatch("cardAmount", form);
  const wReasonForCashTransactions = Form.useWatch("reasonForCashTransactions", form);

  // Direct pre-upload removed; we'll upload on submit

  const uploadFiles = async (files: File[], submissionIdSuffix: string) => {
    const uploadedFiles: any[] = [];
    for (const file of files) {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("submissionIdSuffix", submissionIdSuffix);
      const res = await fetch("/api/upload/cash-up/policy-receipts", {
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
  const dateOk = !!wDate;
  const amountOk = wSubmittedAmount !== undefined && wSubmittedAmount !== null && Number(wSubmittedAmount) >= 0;
  const paymentOk = ["cash", "card", "both"].includes(pmWatch);
  const splitOk =
    pmWatch !== "both" ||
    (wCashAmount !== undefined &&
      wCashAmount !== null &&
      wCardAmount !== undefined &&
      wCardAmount !== null &&
      Math.round((Number(wCashAmount) + Number(wCardAmount)) * 100) === Math.round(Number(wSubmittedAmount) * 100));
  const reasonOk =
    !["cash", "both"].includes(pmWatch) ||
    (typeof wReasonForCashTransactions === "string" && wReasonForCashTransactions.trim().length > 0);

  const canSubmit =
    fileList.length > 0 &&
    !processing &&
    !uploading &&
    dateOk &&
    amountOk &&
    paymentOk &&
    splitOk &&
    reasonOk;

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();

      setProcessing(true);

      // Group submissions by the selected receipt date
      const submissionIdSuffix = dayjs(values.date).format("YYYYMMDD");

      const files: File[] = fileList.map((file) => file.originFileObj as File);

      // Upload files to Cloudinary (collect URLs)
      setUploading(true);
      const uploadedFiles = await uploadFiles(files, submissionIdSuffix);
      setUploading(false);

      const pm = String(values.paymentMethod || "").toLowerCase();
      const submitted = Number(values.submittedAmount || 0);
      const cash = Number(values.cashAmount ?? 0);
      const card = Number(values.cardAmount ?? 0);
      const reason = String(values.reasonForCashTransactions || "").trim();

      if (!["cash", "card", "both"].includes(pm)) {
        message.error("Please select a payment method (cash, card, or both).");
        return;
      }
      if (pm === "both" && Math.round((cash + card) * 100) !== Math.round(submitted * 100)) {
        message.error("Cash + card must equal the submitted amount.");
        return;
      }
      if (["cash", "both"].includes(pm) && !reason) {
        message.error("Please provide a reason for cash transactions.");
        return;
      }

      const submissionData = {
        submissionIdSuffix: submissionIdSuffix,
        files: uploadedFiles,
        date: dayjs(values.date).format("YYYY-MM-DD"),
        submittedAmount: submitted,
        paymentMethod: pm,
        cashAmount: pm === "both" ? cash : pm === "cash" ? submitted : undefined,
        cardAmount: pm === "both" ? card : pm === "card" ? submitted : undefined,
        reasonForCashTransactions: ["cash", "both"].includes(pm) ? reason : undefined,
        notes: values.notes || "",
        submittedAt: new Date().toISOString(),
        userId: user?._id?.toString() || "",
      }

      const res = await fetch("/api/cash-up/policy-receipts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(submissionData),
      });

      const json = await res.json();

      if (json.success) {
        message.success(json.message || "Receipts submitted successfully!");
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

  const checkSubmissionTiming = (date: dayjs.Dayjs) => {
    const now = dayjs();
    const submissionDate = date || now;
    const cutoff = submissionDate.hour(20).minute(0).second(0);
    const gracePeriod = cutoff.add(30, 'minute');

    setIsLateSubmission(now.isAfter(gracePeriod));
  };

  const resetForm = () => {
    form.resetFields();
    setFileList([]);
    setIsLateSubmission(false);
    if (defaultDate) {
      const d = dayjs(defaultDate);
      form.setFieldsValue({ date: d });
      checkSubmissionTiming(d);
    }
  };

  useEffect(() => {
    if (!open) return;
    if (!defaultDate) return;
    const d = dayjs(defaultDate);
    form.setFieldsValue({ date: d });
    checkSubmissionTiming(d);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, defaultDate]);

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
      title="Submit Policy Receipts"
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

          <Row gutter={16}>
            <Col span={12}>
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
            </Col>
            <Col span={12}>
              <Form.Item name="submittedAmount" label="Submitted Amount" rules={[{ required: true, message: "Please enter the submitted amount" }]}>
                <InputNumber prefix="R" min={0} step={100} style={{ width: "100%" }} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="paymentMethod"
            label="Payment Method"
            rules={[{ required: true, message: "Please select a payment method" }]}
          >
            <Select placeholder="Select payment method" disabled={processing}>
              <Option value="cash">Cash</Option>
              <Option value="card">Card</Option>
              <Option value="both">Both (cash/card split)</Option>
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
              if (!["cash", "both"].includes(pm)) return null;
              return (
                <Form.Item
                  name="reasonForCashTransactions"
                  label="Reason for Cash Transactions"
                  rules={[
                    { required: true, whitespace: true, message: "Please provide a reason for cash transactions" },
                    {
                      validator: async (_, value) => {
                        const v = String(value ?? "").trim();
                        if (!v) throw new Error("Please provide a reason for cash transactions");
                      },
                    },
                  ]}
                >
                  <Input placeholder="Explain why cash was used" disabled={processing} />
                </Form.Item>
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

export default PolicyReceiptsDrawer; 