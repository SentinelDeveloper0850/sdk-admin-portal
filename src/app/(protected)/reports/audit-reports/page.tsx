"use client";

import { useEffect, useMemo, useState } from "react";

import {
  Button,
  Card,
  DatePicker,
  Drawer,
  Form,
  Select,
  Space,
  Spin,
  Table,
  Typography,
  Upload,
  message,
} from "antd";
import dayjs from "dayjs";

import { withRoleGuard } from "@/utils/utils/with-role-guard";

import PageHeader from "@/app/components/page-header";
import { ERoles } from "@/types/roles.enum";

const { Title, Text } = Typography;
const { Option } = Select;

type UserOption = { _id: string; name: string; email?: string };
type AuditReportRow = {
  _id: string;
  userId: string;
  userName: string;
  dateKey: string;
  incomeTotal: number;
  expenseTotal: number;
  netTotal: number;
  fileUrl: string;
  fileName: string;
  uploadedAt?: string;
  uploadedByName?: string | null;
};

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: "ZAR",
  }).format(amount ?? 0);
}

function AuditReportsPage() {
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState<AuditReportRow[]>([]);
  const [users, setUsers] = useState<UserOption[]>([]);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [form] = Form.useForm();

  const fetchReports = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/cash-up/audit-reports?limit=100", {
        cache: "no-store",
      });
      const json = await res.json();
      if (!json?.success)
        throw new Error(json?.message || "Failed to fetch reports");
      setReports(json.reports || []);
    } catch (e: any) {
      message.error(e?.message || "Failed to load audit reports");
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/users?slim=true", { cache: "no-store" });
      const json = await res.json();
      // users endpoint returns array
      const list = Array.isArray(json) ? json : [];
      setUsers(
        list.map((u: any) => ({
          _id: String(u._id),
          name: String(u.name || ""),
          email: u.email,
        }))
      );
    } catch {
      // non-fatal
    }
  };

  useEffect(() => {
    fetchReports();
    fetchUsers();
  }, []);

  const userOptions = useMemo(
    () => users.sort((a, b) => a.name.localeCompare(b.name)),
    [users]
  );

  const handleUpload = async () => {
    try {
      const values = await form.validateFields();
      if (!file) {
        message.error("Please choose an Excel file");
        return;
      }

      setUploading(true);
      const fd = new FormData();
      fd.append("file", file);
      fd.append("userId", String(values.userId));
      fd.append("dateKey", dayjs(values.date).format("YYYY-MM-DD"));

      const res = await fetch("/api/cash-up/audit-report", {
        method: "POST",
        body: fd,
      });
      const json = await res.json();
      if (!json?.success) {
        if (json?.expected && json?.detected) {
          message.error(
            `${json.message} (Expected: ${json.expected.employeeName} / ${json.expected.date}, Detected: ${json.detected.employeeName} / ${json.detected.date})`
          );
        } else {
          message.error(json?.message || "Upload failed");
        }
        return;
      }

      message.success(json.message || "Audit report uploaded");
      setDrawerOpen(false);
      setFile(null);
      form.resetFields();
      await fetchReports();
    } catch {
      message.error("Please fix the form errors");
    } finally {
      setUploading(false);
    }
  };

  const columns = [
    {
      title: "Date",
      dataIndex: "dateKey",
      key: "dateKey",
      render: (v: string) => dayjs(v).format("DD MMM YYYY"),
    },
    {
      title: "Employee",
      dataIndex: "userName",
      key: "userName",
    },
    {
      title: "Income",
      dataIndex: "incomeTotal",
      key: "incomeTotal",
      align: "right" as const,
      render: (v: number) => formatCurrency(Number(v || 0)),
    },
    {
      title: "Expense",
      dataIndex: "expenseTotal",
      key: "expenseTotal",
      align: "right" as const,
      render: (v: number) => formatCurrency(Number(v || 0)),
    },
    {
      title: "Net",
      dataIndex: "netTotal",
      key: "netTotal",
      align: "right" as const,
      render: (v: number) => formatCurrency(Number(v || 0)),
    },
    {
      title: "File",
      dataIndex: "fileUrl",
      key: "fileUrl",
      render: (_: any, r: AuditReportRow) =>
        r.fileUrl ? (
          <a href={r.fileUrl} target="_blank" rel="noreferrer">
            {r.fileName || "Open"}
          </a>
        ) : (
          "—"
        ),
    },
    {
      title: "Uploaded",
      dataIndex: "uploadedAt",
      key: "uploadedAt",
      render: (v: string) => (v ? dayjs(v).format("DD MMM HH:mm") : "—"),
    },
    {
      title: "By",
      dataIndex: "uploadedByName",
      key: "uploadedByName",
      render: (v: string) => v || "—",
    },
  ];

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title="Audit Reports"
        subtitle="Upload and view cashier income/expense reports used for Cashup auditing"
        actions={[
          <Space key="actions">
            <Button onClick={() => setDrawerOpen(true)} type="primary">
              Upload Audit Report
            </Button>
            <Button onClick={fetchReports}>Refresh</Button>
          </Space>,
        ]}
      />

      <Card size="small">
        {loading ? (
          <div className="flex justify-center py-10">
            <Spin />
          </div>
        ) : (
          <Table
            dataSource={reports}
            columns={columns}
            rowKey="_id"
            pagination={{ pageSize: 20, showSizeChanger: true }}
            locale={{ emptyText: "No audit reports uploaded yet." }}
          />
        )}
      </Card>

      <Drawer
        title="Upload Audit Report"
        placement="right"
        width="520px"
        open={drawerOpen}
        onClose={() => {
          setDrawerOpen(false);
          setFile(null);
          form.resetFields();
        }}
        footer={
          <Space>
            <Button onClick={() => setDrawerOpen(false)}>Cancel</Button>
            <Button type="primary" onClick={handleUpload} loading={uploading}>
              Upload
            </Button>
          </Space>
        }
      >
        <div className="space-y-4">
          <AlertBox />
          <Form form={form} layout="vertical" initialValues={{ date: dayjs() }}>
            <Form.Item
              name="userId"
              label="Employee"
              rules={[{ required: true, message: "Select an employee" }]}
            >
              <Select
                showSearch
                optionFilterProp="children"
                placeholder="Select employee"
              >
                {userOptions.map((u) => (
                  <Option key={u._id} value={u._id}>
                    {u.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item
              name="date"
              label="Report Date"
              rules={[{ required: true, message: "Select a date" }]}
            >
              <DatePicker style={{ width: "100%" }} />
            </Form.Item>

            <Form.Item label="Excel file">
              <Upload.Dragger
                multiple={false}
                accept=".xlsx,.xls,.csv"
                beforeUpload={(f) => {
                  setFile(f as any);
                  return false;
                }}
                fileList={file ? ([{ uid: "1", name: file.name }] as any) : []}
              >
                <p className="ant-upload-text">
                  Click or drag the Excel report here
                </p>
                <p className="ant-upload-hint">Supported: .xlsx, .xls, .csv</p>
              </Upload.Dragger>
              <Text type="secondary" className="mt-2 block">
                The employee name and report date must match the spreadsheet
                header, otherwise upload will be rejected.
              </Text>
            </Form.Item>
          </Form>
        </div>
      </Drawer>
    </div>
  );
}

function AlertBox() {
  return (
    <Card size="small">
      <Title level={5} style={{ marginTop: 0 }}>
        Notes
      </Title>
      <ul className="list-disc space-y-1 pl-5">
        <li>
          This expects the exported “Income & Expense Transaction Report” Excel
          format (TransactionType + Amount columns).
        </li>
        <li>
          We ignore the Balance column; we compare{" "}
          <strong>Income − Expense</strong> to the cashup totals.
        </li>
      </ul>
    </Card>
  );
}

export default withRoleGuard(AuditReportsPage, [ERoles.CashupReviewer]);
