/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useMemo, useState } from "react";

import { Button, Card, Space, Spin, Table, Tag, Typography, message } from "antd";
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

  const reviewQueue = useMemo(() => {
    const n = (s?: string) => (s || "").toLowerCase();
    return rows.filter((r) => ["pending", "resolved"].includes(n(r.status)));
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
        <div className="mb-4 flex items-center justify-between">
          <Title level={4} style={{ margin: 0 }}>Queue</Title>
          <Text className="text-gray-500">{reviewQueue.length} pending</Text>
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <Spin size="large" />
          </div>
        ) : (
          <Table
            dataSource={reviewQueue}
            columns={columns}
            rowKey="_id"
            pagination={{ pageSize: 10, showSizeChanger: true }}
            locale={{ emptyText: "No cashup submissions awaiting review." }}
          />
        )}
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