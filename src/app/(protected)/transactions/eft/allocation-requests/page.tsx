"use client";

import { useEffect, useState } from "react";

import { ExclamationCircleOutlined, FileSearchOutlined, MoreOutlined, QuestionCircleOutlined, ReloadOutlined, UploadOutlined } from "@ant-design/icons";
import { Alert, Button, DatePicker, Descriptions, Drawer, Dropdown, Form, Input, Popconfirm, Space, Spin, Table, Tabs, Tag, Upload, message } from "antd";
import dayjs from "dayjs";
import sweetAlert from "sweetalert";

import PageHeader from "@/app/components/page-header";
import { useRole } from "@/app/hooks/use-role";
import { IAllocationRequest } from "@/app/models/hr/allocation-request.schema";
import { IEftTransaction } from "@/app/models/scheme/eft-transaction.schema";


interface AllocationRequestItem extends IAllocationRequest {
  _id: string;
  transaction: IEftTransaction;
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
  const [filters, setFilters] = useState<{ status?: string; start?: string; end?: string; requester?: string }>({
    status: hasRole(["eft_allocator"]) ? "SUBMITTED" : "PENDING",
  });

  const [rejecting, setRejecting] = useState<AllocationRequestItem | null>(null);
  const [rejectForm] = Form.useForm();
  const [reviewing, setReviewing] = useState<AllocationRequestItem | null>(null);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewDetail, setReviewDetail] = useState<AllocationRequestItem>();

  const [scanDuplicatesOpen, setScanDuplicatesOpen] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvData, setCsvData] = useState<any[]>([]);
  const [comparisonResults, setComparisonResults] = useState<{
    failedRequests: AllocationRequestItem[];
    duplicateRequests: AllocationRequestItem[];
    importRequests: AllocationRequestItem[];
  }>();
  const [scanning, setScanning] = useState(false);

  const isReviewer = hasRole(["eft_reviewer", "admin"]);

  // Utility function to format transaction date (MM/DD/YYYY) to YYYY/MM/DD format
  const formatTransactionDateToCSVFormat = (transactionDateStr: string): string => {
    console.log("Transaction Date: ", transactionDateStr);
    try {
      // Parse MM/DD/YYYY format and convert to YYYY/MM/DD
      const parsedDate = dayjs(transactionDateStr, 'MM/DD/YYYY');
      if (!parsedDate.isValid()) {
        throw new Error('Invalid date format');
      }
      console.log("Parsed Date: ", parsedDate);
      return parsedDate.format('YYYY/MM/DD');
    } catch (error) {
      console.warn('Failed to parse transaction date:', transactionDateStr, error);
      throw error;
    }
  };

  // Utility function to generate and download CSV file
  const generateAndDownloadCSV = (requests: any[], filename: string) => {
    // CSV header
    const headers = ['MembershipNo', 'DepositAmount', 'DepositDate'];

    // Convert requests to CSV rows
    const csvRows = requests.map(request => {
      const membershipNo = request.policyNumber;
      const depositAmount = request.transaction?.amount;
      const depositDate = request.transaction?.date;

      return [membershipNo, depositAmount, depositDate];
    });

    // Combine headers and rows
    const csvContent = [headers, ...csvRows]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    // Create and trigger download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');

    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  };

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
    await fetchData(filters.status || (isAllocator ? "SUBMITTED" : "PENDING"));
    setRefreshing(false);
  };

  useEffect(() => {
    fetchData(filters.status || (isAllocator ? "SUBMITTED" : "PENDING"));
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

  const parseCSV = (csvText: string) => {
    const lines = csvText.split('\n');
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    const data = [];

    for (let i = 1; i < lines.length; i++) {
      if (lines[i].trim()) {
        const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
        const row: any = {};
        headers.forEach((header, index) => {
          row[header] = values[index] || '';
        });
        data.push(row);
      }
    }

    return data;
  };

  const handleCSVUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const csvText = e.target?.result as string;
      const parsed = parseCSV(csvText);
      setCsvData(parsed);
      setCsvFile(file);
      message.success(`CSV file loaded with ${parsed.length} records`);
    };
    reader.readAsText(file);
    return false; // Prevent default upload
  };

  const performDuplicateScan = async () => {
    if (!csvData.length) {
      message.error('Please upload a CSV file first');
      return;
    }

    setScanning(true);
    try {
      // Get selected allocation requests with their transaction details
      const allocationRequests = items.filter(item => selectedRowKeys.includes(item._id));
      const scanResults = await fetch(`/api/transactions/scan/duplicates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ allocationRequests, receiptsFromASSIT: csvData }),
      });

      if (scanResults.ok) {
        const data = await scanResults.json();
        const { failedRequests, duplicateRequests, importRequests, stats } = data;
        const duplicateCount = stats.duplicateRequests;
        const totalScanned = stats.totalRequests;

        setComparisonResults(data);

        message.success(`Scan completed. Found ${duplicateCount} potential duplicates out of ${totalScanned} requests scanned.`);
      } else {
        message.error('Failed to perform duplicate scan');
      }

    } catch (error) {
      message.error('Failed to perform duplicate scan');
      console.error('Duplicate scan error:', error);
    } finally {
      setScanning(false);
    }
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
                    sweetAlert({ icon: 'success', title: 'Submitted for allocation', timer: 1500 });
                    setSelectedRowKeys([]);
                    handleRefresh();
                  } else {
                    const data = await res.json().catch(() => ({}));
                    sweetAlert({ icon: 'error', title: data.message || 'Failed to submit' });
                  }
                }}
              >
                Submit for Allocation
              </Button>
            )}
            {(filters.status === 'SUBMITTED') && (
              <Button
                icon={<FileSearchOutlined />}
                disabled={!selectedRowKeys.length}
                onClick={() => setScanDuplicatesOpen(true)}
              >
                Scan Duplicates
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
          { key: 'DUPLICATE', label: 'Duplicates' },
        ] : [
          { key: 'PENDING', label: 'Pending Review' },
          { key: 'REJECTED', label: 'Rejected' },
          { key: 'APPROVED', label: 'Approved' },
          { key: 'SUBMITTED', label: 'Submitted for Allocation' },
          { key: 'ALLOCATED', label: 'Allocated' },
          { key: 'DUPLICATE', label: 'Duplicates' },
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
            render: (s: string) => <Tag color={s === "PENDING" ? "gold" : s === "APPROVED" ? "green" : s === "REJECTED" ? "red" : s === "DUPLICATE" ? "orange" : "blue"}>{s}</Tag>,
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
                          setReviewDetail(data.item);
                        } else {
                          sweetAlert({ icon: 'error', title: 'Failed to load details' });
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
            <h3 className="mb-0 text-md font-semibold">{reviewDetail?.status === 'PENDING' ? 'Review Allocation Request' : 'View Allocation Request'}</h3>
            <p className="mb-0 text-sm text-gray-500 font-normal">{reviewDetail?.status === 'PENDING' ? 'Review details and submit to the Finance Department for allocation on ASSIT.' : `This request is ${(reviewDetail?.status || '').toLowerCase()}. You can only view the details.`}</p>
          </div>
        }
        placement="right"
        width="84%"
        open={!!reviewing}
        onClose={() => { setReviewing(null); setReviewDetail(undefined); }}
        closable={false}
        extra={
          <Space>
            <Button onClick={() => { setReviewing(null); setReviewDetail(undefined); }}>Close</Button>
          </Space>
        }
        footer={
          <Space>
            {(reviewDetail?.status === "PENDING") && (
              <>
                <Popconfirm
                  title="Are you sure you want to approve this request?"
                  okText="Yes, approve"
                  okButtonProps={{ className: "bg-green-500 hover:!bg-green-600 text-white hover:!text-white hover:!border-green-600" }}
                  cancelText="No"
                  icon={<QuestionCircleOutlined />}
                  onConfirm={async () => {
                    const res = await fetch(`/api/transactions/eft/allocation-requests/${reviewDetail?._id}`, {
                      method: "PATCH",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ status: "APPROVED" }),
                    });
                    if (res.ok) { sweetAlert({ icon: 'success', title: 'Approved', timer: 1500 }); setReviewing(null); setReviewDetail(undefined); handleRefresh(); } else { sweetAlert({ icon: 'error', title: 'Failed to approve' }); }
                  }}
                >
                  <Button className="bg-green-500 hover:!bg-green-600 text-white hover:!text-white hover:!border-green-600 w-28">Approve</Button>
                </Popconfirm>
              </>
            )}
            {(reviewDetail?.status === "PENDING") && (
              <Button type="primary" danger className="w-28 hover:!bg-red-600 text-white hover:!text-white hover:!border-red-600" onClick={() => { setRejecting(reviewDetail); }}>Reject</Button>
            )}
            {(reviewDetail?.status === "APPROVED" && isReviewer) && (
              <Button type="primary" danger className="w-28 hover:!bg-red-600 text-white hover:!text-white hover:!border-red-600" onClick={() => { setRejecting(reviewDetail); }}>Reject</Button>
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
            {reviewDetail.status === 'PENDING' && (
              <Alert
                type="info"
                showIcon
                message="If approved, this request will be submitted for allocation on ASSIT."
                style={{ marginBottom: 16 }}
              />
            )}

            <h3 className="mb-2 text-md font-semibold">Transaction Information</h3>
            <Descriptions size="small" bordered column={2} style={{ marginBottom: 16 }}>
              <Descriptions.Item label="Date">{new Date(reviewDetail.transaction?.date).toLocaleString()}</Descriptions.Item>
              <Descriptions.Item label="File ID">{reviewDetail.transaction?.uuid}</Descriptions.Item>
              <Descriptions.Item label="Description">{reviewDetail.transaction?.description}</Descriptions.Item>
              <Descriptions.Item label="Amount">{Intl.NumberFormat(undefined, { style: 'currency', currency: 'ZAR', currencyDisplay: 'narrowSymbol' }).format(reviewDetail.transaction?.amount)}</Descriptions.Item>
              <Descriptions.Item label="Additional Info">{reviewDetail.transaction?.additionalInformation}</Descriptions.Item>
            </Descriptions>

            <h3 className="mb-2 text-md font-semibold">Request Information</h3>
            <Descriptions size="small" bordered column={2} style={{ marginBottom: 16 }}>
              <Descriptions.Item label="Policy Number">{reviewDetail.policyNumber}</Descriptions.Item>
              <Descriptions.Item label="Requested On">{new Date(reviewDetail.createdAt).toLocaleString()}</Descriptions.Item>
              <Descriptions.Item label="Status"><Tag color={reviewDetail.status === 'PENDING' ? 'gold' : reviewDetail.status === 'APPROVED' ? 'green' : reviewDetail.status === 'REJECTED' ? 'red' : 'blue'}>{reviewDetail.status}</Tag></Descriptions.Item>
              <Descriptions.Item label="Requested By">{(reviewDetail as any).requestedBy?.name || (reviewDetail as any).requestedBy?.email || '—'}</Descriptions.Item>
              {reviewDetail.status === 'SUBMITTED' && (
                <>
                  <Descriptions.Item label="Submitted By">{(reviewDetail as any).submittedBy?.name || (reviewDetail as any).submittedBy?.email || '—'}</Descriptions.Item>
                  <Descriptions.Item label="Submitted At">{(reviewDetail as any).submittedAt ? new Date((reviewDetail as any).submittedAt).toLocaleString() : '—'}</Descriptions.Item>
                </>
              )}
              {reviewDetail.status === 'APPROVED' && (
                <>
                  <Descriptions.Item label="Approved By">{(reviewDetail as any).approvedBy?.name || (reviewDetail as any).approvedBy?.email || '—'}</Descriptions.Item>
                  <Descriptions.Item label="Approved At">{reviewDetail.approvedAt ? new Date((reviewDetail as any).approvedAt).toLocaleString() : '—'}</Descriptions.Item>
                </>
              )}
              {reviewDetail.status === 'REJECTED' && (
                <>
                  <Descriptions.Item label="Rejected By">{(reviewDetail as any).rejectedBy?.name || (reviewDetail as any).rejectedBy?.email || '—'}</Descriptions.Item>
                  <Descriptions.Item label="Rejected At">{(reviewDetail as any).rejectedAt ? new Date((reviewDetail as any).rejectedAt).toLocaleString() : '—'}</Descriptions.Item>
                </>
              )}
              {reviewDetail.status === 'CANCELLED' && (
                <>
                  <Descriptions.Item label="Cancelled By">{(reviewDetail as any).cancelledBy?.name || (reviewDetail as any).cancelledBy?.email || '—'}</Descriptions.Item>
                  <Descriptions.Item label="Cancelled At">{(reviewDetail as any).cancelledAt ? new Date((reviewDetail as any).cancelledAt).toLocaleString() : '—'}</Descriptions.Item>
                </>
              )}
              {reviewDetail.status === 'REJECTED' && reviewDetail.rejectionReason && (
                <Descriptions.Item label="Rejection Reason" span={2}>{reviewDetail.rejectionReason}</Descriptions.Item>
              )}
              <Descriptions.Item label="Notes">{reviewDetail.notes?.length ? reviewDetail.notes.join("; ") : "—"}</Descriptions.Item>
            </Descriptions>

            {reviewDetail.evidence?.length > 0 && (
              <div>
                <h3 className="mb-2 text-md font-semibold">Supporting Documents</h3>
                <ul className="list-disc pl-5">
                  {reviewDetail.evidence.map((url, idx) => (
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
                if (res.ok) { sweetAlert({ icon: 'success', title: 'Rejected', timer: 1500 }); setRejecting(null); handleRefresh(); } else { sweetAlert({ icon: 'error', title: 'Failed to reject' }); }
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

      <Drawer
        title={
          <div>
            <h3 className="mb-0 text-md font-semibold">Scan for Duplicates</h3>
            <p className="mb-0 text-sm text-gray-500 font-normal">Upload ASSIT receipts CSV to compare against selected allocation requests.</p>
          </div>
        }
        placement="right"
        width="84%"
        open={scanDuplicatesOpen}
        onClose={() => {
          setScanDuplicatesOpen(false);
          setCsvFile(null);
          setCsvData([]);
          setComparisonResults({ failedRequests: [], duplicateRequests: [], importRequests: [] });
        }}
        closable={false}
        footer={
          <Space>
            <Button onClick={() => setScanDuplicatesOpen(false)}>Close</Button>
            {csvData.length > 0 && (
              <Button
                type="primary" className="text-black"
                icon={<FileSearchOutlined />}
                loading={scanning}
                onClick={performDuplicateScan}
              >
                {scanning ? 'Scanning...' : 'Scan for Duplicates'}
              </Button>
            )}
          </Space>
        }
      >
        <div className="space-y-6">
          <div>
            <h4 className="mb-3 text-sm font-semibold">Upload ASSIT Receipts CSV</h4>
            <Upload
              accept=".csv"
              beforeUpload={handleCSVUpload}
              showUploadList={false}
              maxCount={1}
            >
              <Button icon={<UploadOutlined />}>
                {csvFile ? csvFile.name : 'Select CSV File'}
              </Button>
            </Upload>
            {csvFile && (
              <p className="mt-2 text-sm text-green-600">
                ✓ CSV loaded with {csvData.length} records
              </p>
            )}
          </div>

          {csvData.length > 0 && (
            <div>
              <h4 className="mb-3 text-sm font-semibold">Selected Allocation Requests</h4>
              <p className="mb-3 text-sm text-gray-600">
                Comparing {selectedRowKeys.length} selected requests against CSV data.
                Comparison is based on Effective Date + MembershipID composite key.
              </p>
            </div>
          )}

          {csvData.length > 0 && comparisonResults && <div>
            <h4 className="mb-3 text-sm font-semibold">Scan Results</h4>
            <Tabs
              defaultActiveKey="ready"
              items={[
                {
                  key: 'ready',
                  label: `Ready for Download (${comparisonResults.importRequests.length})`,
                  children: (
                    <div>
                      <div className="mb-4 flex justify-between items-center">
                        <p className="text-sm text-gray-600">
                          {comparisonResults.importRequests.length} requests ready for download
                        </p>
                        <Space>
                          <Button
                            icon={<UploadOutlined />}
                            disabled={comparisonResults.importRequests.length === 0}
                            onClick={() => {
                              const timestamp = dayjs().format('YYYY-MM-DD_HH-mm-ss');
                              const filename = `eft_allocation_requests_${timestamp}.csv`;
                              generateAndDownloadCSV(comparisonResults.importRequests, filename);
                              message.success(`Downloaded ${comparisonResults.importRequests.length} requests as ${filename}`);
                            }}
                          >
                            Download All
                          </Button>
                          <Button
                            type="primary"
                            disabled={comparisonResults.importRequests.length === 0}
                            onClick={async () => {
                              const requestIds = comparisonResults.importRequests.map((r) => r._id);

                              const res = await fetch('/api/transactions/eft/allocation-requests/allocate', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ ids: requestIds }),
                              });

                              if (res.ok) {
                                setSelectedRowKeys([]);
                                handleRefresh();
                                setScanDuplicatesOpen(false);
                                sweetAlert({ icon: 'success', title: `Marked ${requestIds.length} requests as Allocated`, timer: 1500 });
                              } else {
                                const data = await res.json().catch(() => ({}));
                                sweetAlert({ icon: 'error', title: data.message || 'Failed to allocate' });
                              }
                            }}
                          >
                            Mark as Allocated
                          </Button>
                        </Space>
                      </div>
                      <Table
                        rowKey={(record, index) => `${record._id}-${index}`}
                        dataSource={comparisonResults.importRequests}
                        pagination={{ pageSize: 10, showSizeChanger: true }}
                        columns={[
                          {
                            title: 'Policy Number',
                            dataIndex: 'policyNumber',
                            key: 'policyNumber',
                          },
                          {
                            title: 'Transaction Date',
                            dataIndex: 'transaction',
                            key: 'transaction',
                            render: (transaction: IEftTransaction) => dayjs(transaction?.date).format('DD/MM/YYYY'),
                          },
                          {
                            title: 'Amount',
                            dataIndex: 'transaction',
                            key: 'amount',
                            render: (amount: number, record: AllocationRequestItem) => Intl.NumberFormat(undefined, { style: 'currency', currency: 'ZAR', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(record.transaction?.amount),
                          },
                          {
                            title: 'Actions',
                            key: 'actions',
                            render: (_, record, index) => (
                              <Space>
                                <Button
                                  size="small"
                                  icon={<UploadOutlined />}
                                  onClick={() => {
                                    const timestamp = dayjs().format('YYYY-MM-DD_HH-mm-ss');
                                    const filename = `eft_allocation_request_${record.policyNumber}_${timestamp}.csv`;
                                    generateAndDownloadCSV([record], filename);
                                    message.success(`Downloaded request for policy ${record.policyNumber}`);
                                  }}
                                >
                                  Download
                                </Button>
                                <Button
                                  size="small"
                                  type="primary"
                                  onClick={async () => {
                                    const res = await fetch('/api/transactions/eft/allocation-requests/allocate', {
                                      method: 'POST',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({ ids: [record._id] }),
                                    });

                                    if (res.ok) {
                                      handleRefresh();
                                      message.success(`Marked policy ${record.policyNumber} as allocated`);
                                    } else {
                                      const data = await res.json().catch(() => ({}));
                                      message.error(data.message || 'Failed to allocate');
                                    }
                                  }}
                                >
                                  Mark as Allocated
                                </Button>
                              </Space>
                            ),
                          },
                        ]}
                      />
                    </div>
                  ),
                },
                {
                  key: 'duplicates',
                  label: `Potential Duplicates (${comparisonResults.duplicateRequests.length})`,
                  children: (
                    <div>
                      <div className="mb-4 flex justify-between items-center">
                        <p className="text-sm text-gray-600">
                          {comparisonResults.duplicateRequests.length} potential duplicates found
                        </p>
                        <Button
                          type="primary"
                          danger
                          disabled={comparisonResults.duplicateRequests.length === 0}
                          onClick={async () => {
                            const duplicateRequests = comparisonResults.duplicateRequests;
                            const requestIds = duplicateRequests.map(r => r._id);

                            try {
                              const res = await fetch('/api/transactions/eft/allocation-requests/mark-duplicates', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ ids: requestIds }),
                              });

                              if (res.ok) {
                                setSelectedRowKeys([]);
                                handleRefresh();
                                setScanDuplicatesOpen(false);
                                sweetAlert({ icon: 'success', title: `Marked ${requestIds.length} requests as duplicates`, timer: 1500 });
                              } else {
                                const data = await res.json().catch(() => ({}));
                                sweetAlert({ icon: 'error', title: data.message || 'Failed to mark as duplicates' });
                              }
                            } catch (error) {
                              console.error('Error marking duplicates:', error);
                              sweetAlert({ icon: 'error', title: 'Failed to mark as duplicates' });
                            }
                          }}
                        >
                          Mark All as Duplicates
                        </Button>
                      </div>
                      <Table
                        rowKey={(record, index) => `${record._id}-${index}`}
                        dataSource={comparisonResults.duplicateRequests}
                        pagination={{ pageSize: 10, showSizeChanger: true }}
                        columns={[
                          {
                            title: 'Policy Number',
                            dataIndex: 'policyNumber',
                            key: 'policyNumber',
                          },
                          {
                            title: 'Transaction Date',
                            dataIndex: 'transaction',
                            key: 'transaction',
                            render: (transaction: IEftTransaction) => dayjs(transaction?.date).format('DD/MM/YYYY'),
                          },
                          {
                            title: 'Amount',
                            dataIndex: 'transaction',
                            key: 'amount',
                            render: (amount: number, record: AllocationRequestItem) => Intl.NumberFormat(undefined, { style: 'currency', currency: 'ZAR', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(record.transaction?.amount),
                          },
                          {
                            title: 'Actions',
                            key: 'actions',
                            render: (_, record) => (
                              <Button
                                size="small"
                                danger
                                onClick={async () => {
                                  try {
                                    const res = await fetch('/api/transactions/eft/allocation-requests/mark-duplicates', {
                                      method: 'POST',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({ ids: [record._id] }),
                                    });

                                    if (res.ok) {
                                      handleRefresh();
                                      message.success(`Marked policy ${record.policyNumber} as duplicate`);
                                    } else {
                                      const data = await res.json().catch(() => ({}));
                                      message.error(data.message || 'Failed to mark as duplicate');
                                    }
                                  } catch (error) {
                                    console.error('Error marking duplicate:', error);
                                    message.error('Failed to mark as duplicate');
                                  }
                                }}
                              >
                                Mark as Duplicate
                              </Button>
                            ),
                          },
                        ]}
                      />
                    </div>
                  ),
                },
              ]}
            />
          </div>}
        </div>
      </Drawer>
    </div>
  );
}
