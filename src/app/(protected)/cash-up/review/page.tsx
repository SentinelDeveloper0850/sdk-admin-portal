/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useMemo, useState } from "react";

import { Button, Card, DatePicker, Drawer, Form, Select, Space, Table, Tag, Tabs, Typography, Upload, message } from "antd";
import dayjs from "dayjs";

import CashUpSubmissionReviewDrawer from "@/app/components/cash-up/cash-up-submission-review-drawer";
import PageHeader from "@/app/components/page-header";
import { withRoleGuard } from "@/utils/utils/with-role-guard";
import { ERoles } from "@/types/roles.enum";

const { Title, Text } = Typography;
const { Option } = Select;

interface ICashUpSubmissionRow {
  _id: string;
  date: string;
  employeeId: string;
  employeeName: string;
  batchReceiptTotal: number;
  status: string;
  isLateSubmission?: boolean;
  submittedAt?: string;
  notes?: string | null;
  attachments: string[];
}

interface IUserOption {
  _id: string;
  name: string;
}

interface IAuditReportRow {
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
}

const statusColor = (status: string) => {
  switch ((status || "").toLowerCase()) {
    case "pending":
      return "blue";
    case "resolved":
      return "blue";
    case "needs_changes":
      return "orange";
    case "approved":
      return "green";
    case "rejected":
      return "red";
    case "draft":
      return "default";
    default:
      return "default";
  }
};

