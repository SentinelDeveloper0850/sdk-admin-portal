/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useMemo, useState } from "react";

import { Button, Card, Space, Spin, Table, Tag, Tabs, Typography, message } from "antd";
import dayjs from "dayjs";

import CashUpSubmissionReviewDrawer from "@/app/components/cash-up/cash-up-submission-review-drawer";
import PageHeader from "@/app/components/page-header";
import { withRoleGuard } from "@/utils/utils/with-role-guard";
import { ERoles } from "@/types/roles.enum";

const { Title, Text } = Typography;

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

  useEffect(() => {
    fetchAll();
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

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title="Cashup Review"
        subtitle="Review, approve, reject, or send back submissions"
        actions={[
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

      <CashUpSubmissionReviewDrawer
        open={drawerOpen}
        onClose={() => {
          setDrawerOpen(false);
          setSelected(null);
        }}
        cashUpSubmission={selected as any}
        onUpdated={fetchAll}
      />
    </div>
  );
};

export default withRoleGuard(CashUpReviewPage, [ERoles.Admin, ERoles.CashupReviewer]);