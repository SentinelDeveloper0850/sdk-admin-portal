"use client";

import { useEffect, useState } from "react";

import { ExclamationCircleOutlined, ReloadOutlined } from "@ant-design/icons";
import { Alert, Button, Space, Spin, Table, Tag } from "antd";

import PageHeader from "@/app/components/page-header";
import { useRole } from "@/app/hooks/use-role";


interface AllocationRequestItem {
  _id: string;
  transactionId: string;
  policyNumber: string;
  notes: string[];
  evidence: string[];
  status: string;
  requestedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export default function AllocationRequestsPage() {
  const { hasRole } = useRole();

  const allowed = hasRole([
    "admin",
    "eft_reviewer",
    "eft_allocator",
  ]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [items, setItems] = useState<AllocationRequestItem[]>([]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/transactions/eft/allocation-requests");
      if (!res.ok) {
        const data = await res.json();
        setError(data.message || "Failed to load allocation requests");
        return;
      }
      const data = await res.json();
      setItems(data.items || []);
    } catch (e) {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (!allowed) {
    return (
      <div className="p-5">
        <Alert
          type="error"
          showIcon
          icon={<ExclamationCircleOutlined />}
          message="Access Denied"
          description="You do not have permission to view allocation requests."
        />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center p-5 text-center">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div style={{ padding: "20px" }}>
      <PageHeader
        title="EFT Allocation Requests"
        actions={[
          <Space>
            <Button icon={<ReloadOutlined />} loading={refreshing} onClick={handleRefresh}>
              Refresh
            </Button>
          </Space>,
        ]}
      />

      {error && (
        <Alert
          type="error"
          showIcon
          message={error}
          closable
          style={{ marginBottom: 16 }}
          onClose={() => setError(null)}
        />
      )}

      <Table
        rowKey="_id"
        bordered
        dataSource={items}
        columns={[
          {
            title: "Requested On",
            dataIndex: "createdAt",
            key: "createdAt",
            render: (v: string) => new Date(v).toLocaleString(),
            sorter: (a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
            defaultSortOrder: "descend",
          },
          {
            title: "Policy Number",
            dataIndex: "policyNumber",
            key: "policyNumber",
          },
          {
            title: "Notes",
            dataIndex: "notes",
            key: "notes",
            render: (notes: string[]) => (notes && notes.length ? notes.join("; ") : "—"),
          },
          {
            title: "Evidence Count",
            key: "evidence",
            render: (_: any, record: AllocationRequestItem) => record.evidence?.length || 0,
          },
          {
            title: "Status",
            dataIndex: "status",
            key: "status",
            render: (s: string) => <Tag color={s === "PENDING" ? "gold" : s === "APPROVED" ? "green" : s === "REJECTED" ? "red" : "blue"}>{s}</Tag>,
          },
        ]}
      />
    </div>
  );
}