const CashUpReviewPage = () => {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<ICashUpSubmissionRow[]>([]);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selected, setSelected] = useState<ICashUpSubmissionRow | null>(null);

  const [auditDrawerOpen, setAuditDrawerOpen] = useState(false);
  const [auditUploading, setAuditUploading] = useState(false);
  const [auditFile, setAuditFile] = useState<File | null>(null);
  const [auditForm] = Form.useForm();
  const [users, setUsers] = useState<IUserOption[]>([]);
  const [auditReportsLoading, setAuditReportsLoading] = useState(false);
  const [auditReports, setAuditReports] = useState<IAuditReportRow[]>([]);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/cash-up", { cache: "no-store" });
      const json = await res.json();
      if (!json?.success) throw new Error(json?.message || "Failed to fetch");
      setRows(json.cashUpSubmissions || []);
    } catch (e: any) {
      message.error(e?.message || "Failed to load cashup submissions");
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/users?slim=true", { cache: "no-store" });
      const json = await res.json();
      const list = Array.isArray(json) ? json : [];
      setUsers(list.map((u: any) => ({ _id: String(u._id), name: String(u.name || "") })));
    } catch {
      // non-fatal
    }
  };

  const fetchAuditReports = async () => {
    setAuditReportsLoading(true);
    try {
      const res = await fetch("/api/cash-up/audit-reports?limit=30", { cache: "no-store" });
      const json = await res.json();
      if (!json?.success) throw new Error(json?.message || "Failed to fetch audit reports");
      setAuditReports(json.reports || []);
    } catch (e: any) {
      message.error(e?.message || "Failed to load audit reports");
    } finally {
      setAuditReportsLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
    fetchUsers();
    fetchAuditReports();
  }, []);

  const byStatus = useMemo(() => {
    const n = (s?: string) => (s || "").toLowerCase();
    const all = rows;
    const pending = rows.filter((r) => n(r.status) === "pending");
    const resolved = rows.filter((r) => n(r.status) === "resolved");
    const needsChanges = rows.filter((r) => n(r.status) === "needs_changes");
    const approved = rows.filter((r) => n(r.status) === "approved");
    const rejected = rows.filter((r) => n(r.status) === "rejected");
    const draft = rows.filter((r) => n(r.status) === "draft");
    return { all, pending, resolved, needsChanges, approved, rejected, draft };
  }, [rows]);

  const columns = [
    {
      title: "Employee",
      dataIndex: "employeeName",
      key: "employeeName",
      render: (text: string, record: ICashUpSubmissionRow) => (
        <div>
          <div className="font-medium">{text}</div>
          <div className="text-xs text-gray-500">{dayjs(record.date).format("DD MMM YYYY")}</div>
        </div>
      ),
    },
    {
      title: "Total",
      dataIndex: "batchReceiptTotal",
      key: "batchReceiptTotal",
      align: "right" as const,
      render: (amount: number) => new Intl.NumberFormat("en-ZA", { style: "currency", currency: "ZAR" }).format(amount ?? 0),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      align: "center" as const,
      render: (status: string) => <Tag className="uppercase" color={statusColor(status)}>{status}</Tag>,
    },
    {
      title: "Late",
      dataIndex: "isLateSubmission",
      key: "isLateSubmission",
      align: "center" as const,
      render: (isLate: boolean) => (isLate ? <Tag color="red">LATE</Tag> : <Tag color="green">ON TIME</Tag>),
    },
    {
      title: "Actions",
      key: "actions",
      align: "center" as const,
      render: (_: any, record: ICashUpSubmissionRow) => (
        <Space>
          <Button
            type="primary"
            onClick={() => {
              setSelected(record);
              setDrawerOpen(true);
            }}
          >
            Review
          </Button>
        </Space>
      ),
    },
  ];

  const reportColumns = [
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
      render: (v: number) => new Intl.NumberFormat("en-ZA", { style: "currency", currency: "ZAR" }).format(v ?? 0),
    },
    {
      title: "Expense",
      dataIndex: "expenseTotal",
      key: "expenseTotal",
      align: "right" as const,
      render: (v: number) => new Intl.NumberFormat("en-ZA", { style: "currency", currency: "ZAR" }).format(v ?? 0),
    },
    {
      title: "Net",
      dataIndex: "netTotal",
      key: "netTotal",
      align: "right" as const,
      render: (v: number) => new Intl.NumberFormat("en-ZA", { style: "currency", currency: "ZAR" }).format(v ?? 0),
    },
    {
      title: "File",
      dataIndex: "fileUrl",
      key: "fileUrl",
      render: (_: any, r: IAuditReportRow) =>
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
  ];

  const uploadAuditReport = async () => {
    try {
      const values = await auditForm.validateFields();
      if (!auditFile) {
        message.error("Please choose an Excel file");
        return;
      }
      setAuditUploading(true);
      const fd = new FormData();
      fd.append("file", auditFile);
      fd.append("userId", String(values.userId));
      fd.append("dateKey", dayjs(values.date).format("YYYY-MM-DD"));

      const res = await fetch("/api/cash-up/audit-report", { method: "POST", body: fd });
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
      setAuditDrawerOpen(false);
      setAuditFile(null);
      auditForm.resetFields();
      fetchAuditReports();
    } catch {
      message.error("Please fix the form errors");
    } finally {
      setAuditUploading(false);
    }
  };

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title="Cashup Review"
        subtitle="Review, approve, reject, or send back submissions"
        actions={[
          <Button key="upload-audit" type="primary" onClick={() => setAuditDrawerOpen(true)}>
            Upload Audit Report
          </Button>,
          <Button key="refresh" onClick={fetchAll}>
            Refresh
          </Button>,
        ]}
      />

      <Card size="small">
        <Tabs
          defaultActiveKey="pending"
          items={[
            {
              key: "pending",
              label: `Pending (${byStatus.pending.length})`,
              children: (
                <Table
                  loading={loading}
                  dataSource={byStatus.pending}
                  columns={columns}
                  rowKey="_id"
                  pagination={{ pageSize: 10, showSizeChanger: true }}
                  locale={{ emptyText: "No pending submissions." }}
                />
              ),
            },
            {
              key: "resolved",
              label: `Resolved (${byStatus.resolved.length})`,
              children: (
                <Table
                  loading={loading}
                  dataSource={byStatus.resolved}
                  columns={columns}
                  rowKey="_id"
                  pagination={{ pageSize: 10, showSizeChanger: true }}
                  locale={{ emptyText: "No resolved submissions." }}
                />
              ),
            },
            {
              key: "needs_changes",
              label: `Needs Changes (${byStatus.needsChanges.length})`,
              children: (
                <Table
                  loading={loading}
                  dataSource={byStatus.needsChanges}
                  columns={columns}
                  rowKey="_id"
                  pagination={{ pageSize: 10, showSizeChanger: true }}
                  locale={{ emptyText: "No submissions needing changes." }}
                />
              ),
            },
            {
              key: "approved",
              label: `Approved (${byStatus.approved.length})`,
              children: (
                <Table
                  loading={loading}
                  dataSource={byStatus.approved}
                  columns={columns}
                  rowKey="_id"
                  pagination={{ pageSize: 10, showSizeChanger: true }}
                  locale={{ emptyText: "No approved submissions." }}
                />
              ),
            },
            {
              key: "rejected",
              label: `Rejected (${byStatus.rejected.length})`,
              children: (
                <Table
                  loading={loading}
                  dataSource={byStatus.rejected}
                  columns={columns}
                  rowKey="_id"
                  pagination={{ pageSize: 10, showSizeChanger: true }}
                  locale={{ emptyText: "No rejected submissions." }}
                />
              ),
            },
            {
              key: "draft",
              label: `Draft (${byStatus.draft.length})`,
              children: (
                <Table
                  loading={loading}
                  dataSource={byStatus.draft}
                  columns={columns}
                  rowKey="_id"
                  pagination={{ pageSize: 10, showSizeChanger: true }}
                  locale={{ emptyText: "No draft submissions." }}
                />
              ),
            },
            {
              key: "all",
              label: `All (${byStatus.all.length})`,
              children: (
                <Table
                  loading={loading}
                  dataSource={byStatus.all}
                  columns={columns}
                  rowKey="_id"
                  pagination={{ pageSize: 10, showSizeChanger: true }}
                  locale={{ emptyText: "No submissions." }}
                />
              ),
            },
          ]}
        />
      </Card>

      <Card size="small">
        <div className="mb-4 flex items-center justify-between">
          <Title level={4} style={{ margin: 0 }}>Audit Reports (latest)</Title>
          <Space>
            <Button onClick={fetchAuditReports} loading={auditReportsLoading}>Refresh</Button>
            <Button href="/reports/audit-reports">Open Audit Reports Page</Button>
          </Space>
        </div>
        <Table
          loading={auditReportsLoading}
          dataSource={auditReports}
          columns={reportColumns as any}
          rowKey="_id"
          pagination={{ pageSize: 10, showSizeChanger: true }}
          locale={{ emptyText: "No audit reports uploaded yet." }}
        />
      </Card>

      <CashUpSubmissionReviewDrawer
        open={drawerOpen}
        onClose={() => {
          setDrawerOpen(false);
          setSelected(null);
        }}
        cashUpSubmission={selected as any}
        onUpdated={fetchAll}
      />

      <Drawer
        title="Upload Audit Report"
        placement="right"
        width="520px"
        open={auditDrawerOpen}
        onClose={() => {
          setAuditDrawerOpen(false);
          setAuditFile(null);
          auditForm.resetFields();
        }}
        footer={
          <Space>
            <Button onClick={() => setAuditDrawerOpen(false)}>Cancel</Button>
            <Button type="primary" onClick={uploadAuditReport} loading={auditUploading}>
              Upload
            </Button>
          </Space>
        }
      >
        <div className="space-y-4">
          <Text type="secondary">
            Select the employee and the report date, then upload the Excel. The upload will be rejected if the spreadsheet's header employee/date doesn't match.
          </Text>
          <Form form={auditForm} layout="vertical" initialValues={{ date: dayjs() }}>
            <Form.Item name="userId" label="Employee" rules={[{ required: true, message: "Select an employee" }]}>
              <Select showSearch optionFilterProp="children" placeholder="Select employee">
                {users.map((u) => (
                  <Option key={u._id} value={u._id}>
                    {u.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item name="date" label="Report Date" rules={[{ required: true, message: "Select a date" }]}>
              <DatePicker style={{ width: "100%" }} />
            </Form.Item>
            <Form.Item label="Excel file">
              <Upload.Dragger
                multiple={false}
                accept=".xlsx,.xls,.csv"
                beforeUpload={(f) => {
                  setAuditFile(f as any);
                  return false;
                }}
                fileList={auditFile ? ([{ uid: "1", name: auditFile.name }] as any) : []}
              >
                <p className="ant-upload-text">Click or drag the Excel report here</p>
                <p className="ant-upload-hint">Supported: .xlsx, .xls, .csv</p>
              </Upload.Dragger>
            </Form.Item>
          </Form>
        </div>
      </Drawer>
    </div>
  );
};

export default withRoleGuard(CashUpReviewPage, [ERoles.CashupReviewer]);