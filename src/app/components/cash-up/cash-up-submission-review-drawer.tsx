"use client";

import React, { useState } from "react";

import { ClockCircleOutlined, UserOutlined } from "@ant-design/icons";
import { Alert, Button, Descriptions, Divider, Drawer, Form, Image, Input, Select, Space, Tag, Typography, message } from "antd";
import dayjs from "dayjs";

import { useAuth } from "@/context/auth-context";

const { TextArea } = Input;
const { Title, Text } = Typography;
const { Option } = Select;

interface CashUpSubmission {
  _id: string;
  date: string;
  employeeId: string;
  employeeName: string;
  batchReceiptTotal: number;
  systemBalance: number;
  discrepancy: number;
  status: string;
  submissionStatus: string;
  riskLevel: string;
  submittedAt: string;
  reviewedBy?: string;
  reviewedAt?: string;
  isResolved: boolean;
  notes?: string;
  resolutionNotes?: string;
  attachments: string[];
}

interface Props {
  open: boolean;
  onClose: () => void;
  cashUpSubmission: CashUpSubmission | null;
  onUpdated: () => void;
}

const CashUpSubmissionReviewDrawer: React.FC<Props> = ({ open, onClose, cashUpSubmission, onUpdated }) => {
  const { user } = useAuth();
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);
  const [resolutionStatus, setResolutionStatus] = useState<string>("");

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR'
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Balanced":
        return "green";
      case "Short":
        return "red";
      case "Over":
        return "orange";
      case "Awaiting System Balance":
        return "blue";
      case "Missing Batch Receipt":
        return "red";
      default:
        return "default";
    }
  };

  const getRiskLevelColor = (riskLevel: string) => {
    switch (riskLevel) {
      case "high":
        return "red";
      case "medium":
        return "orange";
      case "low":
        return "green";
      default:
        return "default";
    }
  };

  const getSubmissionStatusColor = (status: string) => {
    switch (status) {
      case "Submitted":
        return "green";
      case "Submitted Late (Grace Period)":
        return "orange";
      case "Submitted Late":
        return "red";
      case "Not Submitted":
        return "red";
      default:
        return "default";
    }
  };

  const handleResolve = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);

      const payload = {
        ...values,
        isResolved: true,
        reviewedBy: user?._id,
        reviewedAt: new Date().toISOString(),
      };

      const res = await fetch(`/api/cash-up/${cashUpSubmission?._id}/resolve`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (json.success) {
        message.success("Cash up submission resolved successfully");
        onUpdated();
        onClose();
      } else {
        message.error(json.message || "Failed to resolve cash up submission");
      }
    } catch (error) {
      message.error("Please correct the errors in the form");
    } finally {
      setSaving(false);
    }
  };

  const handleAddNotes = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);

      const payload = {
        notes: values.notes,
        reviewedBy: user?._id,
        reviewedAt: new Date().toISOString(),
      };

      const res = await fetch(`/api/cash-up/${cashUpSubmission?._id}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (json.success) {
        message.success("Notes added successfully to cash up submission");
        onUpdated();
        form.resetFields();
      } else {
        message.error(json.message || "Failed to add notes to cash up submission");
      }
    } catch (error) {
      message.error("Please correct the errors in the form to add notes to cash up submission");
    } finally {
      setSaving(false);
    }
  };

    if (!cashUpSubmission) return null;

  const isDiscrepancy = cashUpSubmission.status === "Short" || cashUpSubmission.status === "Over";
  const isHighRisk = cashUpSubmission.riskLevel === "high";
  const isLateSubmission = cashUpSubmission.submissionStatus.includes("Late");

  return (
    <Drawer
      title="Review Cash Up Submission"
      placement="bottom"
      height="90%"
      open={open}
      onClose={onClose}
      footer={
        <Space>
          <Button onClick={onClose}>
            Close
          </Button>
          <Button
            onClick={handleAddNotes}
            loading={saving}
          >
            Add Notes
          </Button>
          {isDiscrepancy && !cashUpSubmission.isResolved && (
            <Button
              type="primary"
              onClick={handleResolve}
              loading={saving}
            >
              Mark as Resolved
            </Button>
          )}
        </Space>
      }
    >
      <div className="space-y-6">
        {/* Risk Level Alert */}
        {isHighRisk && (
          <Alert
            message="High Risk Discrepancy"
            description="This audit has a high-risk discrepancy that requires immediate attention."
            type="error"
            showIcon
          />
        )}

        {/* Late Submission Alert */}
        {isLateSubmission && (
          <Alert
            message="Late Submission"
            description="This submission was made after the daily cutoff time."
            type="warning"
            showIcon
          />
        )}

        {/* Cash Up Submission Information */}
        <div className="space-y-4">
          <Title level={4}>Cash Up Submission Information</Title>

          <Descriptions bordered column={2}>
            <Descriptions.Item label="Employee">
              <div className="flex items-center gap-2">
                <UserOutlined />
                {cashUpSubmission.employeeName}
              </div>
            </Descriptions.Item>
            <Descriptions.Item label="Date">
              {dayjs(cashUpSubmission.date).format("DD MMM YYYY")}
            </Descriptions.Item>
            <Descriptions.Item label="Status">
              <Tag color={getStatusColor(cashUpSubmission.status)}>
                {cashUpSubmission.status}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Risk Level">
              <Tag color={getRiskLevelColor(cashUpSubmission.riskLevel)}>
                {cashUpSubmission.riskLevel.toUpperCase()}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Submission Status">
              <Tag color={getSubmissionStatusColor(cashUpSubmission.submissionStatus)}>
                {cashUpSubmission.submissionStatus}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Submission Time">
              <div className="flex items-center gap-2">
                <ClockCircleOutlined />
                {dayjs(cashUpSubmission.submittedAt).format("HH:mm")}
              </div>
            </Descriptions.Item>
          </Descriptions>
        </div>

        {/* Financial Details */}
        <div className="space-y-4">
          <Title level={4}>Financial Details</Title>

          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <Text className="text-gray-500">Receipt Total</Text>
              <div className="text-xl font-semibold">
                {cashUpSubmission.batchReceiptTotal ? formatCurrency(cashUpSubmission.batchReceiptTotal) : "--"}
              </div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <Text className="text-gray-500">System Balance</Text>
              <div className="text-xl font-semibold">
                {cashUpSubmission.systemBalance ? formatCurrency(cashUpSubmission.systemBalance) : "--"}
              </div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <Text className="text-gray-500">Discrepancy</Text>
              <div className={`text-xl font-semibold ${cashUpSubmission.discrepancy === 0 ? "text-green-600" :
                  cashUpSubmission.discrepancy > 0 ? "text-orange-600" : "text-red-600"
                }`}>
                {cashUpSubmission.discrepancy ? `${cashUpSubmission.discrepancy > 0 ? "+" : ""}${formatCurrency(cashUpSubmission.discrepancy)}` : "--"}
              </div>
            </div>
          </div>
        </div>

        {/* Receipt Attachments */}
        {cashUpSubmission.attachments && cashUpSubmission.attachments.length > 0 && (
          <div className="space-y-4">
            <Title level={4}>Receipt Attachments</Title>

            <div className="grid grid-cols-2 gap-4">
              {cashUpSubmission.attachments.map((attachment, index) => (
                <div key={index} className="border rounded-lg p-2">
                  <Image
                    src={attachment}
                    alt={`Receipt ${index + 1}`}
                    className="w-full h-32 object-cover rounded"
                    fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMIAAADDCAYAAADQvc6UAAABRWlDQ1BJQ0MgUHJvZmlsZQAAKJFjYGASSSwoyGFhYGDIzSspCnJ3UoiIjFJgf8LAwSDCIMogwMCcmFxc4BgQ4ANUwgCjUcG3awyMIPqyLsis7PPOq3QdDFcvjV3jOD1boQVTPQrgSkktTgbSf4A4LbmgqISBgTEFyFYuLykAsTuAbJEioKOA7DkgdjqEvQHEToKwj4DVhAQ5A9k3gGyB5IxEoBmML4BsnSQk8XQkNtReEOBxcfXxUQg1Mjc0dyHgXNJBSWpFCYh2zi+oLMpMzyhRcASGUqqCZ16yno6CkYGRAQMDKMwhqj/fAIcloxgHQqxAjIHBEugw5sUIsSQpBobtQPdLciLEVJYzMPBHMDBsayhILEqEO4DxG0txmrERhM29nYGBddr//5/DGRjYNRkY/l7////39v///y4Dmn+LgeHANwDrkl1AuO+pmgAAADhlWElmTU0AKgAAAAgAAYdpAAQAAAABAAAAGgAAAAAAAqACAAQAAAABAAAAwqADAAQAAAABAAAAwwAAAAD9b/HnAAAHlklEQVR4Ae3dP3Ik1RnG4W+FgYxN"
                  />
                  <div className="text-center mt-2">
                    <Text className="text-xs text-gray-500">Receipt {index + 1}</Text>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Resolution Status */}
        {cashUpSubmission.isResolved && (
          <div className="space-y-4">
            <Title level={4}>Resolution Details</Title>

            <Alert
              message="Cash Up Submission Resolved"
              description={`Resolved by ${cashUpSubmission.reviewedBy} on ${dayjs(cashUpSubmission.reviewedAt).format("DD MMM YYYY HH:mm")}`}
              type="success"
              showIcon
            />

            {cashUpSubmission.resolutionNotes && (
              <div className="border rounded-lg p-4 bg-gray-50">
                <Text className="font-medium">Resolution Notes:</Text>
                <div className="mt-2">{cashUpSubmission.resolutionNotes}</div>
              </div>
            )}
          </div>
        )}

        {/* Review Notes */}
        {cashUpSubmission.notes && (
          <div className="space-y-4">
            <Title level={4}>Review Notes</Title>

            <div className="border rounded-lg p-4 bg-blue-50">
              <div className="whitespace-pre-wrap">{cashUpSubmission.notes}</div>
            </div>
          </div>
        )}

        <Divider />

        {/* Add Notes Form */}
        <div className="space-y-4">
          <Title level={4}>Add Review Notes</Title>

          <Form form={form} layout="vertical">
            <Form.Item
              name="notes"
              label="Notes"
              rules={[{ required: true, message: "Please enter notes" }]}
            >
              <TextArea
                rows={4}
                placeholder="Add your review notes here..."
              />
            </Form.Item>

            {isDiscrepancy && !cashUpSubmission.isResolved && (
              <Form.Item
                name="resolutionNotes"
                label="Resolution Notes"
              >
                <TextArea
                  rows={3}
                  placeholder="Describe how the discrepancy was resolved..."
                />
              </Form.Item>
            )}
          </Form>
        </div>
      </div>
    </Drawer>
  );
};

export default CashUpSubmissionReviewDrawer; 