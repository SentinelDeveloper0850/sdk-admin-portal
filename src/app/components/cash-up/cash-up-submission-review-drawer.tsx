"use client";

import React, { useState } from "react";

import { ClockCircleOutlined, UserOutlined } from "@ant-design/icons";
import {
  Alert,
  Button,
  Descriptions,
  Divider,
  Drawer,
  Form,
  Image,
  Input,
  Select,
  Space,
  Tag,
  Typography,
  Upload,
} from "antd";
import dayjs from "dayjs";
import swal from "sweetalert";

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
  status: string;
  submittedAt: string;
  reviewedBy?: string;
  reviewedAt?: string;
  isLateSubmission?: boolean;
  notes?: string | null;
  attachments: string[];
}

interface Props {
  open: boolean;
  onClose: () => void;
  cashUpSubmission: CashUpSubmission | null;
  onUpdated: () => void;
}

const CashUpSubmissionReviewDrawer: React.FC<Props> = ({
  open,
  onClose,
  cashUpSubmission,
  onUpdated,
}) => {
  const { user } = useAuth();
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);
  const [auditUploading, setAuditUploading] = useState(false);
  const [auditResult, setAuditResult] = useState<any>(null);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-ZA", {
      style: "currency",
      currency: "ZAR",
    }).format(amount);
  };

  const handleAddNotes = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);

      const payload = {
        notes: values.notes,
      };

      const res = await fetch(`/api/cash-up/${cashUpSubmission?._id}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (json.success) {
        swal({
          title: "Success",
          text:
            json.message || "Notes added successfully to cash up submission",
          icon: "success",
        });
        onUpdated();
        form.resetFields();
      } else {
        swal({
          title: "Error",
          text: json.message || "Failed to add notes to cash up submission",
          icon: "error",
        });
      }
    } catch (error) {
      swal({
        title: "Error",
        text: "Please correct the errors in the form to add notes to cash up submission",
        icon: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleUploadAuditReport = async (file: File) => {
    try {
      setAuditUploading(true);
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch(
        `/api/cash-up/${cashUpSubmission?._id}/audit-report`,
        {
          method: "POST",
          body: fd,
        }
      );
      const json = await res.json();
      if (json.success) {
        setAuditResult(json.audit);
        swal({
          title: "Success",
          text: json.message || "Audit report uploaded",
          icon: "success",
        });
        onUpdated();
      } else {
        if (json?.expected && json?.detected) {
          swal({
            title: "Error",
            text: `${json.message} (Expected: ${json.expected.employeeName} / ${json.expected.date}, Detected: ${json.detected.employeeName} / ${json.detected.date})`,
            icon: "error",
          });
        } else {
          swal({
            title: "Error",
            text: json.message || "Failed to upload audit report",
            icon: "error",
          });
        }
      }
    } catch (e: any) {
      swal({
        title: "Error",
        text: e?.message || "Failed to upload audit report",
        icon: "error",
      });
    } finally {
      setAuditUploading(false);
    }
    return false;
  };

  const handleDecision = async (
    decision: "approve" | "reject" | "send_back"
  ) => {
    try {
      const values = await form.validateFields();
      setSaving(true);

      const payload = {
        decision,
        note: values.notes,
      };

      const res = await fetch(`/api/cash-up/${cashUpSubmission?._id}/review`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();

      if (json.success) {
        swal({
          title: "Success",
          text: json.message || "Updated",
          icon: "success",
        });
        onUpdated();
        onClose();
      } else {
        swal({
          title: "Error",
          text: json.message || "Failed to update",
          icon: "error",
        });
      }
    } catch {
      swal({
        title: "Error",
        text: "Please add a review note first",
        icon: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  if (!cashUpSubmission) return null;

  const isLateSubmission = !!cashUpSubmission.isLateSubmission;
  const isPdfUrl = (url: string) =>
    url.toLowerCase().split("?")[0].endsWith(".pdf");

  return (
    <Drawer
      title="Review Cash Up Submission"
      placement="bottom"
      height="90%"
      open={open}
      onClose={onClose}
      footer={
        <Space>
          <Button onClick={onClose}>Close</Button>
          <Button onClick={handleAddNotes} loading={saving}>
            Add Notes
          </Button>
          <Button
            type="primary"
            onClick={() => handleDecision("approve")}
            loading={saving}
          >
            Approve
          </Button>
          <Button
            danger
            onClick={() => handleDecision("reject")}
            loading={saving}
          >
            Reject
          </Button>
          <Button onClick={() => handleDecision("send_back")} loading={saving}>
            Send Back
          </Button>
        </Space>
      }
    >
      <div className="space-y-6">
        {/* Audit report upload (Excel) */}
        <div className="space-y-2">
          <Title level={4}>Audit Report (Excel)</Title>
          <Text type="secondary">
            Upload the Income & Expense Transaction Report (Excel). The system
            will parse totals and compare them to the cashup.
          </Text>
          <Upload.Dragger
            name="file"
            multiple={false}
            accept=".xlsx,.xls,.csv"
            beforeUpload={(file) => handleUploadAuditReport(file as any)}
            showUploadList={false}
            disabled={auditUploading || saving}
          >
            <p className="ant-upload-text">
              Click or drag the Excel report here to upload
            </p>
            <p className="ant-upload-hint">Supported: .xlsx, .xls, .csv</p>
          </Upload.Dragger>

          {auditResult && (
            <Alert
              type={auditResult.balanced ? "success" : "error"}
              showIcon
              message={auditResult.balanced ? "Balances" : "Does not balance"}
              description={
                <div className="space-y-1">
                  <div>
                    Income: {formatCurrency(auditResult.incomeTotal || 0)}
                  </div>
                  <div>
                    Expense: {formatCurrency(auditResult.expenseTotal || 0)}
                  </div>
                  <div>Net: {formatCurrency(auditResult.netTotal || 0)}</div>
                  <div>
                    Cashup total: {formatCurrency(auditResult.cashupTotal || 0)}
                  </div>
                  <div>Delta: {formatCurrency(auditResult.delta || 0)}</div>
                </div>
              }
            />
          )}
        </div>

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
              <Tag>{cashUpSubmission.status}</Tag>
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

          <div className="grid grid-cols-1 gap-4">
            <div className="rounded-lg border p-4 text-center">
              <Text className="text-gray-500">Submitted Total</Text>
              <div className="text-xl font-semibold">
                {cashUpSubmission.batchReceiptTotal !== undefined
                  ? formatCurrency(cashUpSubmission.batchReceiptTotal)
                  : "--"}
              </div>
            </div>
          </div>
        </div>

        {/* Receipt Attachments */}
        {cashUpSubmission.attachments &&
          cashUpSubmission.attachments.length > 0 && (
            <div className="space-y-4">
              <Title level={4}>Receipt Attachments</Title>

              <div className="grid grid-cols-2 gap-4">
                {cashUpSubmission.attachments.map((attachment, index) => (
                  <div key={index} className="rounded-lg border p-2">
                    {isPdfUrl(attachment) ? (
                      <div className="flex h-32 items-center justify-center rounded border bg-gray-50">
                        <a
                          href={attachment}
                          target="_blank"
                          rel="noreferrer"
                          className="text-blue-600 underline"
                        >
                          Open PDF (Receipt {index + 1})
                        </a>
                      </div>
                    ) : (
                      <Image
                        src={attachment}
                        alt={`Receipt ${index + 1}`}
                        className="h-32 w-full rounded object-cover"
                        fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMIAAADDCAYAAADQvc6UAAABRWlDQ1BJQ0MgUHJvZmlsZQAAKJFjYGASSSwoyGFhYGDIzSspCnJ3UoiIjFJgf8LAwSDCIMogwMCcmFxc4BgQ4ANUwgCjUcG3awyMIPqyLsis7PPOq3QdDFcvjV3jOD1boQVTPQrgSkktTgbSf4A4LbmgqISBgTEFyFYuLykAsTuAbJEioKOA7DkgdjqEvQHEToKwj4DVhAQ5A9k3gGyB5IxEoBmML4BsnSQk8XQkNtReEOBxcfXxUQg1Mjc0dyHgXNJBSWpFCYh2zi+oLMpMzyhRcASGUqqCZ16yno6CkYGRAQMDKMwhqj/fAIcloxgHQqxAjIHBEugw5sUIsSQpBobtQPdLciLEVJYzMPBHMDBsayhILEqEO4DxG0txmrERhM29nYGBddr//5/DGRjYNRkY/l7////39v///y4Dmn+LgeHANwDrkl1AuO+pmgAAADhlWElmTU0AKgAAAAgAAYdpAAQAAAABAAAAGgAAAAAAAqACAAQAAAABAAAAwqADAAQAAAABAAAAwwAAAAD9b/HnAAAHlklEQVR4Ae3dP3Ik1RnG4W+FgYxN"
                      />
                    )}
                    <div className="mt-2 text-center">
                      <Text className="text-xs text-gray-500">
                        Receipt {index + 1}
                      </Text>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        {/* Resolution Status */}
        {/* Review Notes */}
        {cashUpSubmission.notes && (
          <div className="space-y-4">
            <Title level={4}>Review Notes</Title>

            <div className="rounded-lg border bg-blue-50 p-4">
              <div className="whitespace-pre-wrap">
                {cashUpSubmission.notes}
              </div>
            </div>
          </div>
        )}

        <Divider />

        {/* Add Notes Form */}
        <div className="space-y-4">
          <Title level={4}>Add Review Note</Title>

          <Form form={form} layout="vertical">
            <Form.Item
              name="notes"
              label="Notes"
              rules={[{ required: true, message: "Please enter notes" }]}
            >
              <TextArea rows={4} placeholder="Add your review note here..." />
            </Form.Item>
          </Form>
        </div>
      </div>
    </Drawer>
  );
};

export default CashUpSubmissionReviewDrawer;
