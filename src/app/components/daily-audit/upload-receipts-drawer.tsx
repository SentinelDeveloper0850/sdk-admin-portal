"use client";

import React, { useState } from "react";

import { CheckCircleOutlined, UploadOutlined } from "@ant-design/icons";
import { Alert, Button, DatePicker, Drawer, Form, Input, InputNumber, message, Space, Typography, Upload } from "antd";
import dayjs from "dayjs";

import { useAuth } from "@/context/auth-context";

const { TextArea } = Input;
const { Title, Text } = Typography;

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmitted: () => void;
}

interface OCRResult {
  extractedTotal: number;
  confidence: number;
  confirmedTotal: number;
  isConfirmed: boolean;
}

const UploadReceiptsDrawer: React.FC<Props> = ({ open, onClose, onSubmitted }) => {
  const { user } = useAuth();
  const [form] = Form.useForm();
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [fileList, setFileList] = useState<any[]>([]);
  const [ocrResult, setOcrResult] = useState<OCRResult | null>(null);
  const [cutoffTime, setCutoffTime] = useState(dayjs().hour(20).minute(0).second(0));
  const [isLateSubmission, setIsLateSubmission] = useState(false);

  const handleFileUpload = async (file: File) => {
    setUploading(true);
    setProcessing(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("date", form.getFieldValue("date") || dayjs().format("YYYY-MM-DD"));

      const res = await fetch("/api/audit/upload-receipts", {
        method: "POST",
        body: formData,
      });

      const json = await res.json();
      setUploading(false);

      if (json.success) {
        // Simulate OCR result - in real implementation, this would come from the API
        const mockOcrResult: OCRResult = {
          extractedTotal: json.extractedTotal || Math.floor(Math.random() * 10000) + 1000,
          confidence: json.confidence || 0.85,
          confirmedTotal: json.extractedTotal || Math.floor(Math.random() * 10000) + 1000,
          isConfirmed: false,
        };

        setOcrResult(mockOcrResult);
        message.success("File uploaded successfully. Please confirm the extracted total.");
      } else {
        message.error(json.message || "Upload failed");
        return Upload.LIST_IGNORE;
      }
    } catch (error) {
      setUploading(false);
      setProcessing(false);
      message.error("Upload failed");
      return Upload.LIST_IGNORE;
    }

    setProcessing(false);
    return false; // prevent default upload behavior
  };

  const handleConfirmTotal = () => {
    if (ocrResult) {
      setOcrResult({
        ...ocrResult,
        confirmedTotal: ocrResult.extractedTotal,
        isConfirmed: true,
      });
    }
  };

  const handleManualTotal = (value: number | null) => {
    if (ocrResult && value !== null) {
      setOcrResult({
        ...ocrResult,
        confirmedTotal: value,
        isConfirmed: true,
      });
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();

      if (!ocrResult?.isConfirmed) {
        message.error("Please confirm or correct the extracted total");
        return;
      }

      setProcessing(true);

      const payload = {
        ...values,
        date: dayjs(values.date).format("YYYY-MM-DD"),
        batchReceiptTotal: ocrResult.confirmedTotal,
        ocrResult: {
          extractedTotal: ocrResult.extractedTotal,
          confidence: ocrResult.confidence,
          confirmedTotal: ocrResult.confirmedTotal,
        },
        submittedAt: new Date().toISOString(),
      };

      const res = await fetch("/api/audit/upload-receipts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (json.success) {
        message.success("Receipts submitted successfully!");
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
    setOcrResult(null);
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
    beforeUpload: handleFileUpload,
    fileList,
    onChange: ({ fileList }: any) => setFileList(fileList),
    accept: ".jpg,.jpeg,.png,.pdf",
    maxCount: 1,
    disabled: uploading || processing,
  };

  return (
    <Drawer
      title="Upload Daily Receipts"
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
            loading={processing}
            disabled={!ocrResult?.isConfirmed}
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

          {/* OCR Results Section */}
          {ocrResult && !uploading && (
            <div className="space-y-4 border rounded-lg p-4 bg-gray-50">
              <Title level={5}>OCR Extraction Results</Title>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Text className="text-gray-500">Extracted Total:</Text>
                  <div className="text-lg font-semibold">
                    R {ocrResult.extractedTotal.toFixed(2)}
                  </div>
                </div>
                <div>
                  <Text className="text-gray-500">Confidence:</Text>
                  <div className="text-lg font-semibold">
                    {(ocrResult.confidence * 100).toFixed(1)}%
                  </div>
                </div>
              </div>

              {ocrResult.confidence < 0.8 && (
                <Alert
                  message="Low OCR Confidence"
                  description="The extracted amount has low confidence. Please verify and correct if needed."
                  type="warning"
                  showIcon
                />
              )}

              <div className="space-y-2">
                <Text className="text-gray-500">Confirm or Correct Total:</Text>

                <div className="flex items-center gap-2">
                  <InputNumber
                    value={ocrResult.confirmedTotal}
                    onChange={handleManualTotal}
                    formatter={(value) => `R ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                    parser={(value) => Number(value!.replace(/\$\s?|(,*)/g, ''))}
                    style={{ width: 200 }}
                    precision={2}
                  />
                  <Button
                    type="primary"
                    onClick={handleConfirmTotal}
                    disabled={ocrResult.isConfirmed}
                  >
                    Confirm
                  </Button>
                </div>

                {ocrResult.isConfirmed && (
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircleOutlined />
                    <Text>Total confirmed</Text>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Submission Summary */}
          {ocrResult?.isConfirmed && (
            <div className="space-y-4 border rounded-lg p-4 bg-green-50">
              <Title level={5}>Submission Summary</Title>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Text className="text-gray-500">Employee:</Text>
                  <div className="font-medium">{user?.name}</div>
                </div>
                <div>
                  <Text className="text-gray-500">Date:</Text>
                  <div className="font-medium">
                    {dayjs(form.getFieldValue("date") || dayjs()).format("DD MMM YYYY")}
                  </div>
                </div>
                <div>
                  <Text className="text-gray-500">Total Amount:</Text>
                  <div className="font-medium text-lg">
                    R {ocrResult.confirmedTotal.toFixed(2)}
                  </div>
                </div>
                <div>
                  <Text className="text-gray-500">Submission Time:</Text>
                  <div className="font-medium">
                    {dayjs().format("HH:mm")}
                  </div>
                </div>
              </div>

              {isLateSubmission && (
                <Alert
                  message="Late Submission Notice"
                  description="This submission is after the daily cutoff and will be flagged for review."
                  type="warning"
                  showIcon
                />
              )}
            </div>
          )}
        </Form>
      </div>
    </Drawer>
  );
};

export default UploadReceiptsDrawer; 