"use client";

import React, { useState } from "react";

import { UploadOutlined } from "@ant-design/icons";
import { Alert, Button, DatePicker, Drawer, Form, Input, InputNumber, message, Space, Typography, Upload } from "antd";
import dayjs from "dayjs";

// import { useAuth } from "@/context/auth-context";

const { TextArea } = Input;
const { Title, Text } = Typography;

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmitted: () => void;
}

// OCR removed for now

const SalesReceiptsDrawer: React.FC<Props> = ({ open, onClose, onSubmitted }) => {
  // const { user } = useAuth();
  const [form] = Form.useForm();
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [fileList, setFileList] = useState<any[]>([]);
  // OCR removed for now
  const [isLateSubmission, setIsLateSubmission] = useState(false);
  // Direct pre-upload removed; we'll upload on submit

  const uploadFiles = async (files: File[], submissionIdSuffix: string) => {
    const uploadedFiles: any[] = [];
    for (const file of files) {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("submissionIdSuffix", submissionIdSuffix);
      const res = await fetch("/api/upload/daily-sales-receipts", {
        method: "POST",
        body: formData,
      });
      const json = await res.json();
      if (!json?.success) throw new Error(json?.message || "Upload failed");
      uploadedFiles.push(json.url);
    }
    return uploadedFiles;
  };

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

      const submissionData = {
        submissionIdSuffix,
        files: uploadedFiles,
        date: dayjs(values.date).format("YYYY-MM-DD"),
        submittedAmount: values.submittedAmount || 0,
        notes: values.notes || "",
        submittedAt: new Date().toISOString(),
      };

      const res = await fetch("/api/daily-audit/sales-receipts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(submissionData),
      });

      const json = await res.json();

      if (json.success) {
        message.success(json.message || "Receipts submitted successfully!");
        resetForm();
        onClose();
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
      title="Submit Sales Receipts"
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
            disabled={fileList.length === 0}
          >
            Submit Receipts
          </Button>
        </Space>
      }
    >
      <div className="space-y-6">
        {/* Daily Cutoff Warning */}
        <Alert
          message="Daily Submission Deadline"
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

          <Form.Item name="submittedAmount" label="Submitted Amount" rules={[{ required: true, message: "Please enter the submitted amount" }]}>
            <InputNumber prefix="R" min={0} step={100} style={{ width: "100%" }} />
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

          {/* Submission summary removed with OCR */}
        </Form>
      </div>
    </Drawer>
  );
};

export default SalesReceiptsDrawer; 