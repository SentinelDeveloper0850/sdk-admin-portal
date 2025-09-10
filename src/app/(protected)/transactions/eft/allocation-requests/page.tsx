"use client";

import { useEffect, useState } from "react";

import { ExclamationCircleOutlined, MoreOutlined, QuestionCircleOutlined, ReloadOutlined } from "@ant-design/icons";
import { Alert, Button, DatePicker, Descriptions, Drawer, Dropdown, Form, Input, Popconfirm, Space, Spin, Table, Tabs, Tag, message } from "antd";

import PageHeader from "@/app/components/page-header";
import { useRole } from "@/app/hooks/use-role";


interface AllocationRequestItem {
  _id: string;
  transactionId: string;
  policyNumber: string;
  notes: string[];
  evidence: string[];
  status: string;
  requestedBy?: { name?: string; email?: string } | string;
  createdAt: string;
  updatedAt: string;
  rejectionReason?: string;
  approvedAt?: string;
  rejectedAt?: string;
  cancelledAt?: string;
}

interface EftTransactionDetail {
  _id: string;
  uuid: string;
  description: string;
  additionalInformation: string;
  amount: number;
  date: string;
}

export default function AllocationRequestsPage() {
  const { hasRole } = useRole();

  const allowed = hasRole([
    "eft_reviewer",
    "eft_allocator",
  ]);
  const isAllocator = hasRole(["eft_allocator"]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [items, setItems] = useState<AllocationRequestItem[]>([]);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [filters, setFilters] = useState<{ status?: string; start?: string; end?: string; requester?: string }>({});

  const [rejecting, setRejecting] = useState<AllocationRequestItem | null>(null);
  const [rejectForm] = Form.useForm();
  const [reviewing, setReviewing] = useState<AllocationRequestItem | null>(null);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewDetail, setReviewDetail] = useState<{ item: AllocationRequestItem; transaction: EftTransactionDetail } | null>(null);

  const isReviewer = hasRole(["eft_reviewer", "admin"]);

  const fetchData = async (status?: string) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (status) params.set("status", status);
      if (filters.start) params.set("start", filters.start);
      if (filters.end) params.set("end", filters.end);
      if (filters.requester) params.set("requester", filters.requester);
      const res = await fetch(`/api/transactions/eft/allocation-requests?${params.toString()}`);
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
    await fetchData(filters.status || 'PENDING');
    setRefreshing(false);
  };

  useEffect(() => {
    fetchData(filters.status || 'PENDING');
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

  const handleTabChange = (key: string) => {
    setFilters((f) => ({ ...f, status: key }));
    fetchData(key);
  };

  return (
    <div style={{ padding: "20px" }}>
      <PageHeader
        title="EFT Allocation Requests"
        actions={[
          <Space>
            {(filters.status === 'APPROVED') && (
              <Button
                type="primary"
                disabled={!selectedRowKeys.length}
                onClick={async () => {
                  const res = await fetch('/api/transactions/eft/allocation-requests/submit', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ids: selectedRowKeys }),
                  });
                  if (res.ok) {
                    message.success('Submitted for allocation');
                    setSelectedRowKeys([]);
                    handleRefresh();
                  } else {
                    const data = await res.json().catch(() => ({}));
                    message.error(data.message || 'Failed to submit');
                  }
                }}
              >
                Submit for Allocation
              </Button>
            )}
            {(filters.status === 'SUBMITTED') && (
              <Button
                type="primary"
                disabled={!selectedRowKeys.length}
                onClick={async () => {
                  const res = await fetch('/api/transactions/eft/allocation-requests/allocate', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ids: selectedRowKeys }),
                  });
                  if (res.ok) {
                    setSelectedRowKeys([]);
                    handleRefresh();
                    message.success('Allocated');
                  } else {
                    const data = await res.json().catch(() => ({}));
                    message.error(data.message || 'Failed to allocate');
                  }
                }}
              >
                Allocate
              </Button>
            )}
            <Button icon={<ReloadOutlined />} loading={refreshing} onClick={handleRefresh}>
              Refresh
            </Button>
          </Space>,
        ]}
      />

      <Tabs
        defaultActiveKey={filters.status || (isAllocator ? 'SUBMITTED' : 'PENDING')}
        activeKey={filters.status || (isAllocator ? 'SUBMITTED' : 'PENDING')}
        onChange={handleTabChange}
        items={(isAllocator ? [
          { key: 'SUBMITTED', label: 'Submitted for Allocation' },
          { key: 'ALLOCATED', label: 'Allocated' },
        ] : [
          { key: 'PENDING', label: 'Pending Review' },
          { key: 'REJECTED', label: 'Rejected' },
          { key: 'APPROVED', label: 'Approved' },
          { key: 'SUBMITTED', label: 'Submitted for Allocation' },
          { key: 'ALLOCATED', label: 'Allocated' },
        ])}
      />

      <Space wrap style={{ marginBottom: 16 }}>
        <Input
          allowClear
          placeholder="Filter by requester (name or email)"
          style={{ width: 260 }}
          value={filters.requester}
          onChange={(e) => setFilters((f) => ({ ...f, requester: e.target.value }))}
        />
        <DatePicker.RangePicker
          onChange={(range) => {
            setFilters((f) => ({
              ...f,
              start: range?.[0]?.startOf("day").toISOString(),
              end: range?.[1]?.endOf("day").toISOString(),
            }));
          }}
        />
        <Button onClick={() => fetchData(filters.status || 'PENDING')}>Apply</Button>
        <Button
          onClick={() => {
            setFilters({});
            fetchData(filters.status || 'PENDING');
          }}
        >
          Reset
        </Button>
      </Space>

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
        rowSelection={(filters.status === 'APPROVED' || (isAllocator && filters.status === 'SUBMITTED')) ? {
          selectedRowKeys,
          onChange: setSelectedRowKeys,
          preserveSelectedRowKeys: true,
          getCheckboxProps: (record: AllocationRequestItem) => ({ disabled: !((!isAllocator && record.status === 'APPROVED') || (isAllocator && record.status === 'SUBMITTED')) }),
        } : undefined}
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
            sorter: (a: any, b: any) => String(a.policyNumber).localeCompare(String(b.policyNumber)),
          },
          {
            title: "Requested By",
            key: "requestedBy",
            render: (_: any, r: AllocationRequestItem) => {
              const rb = r.requestedBy as any;
              if (!rb) return "—";
              if (typeof rb === 'string') return rb;
              return rb.name || rb.email || "—";
            },
          },
          {
            title: "Notes",
            dataIndex: "notes",
            key: "notes",
            render: (notes: string[]) => (notes && notes.length ? notes.join("; ") : "—"),
          },
          {
            title: "Supporting Documents",
            key: "evidence",
            render: (_: any, record: AllocationRequestItem) => record.evidence?.length || 0,
          },
          {
            title: "Status",
            dataIndex: "status",
            key: "status",
            render: (s: string) => <Tag color={s === "PENDING" ? "gold" : s === "APPROVED" ? "green" : s === "REJECTED" ? "red" : "blue"}>{s}</Tag>,
          },
          {
            title: "Actions",
            key: "actions",
            render: (_: any, record: AllocationRequestItem) => (
              <Dropdown
                menu={{
                  items: [
                    {
                      key: 'review',
                      label: record.status === 'PENDING' ? 'Review' : 'View Details',
                      onClick: async () => {
                        setReviewing(record);
                        setReviewLoading(true);
                        const res = await fetch(`/api/transactions/eft/allocation-requests/${record._id}`);
                        if (res.ok) {
                          const data = await res.json();
                          setReviewDetail(data);
                        } else {
                          message.error('Failed to load details');
                          setReviewing(null);
                        }
                        setReviewLoading(false);
                      }
                    },
                    ...(record.status === 'APPROVED' && isReviewer ? [{
                      key: 'reject-approved',
                      label: 'Reject',
                      danger: true,
                      onClick: () => { rejectForm.resetFields(); setRejecting(record); }
                    }] : [])
                  ]
                }}
                trigger={["click"]}
              >
                <Button icon={<MoreOutlined />} />
              </Dropdown>
            ),
          },
        ]}
      />

      <Drawer
        title={
          <div>
            <h3 className="mb-0 text-md font-semibold">{reviewDetail?.item?.status === 'PENDING' ? 'Review Allocation Request' : 'View Allocation Request'}</h3>
            <p className="mb-0 text-sm text-gray-500 font-normal">{reviewDetail?.item?.status === 'PENDING' ? 'Review details and submit to the Finance Department for allocation on ASSIT.' : `This request is ${(reviewDetail?.item?.status || '').toLowerCase()}. You can only view the details.`}</p>
          </div>
        }
        placement="right"
        width="60%"
        open={!!reviewing}
        onClose={() => { setReviewing(null); setReviewDetail(null); }}
        closable={false}
        extra={
          <Space>
            <Button onClick={() => { setReviewing(null); setReviewDetail(null); }}>Close</Button>
          </Space>
        }
        footer={
          <Space>
            {(reviewDetail?.item?.status === "PENDING") && (
              <>
                <Popconfirm
                  title="Are you sure you want to approve this request?"
                  okText="Yes, approve"
                  okButtonProps={{ className: "bg-green-500 hover:!bg-green-600 text-white hover:!text-white hover:!border-green-600" }}
                  cancelText="No"
                  icon={<QuestionCircleOutlined />}
                  onConfirm={async () => {
                    const res = await fetch(`/api/transactions/eft/allocation-requests/${reviewDetail?.item?._id}`, {
                      method: "PATCH",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ status: "APPROVED" }),
                    });
                    if (res.ok) { message.success("Approved"); setReviewing(null); setReviewDetail(null); handleRefresh(); } else { message.error("Failed to approve"); }
                  }}
                >
                  <Button className="bg-green-500 hover:!bg-green-600 text-white hover:!text-white hover:!border-green-600 w-28">Approve</Button>
                </Popconfirm>
              </>
            )}
            {(reviewDetail?.item?.status === "PENDING") && (
              <Button type="primary" danger className="w-28 hover:!bg-red-600 text-white hover:!text-white hover:!border-red-600" onClick={() => { setRejecting(reviewDetail!.item); }}>Reject</Button>
            )}
            {(reviewDetail?.item?.status === "APPROVED" && isReviewer) && (
              <Button type="primary" danger className="w-28 hover:!bg-red-600 text-white hover:!text-white hover:!border-red-600" onClick={() => { setRejecting(reviewDetail!.item); }}>Reject</Button>
            )}
          </Space>
        }
      >
        {reviewLoading && (
          <div className="flex h-[40vh] items-center justify-center p-5 text-center">
            <Spin />
          </div>
        )}
        {!reviewLoading && reviewDetail && (
          <div>
            {reviewDetail.item.status === 'PENDING' && (
              <Alert
                type="info"
                showIcon
                message="If approved, this request will be submitted for allocation on ASSIT."
                style={{ marginBottom: 16 }}
              />
            )}

            <h3 className="mb-2 text-md font-semibold">Transaction Information</h3>
            <Descriptions size="small" bordered column={2} style={{ marginBottom: 16 }}>
              <Descriptions.Item label="Date">{new Date(reviewDetail.transaction.date).toLocaleString()}</Descriptions.Item>
              <Descriptions.Item label="File ID">{reviewDetail.transaction.uuid}</Descriptions.Item>
              <Descriptions.Item label="Description">{reviewDetail.transaction.description}</Descriptions.Item>
              <Descriptions.Item label="Amount">{Intl.NumberFormat(undefined, { style: 'currency', currency: 'ZAR', currencyDisplay: 'narrowSymbol' }).format(reviewDetail.transaction.amount)}</Descriptions.Item>
              <Descriptions.Item label="Additional Info">{reviewDetail.transaction.additionalInformation}</Descriptions.Item>
            </Descriptions>

            <h3 className="mb-2 text-md font-semibold">Request Information</h3>
            <Descriptions size="small" bordered column={2} style={{ marginBottom: 16 }}>
              <Descriptions.Item label="Policy Number">{reviewDetail.item.policyNumber}</Descriptions.Item>
              <Descriptions.Item label="Requested On">{new Date(reviewDetail.item.createdAt).toLocaleString()}</Descriptions.Item>
              <Descriptions.Item label="Status"><Tag color={reviewDetail.item.status === 'PENDING' ? 'gold' : reviewDetail.item.status === 'APPROVED' ? 'green' : reviewDetail.item.status === 'REJECTED' ? 'red' : 'blue'}>{reviewDetail.item.status}</Tag></Descriptions.Item>
              <Descriptions.Item label="Requested By">{(reviewDetail.item as any).requestedBy?.name || (reviewDetail.item as any).requestedBy?.email || '—'}</Descriptions.Item>
              {reviewDetail.item.status === 'SUBMITTED' && (
                <>
                  <Descriptions.Item label="Submitted By">{(reviewDetail.item as any).submittedBy?.name || (reviewDetail.item as any).submittedBy?.email || '—'}</Descriptions.Item>
                  <Descriptions.Item label="Submitted At">{(reviewDetail.item as any).submittedAt ? new Date((reviewDetail.item as any).submittedAt).toLocaleString() : '—'}</Descriptions.Item>
                </>
              )}
              {reviewDetail.item.status === 'APPROVED' && (
                <>
                  <Descriptions.Item label="Approved By">{(reviewDetail.item as any).approvedBy?.name || (reviewDetail.item as any).approvedBy?.email || '—'}</Descriptions.Item>
                  <Descriptions.Item label="Approved At">{reviewDetail.item.approvedAt ? new Date((reviewDetail.item as any).approvedAt).toLocaleString() : '—'}</Descriptions.Item>
                </>
              )}
              {reviewDetail.item.status === 'REJECTED' && (
                <>
                  <Descriptions.Item label="Rejected By">{(reviewDetail.item as any).rejectedBy?.name || (reviewDetail.item as any).rejectedBy?.email || '—'}</Descriptions.Item>
                  <Descriptions.Item label="Rejected At">{(reviewDetail.item as any).rejectedAt ? new Date((reviewDetail.item as any).rejectedAt).toLocaleString() : '—'}</Descriptions.Item>
                </>
              )}
              {reviewDetail.item.status === 'CANCELLED' && (
                <>
                  <Descriptions.Item label="Cancelled By">{(reviewDetail.item as any).cancelledBy?.name || (reviewDetail.item as any).cancelledBy?.email || '—'}</Descriptions.Item>
                  <Descriptions.Item label="Cancelled At">{(reviewDetail.item as any).cancelledAt ? new Date((reviewDetail.item as any).cancelledAt).toLocaleString() : '—'}</Descriptions.Item>
                </>
              )}
              {reviewDetail.item.status === 'REJECTED' && reviewDetail.item.rejectionReason && (
                <Descriptions.Item label="Rejection Reason" span={2}>{reviewDetail.item.rejectionReason}</Descriptions.Item>
              )}
              <Descriptions.Item label="Notes">{reviewDetail.item.notes?.length ? reviewDetail.item.notes.join("; ") : "—"}</Descriptions.Item>
            </Descriptions>

            {reviewDetail.item.evidence?.length > 0 && (
              <div>
                <h3 className="mb-2 text-md font-semibold">Supporting Documents</h3>
                <ul className="list-disc pl-5">
                  {reviewDetail.item.evidence.map((url, idx) => (
                    <li key={idx}><a href={url} target="_blank" rel="noreferrer" className="text-blue-600">View document {idx + 1}</a></li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </Drawer>

      <Drawer
        title={
          <div>
            <h3 className="mb-0 text-md font-semibold">Reject Allocation Request</h3>
            <p className="mb-0 text-sm text-gray-500 font-normal">Reject this request and provide a reason for rejection.</p>
          </div>
        }
        placement="right"
        width="40%"
        open={!!rejecting}
        onClose={() => setRejecting(null)}
        closable={false}
        footer={
          <Space>
            <Button onClick={() => setRejecting(null)}>Cancel</Button>
            <Button
              type="primary"
              danger
              onClick={async () => {
                const values = rejectForm.getFieldsValue();
                const res = await fetch(`/api/transactions/eft/allocation-requests/${rejecting?._id}`, {
                  method: "PATCH",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ status: "REJECTED", rejectionReason: values.rejectionReason }),
                });
                if (res.ok) { message.success("Rejected"); setRejecting(null); handleRefresh(); } else { message.error("Failed to reject"); }
              }}
            >
              Submit
            </Button>
          </Space>
        }
      >
        <Form layout="vertical" form={rejectForm}>
          <Form.Item label="Reason" name="rejectionReason" required>
            <Input.TextArea rows={4} placeholder="Provide reason for rejection" />
          </Form.Item>
        </Form>
      </Drawer>
    </div>
  );
}
