"use client";

import { useEffect, useMemo, useState } from "react";

import { AlertOutlined, CheckCircleOutlined, ClockCircleOutlined, ExclamationCircleOutlined, FileTextOutlined, PlusOutlined } from "@ant-design/icons";
import { Alert, Button, Card, Space, Spin, Table, Tag, Typography } from "antd";
import dayjs from "dayjs";

import PageHeader from "@/app/components/page-header";
import { useAuth } from "@/context/auth-context";
import { withRoleGuard } from "@/utils/utils/with-role-guard";
import { ERoles } from "../../../../types/roles.enum";

import CashUpSubmissionReviewDrawer from "@/app/components/cash-up/cash-up-submission-review-drawer";
import FuneralReceiptsDrawer from "@/app/components/cash-up/funeral-receipts-drawer";
import PolicyReceiptsDrawer from "@/app/components/cash-up/policy-receipts-drawer";
import SalesReceiptsDrawer from "@/app/components/cash-up/sales-receipts-drawer";
import WeeklySummaryDrawer from "@/app/components/cash-up/weekly-summary-drawer";
import { ColumnType } from "antd/es/table";
import CashUpCountdown from "./CashUpCountdown";

const { Title, Text } = Typography;

interface ICashUpSubmission {
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
  attachments: string[];
}

interface WeeklySummary {
  totalStaffAudited: number;
  fullyBalanced: number;
  discrepanciesFound: number;
  nonSubmissions: number;
  highRiskDiscrepancies: number;
  repeatOffenders: number;
  lateSubmissions: number;
  onTimeSubmissions: number;
}

const norm = (s?: string) => (s || '').trim().toLowerCase();

const CashUpDashboardPage = () => {
  const { user } = useAuth();
  const [cashUpSubmissions, setCashUpSubmissions] = useState<ICashUpSubmission[]>([]);
  const [weeklySummary, setWeeklySummary] = useState<WeeklySummary | null>(null);
  const [loading, setLoading] = useState(true);

  const [policyDrawerOpen, setPolicyDrawerOpen] = useState(false);
  const [funeralDrawerOpen, setFuneralDrawerOpen] = useState(false);
  const [salesDrawerOpen, setSalesDrawerOpen] = useState(false);

  const [reviewDrawerOpen, setReviewDrawerOpen] = useState(false);
  const [summaryDrawerOpen, setSummaryDrawerOpen] = useState(false);

  const [selectedCashUpSubmission, setSelectedCashUpSubmission] = useState<ICashUpSubmission | null>(null);
  const [selectedWeek, setSelectedWeek] = useState(dayjs().format('YYYY-MM-DD'));

  const fetchCashUpSubmissions = async () => {
    setLoading(true);
    try {
      const url = `/api/cash-up?employeeId=${user?._id}`; // always self
      const res = await fetch(url, { cache: "no-store" });
      const json = await res.json();
      if (json.success) setCashUpSubmissions(json.cashUpSubmissions);
    } catch (e) {
      console.error("Failed to fetch cash up submissions:", e);
    } finally {
      setLoading(false);
    }
  };

  const fetchWeeklySummary = async (week: string) => {
    try {
      const res = await fetch(`/api/cash-up/summary?week=${week}`);
      const json = await res.json();

      if (json.success) {
        setWeeklySummary(json.summary);
      }
    } catch (error) {
      console.error("Failed to fetch weekly summary:", error);
    }
  };

  const submitForReview = async (record: ICashUpSubmission) => {
    try {
      const res = await fetch("/api/cash-up/submit-for-review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ submissionId: record._id }),
      });
      const json = await res.json();
      if (json.success) {
        await fetchCashUpSubmissions();
        // optional toast/notification here
      } else {
        console.error(json.message || "Submit failed");
      }
    } catch (e) {
      console.error("Failed to submit Cash-Up submission:", e);
    }
  };


  useEffect(() => {
    if (user && selectedWeek) {
      fetchCashUpSubmissions();
      fetchWeeklySummary(selectedWeek);
    }
  }, [user, selectedWeek]);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "balanced":
        return "green";
      case "short":
        return "red";
      case "over":
        return "orange";
      case "pending":
        return "blue";
      case "nothing to submit":
        return "default";
      case "awaiting system balance":
        return "blue";
      case "missing batch receipt":
        return "red";
      case "draft":
        return "default";
      default:
        return "default";
    }
  };

  const getStatusText = (status: string) => {
    switch (status.toLowerCase()) {
      case "balanced":
        return "Balanced";
      case "draft":
        return "Draft";
      case "pending":
        return "Pending Review";
      case "submitted":
        return "Submitted";
      case "reviewed":
        return "Reviewed";
      case "escalated":
        return "Escalated";
      case "archived":
        return "Archived";
      case "deleted":
        return "Deleted";
      case "rejected":
        return "Rejected";
      case "pending_info":
        return "Pending Info";
      case "short":
        return "Short";
      case "over":
        return "Over";
      case "awaiting system balance":
        return "Awaiting System Balance";
      case "missing batch receipt":
        return "Missing Batch Receipt";
      default:
        return "Unknown";
    }
  };

  const getSubmissionStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending":
        return "blue";
      case "submitted":
        return "green";
      case "reviewed":
        return "green";
      case "escalated":
        return "purple";
      case "archived":
        return "gray";
      case "deleted":
        return "gray";
      case "submitted late (grace period)":
        return "orange";
      case "pending_info":
        return "orange";
      case "submitted late":
        return "red";
      case "not submitted":
        return "red";
      case "nothing to submit":
        return "default";
      default:
        return "default";
    }
  };

  const getRiskLevelColor = (riskLevel = "") => {
    switch (norm(riskLevel)) {
      case "high": return "red";
      case "medium": return "orange";
      case "low": return "green";
      default: return "default";
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR'
    }).format(amount);
  };

  // stats
  const { awaitingReview, balancedCount, varianceCount, escalatedCount, lateCount } = useMemo(() => {
    const n = (s?: string) => (s || "").toLowerCase();
    return {
      awaitingReview: cashUpSubmissions.filter(a => n(a.submissionStatus) === "submitted").length,
      balancedCount: cashUpSubmissions.filter(a => n(a.status) === "balanced").length,
      varianceCount: cashUpSubmissions.filter(a => ["short", "over"].includes(n(a.status))).length,
      escalatedCount: cashUpSubmissions.filter(a => n(a.submissionStatus) === "escalated").length,
      lateCount: cashUpSubmissions.filter(a => n(a.submissionStatus).includes("late")).length,
    };
  }, [cashUpSubmissions]);

  const columns = [
    // {
    //   title: "Employee",
    //   dataIndex: "employeeName",
    //   key: "employeeName",
    //   render: (text: string, record: ICashUpSubmission) => (
    //     <div>
    //       <div className="font-medium">{text}</div>
    //       <div className="text-xs text-gray-500">{dayjs(record.date).format('DD MMM YYYY')}</div>
    //     </div>
    //   ),
    // },
    {
      title: "Date",
      dataIndex: "date",
      key: "date",
      render: (date: string) => dayjs(date).format('DD MMM YYYY'),
    },
    {
      title: "Collections (Cash+Card)",
      dataIndex: "batchReceiptTotal",
      key: "batchReceiptTotal",
      align: "right",
      sorter: (a: ICashUpSubmission, b: ICashUpSubmission) => (a.batchReceiptTotal ?? 0) - (b.batchReceiptTotal ?? 0),
      render: (amount: number) => amount === null || amount === undefined ? '--' : formatCurrency(amount),
    },
    {
      title: "ASSIT Total",
      dataIndex: "systemBalance",
      key: "systemBalance",
      align: "right",
      sorter: (a: ICashUpSubmission, b: ICashUpSubmission) => (a.systemBalance ?? 0) - (b.systemBalance ?? 0),
      render: (amount: number) => amount === null || amount === undefined ? '--' : formatCurrency(amount),
    },
    {
      title: "Variance",
      dataIndex: "discrepancy",
      key: "discrepancy",
      align: "right",
      sorter: (a: ICashUpSubmission, b: ICashUpSubmission) => (a.discrepancy ?? 0) - (b.discrepancy ?? 0),
      render: (_: number, r: ICashUpSubmission) => {
        const hasTotals = r.batchReceiptTotal !== undefined && r.systemBalance !== undefined;
        if (!hasTotals) return "--";
        const variance = (r.discrepancy ?? (r.batchReceiptTotal - r.systemBalance));
        const color = variance === 0 ? "green" : variance > 0 ? "orange" : "red";
        return <Tag color={color}>{variance > 0 ? "+" : ""}{formatCurrency(variance)}</Tag>;
      },
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      align: "center",
      render: (status: string) => (
        <Tag className="uppercase" color={getStatusColor(status)}>
          {getStatusText(status)}
        </Tag>
      ),
    },
    {
      title: "Submission",
      dataIndex: "submissionStatus",
      key: "submissionStatus",
      align: "center",
      render: (status: string, record: ICashUpSubmission) => (
        <Tag className="uppercase" color={getSubmissionStatusColor(status)}>
          {status}
        </Tag>
      ),
    },
    {
      title: "Risk Level",
      dataIndex: "riskLevel",
      key: "riskLevel",
      align: "center",
      render: (riskLevel: string) => (
        <Tag className="uppercase" color={getRiskLevelColor(riskLevel)}>
          {riskLevel}
        </Tag>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      align: "center",
      render: (_: any, record: ICashUpSubmission) => (
        <Space>
          {norm(record.status) === "draft" && isOwner(record) && (
            <Button type="primary" className="text-black uppercase" onClick={() => submitForReview(record)}>
              Submit for Review
            </Button>
          )}
        </Space>
      ),
    },
  ];

  const statsCards = [
    {
      title: "Awaiting Review",
      value: awaitingReview,
      icon: <FileTextOutlined />,
      color: "blue",
    },
    {
      title: "Balanced",
      value: balancedCount,
      icon: <CheckCircleOutlined />,
      color: "green",
    },
    {
      title: "Variances",
      value: varianceCount,
      icon: <ExclamationCircleOutlined />,
      color: "orange",
    },
    {
      title: "Escalated",
      value: escalatedCount,
      icon: <AlertOutlined />,
      color: "red",
    },
    {
      title: "Late Submissions",
      value: lateCount,
      icon: <ClockCircleOutlined />,
      color: "yellow",
    },
  ];

  const isOwner = (rec: ICashUpSubmission) => user?._id === rec.employeeId;

  // Check if the user has the user submitted today?
  const hasSubmittedToday = cashUpSubmissions.some(
    a => a.date === dayjs().format('YYYY-MM-DD') && norm(a.submissionStatus) === 'submitted'
  );

  // Calculate the time remaining until the submission deadline in minutes
  const cutoff = dayjs().hour(18).minute(0).second(0);
  const minutesToCutoff = cutoff.diff(dayjs(), 'minutes'); // positive before cutoff, negative after
  const minutesLeft = minutesToCutoff;  // already positive before, negative after
  const humanMins = Math.max(0, minutesLeft);
  const plural = humanMins === 1 ? "" : "s";

  const colorClass: Record<string, string> = {
    blue: "text-blue-500",
    green: "text-green-500",
    orange: "text-orange-500",
    red: "text-red-500",
    yellow: "text-yellow-500",
    default: "text-gray-400",
  };

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title="Daily Cash-Up Reconciliation"
        subtitle="Match today’s collections to ASSIT and resolve variances"
        actions={[
          <Space key="actions">
            {!hasSubmittedToday && <Button onClick={() => setPolicyDrawerOpen(true)} type="dashed">
              <PlusOutlined className="w-4 h-4" /> Policy Receipts
            </Button>}
            {!hasSubmittedToday && <Button onClick={() => setFuneralDrawerOpen(true)} type="dashed">
              <PlusOutlined className="w-4 h-4" /> Funeral Receipts
            </Button>}
            {!hasSubmittedToday && <Button onClick={() => setSalesDrawerOpen(true)} type="dashed">
              <PlusOutlined className="w-4 h-4" /> Sales Receipts
            </Button>}
            {/* <Button
              onClick={() => setSummaryDrawerOpen(true)}
            >
              Weekly Summary
            </Button> */}
          </Space>
        ]}
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-5">
        {statsCards.map((card, index) => (
          <div className="col-span-1" key={index}>
            <Card size="small">
              <div className="flex items-center justify-between">
                <div>
                  <Text className="text-gray-500">{card.title}</Text>
                  <div className="text-2xl font-bold">{card.value}</div>
                </div>
                <div className={`text-2xl ${colorClass[card.color] || colorClass.default}`}>
                  {card.icon}
                </div>
              </div>
            </Card>
          </div>
        ))}
      </div>

      <div className="flex gap-4">
        <div className="flex-1">
          {/* Daily Cash-Up Submitted */}
          {hasSubmittedToday && <Alert type="success" showIcon description={<div className="space-y-2 w-full">
            <h4 className="font-bold">Daily Cash-Up Submitted</h4>
            <p>You have already submitted your receipts for today. Please wait for the system to process your submissions. If you need to submit more receipts, please contact your manager.</p>
          </div>} />}

          {/* Cash-Up Due */}
          {(!hasSubmittedToday && minutesToCutoff >= 60) && <Alert type="info" showIcon description={<div className="space-y-2 w-full">
            <h4 className="font-bold"><span>Cash-Up Due</span></h4>
            <p>You have not submitted your receipts for today. Please ensure you submit your receipts before the cut-off time to avoid any penalties.</p>
          </div>} />}

          {/* Cutting It Close */}
          {(!hasSubmittedToday && minutesToCutoff >= 0 && minutesToCutoff < 60) && <Alert type="warning" showIcon description={<div className="space-y-2 w-full">
            <h4 className="font-bold">Cutting It Close</h4>
            <p>You have not submitted your receipts for today. Please submit your receipts before the cut-off time to avoid any penalties. You have {humanMins} minute{plural} left.</p>
          </div>} />}

          {/* Deadline Missed */}
          {(!hasSubmittedToday && minutesToCutoff < 0) && <Alert type="error" showIcon description={<div className="space-y-2 w-full">
            <h4 className="font-bold">Deadline Missed</h4>
            <p>You have not submitted your receipts for today. You have missed the submission deadline and will be flagged as a late submission.</p>
          </div>} />}
        </div>
        <CashUpCountdown cutOffTime={"18:00:00"} />
      </div>

      {/* Cash-Up Submissions Table */}
      <Card size="small">
        <div className="mb-4">
          <Title level={4}>My Submissions</Title>
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <Spin size="large" />
          </div>
        ) : (
          <Table
            dataSource={cashUpSubmissions}
            columns={columns as ColumnType<ICashUpSubmission>[]}
            rowKey="_id"
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
            }}
            locale={{ emptyText: "No submissions yet. Upload receipts to start today’s cash-up." }}
            summary={(rows) => {
              const total = rows.reduce((sum, r) => sum + (r.batchReceiptTotal ?? 0), 0);
              return (
                <Table.Summary fixed>
                  <Table.Summary.Row>
                    <Table.Summary.Cell index={0}>Total</Table.Summary.Cell>
                    <Table.Summary.Cell index={1} align="right">{formatCurrency(total)}</Table.Summary.Cell>
                    <Table.Summary.Cell index={2} />
                    <Table.Summary.Cell index={3} />
                    <Table.Summary.Cell index={4} />
                    <Table.Summary.Cell index={5} />
                    <Table.Summary.Cell index={6} />
                  </Table.Summary.Row>
                </Table.Summary>
              );
            }}
          // onRow={(record) => ({
          //   onClick: () => {
          //     setSelectedCashUpSubmission(record);
          //     setReviewDrawerOpen(true);
          //   },
          //   style: { cursor: 'pointer' }
          // })}
          />
        )}
      </Card>

      {/* Policy Receipts Drawer */}
      <PolicyReceiptsDrawer
        open={policyDrawerOpen}
        onClose={() => setPolicyDrawerOpen(false)}
        onSubmitted={fetchCashUpSubmissions}
      />

      {/* Funeral Receipts Drawer */}
      <FuneralReceiptsDrawer
        open={funeralDrawerOpen}
        onClose={() => setFuneralDrawerOpen(false)}
        onSubmitted={fetchCashUpSubmissions}
      />

      {/* Sales Receipts Drawer */}
      <SalesReceiptsDrawer
        open={salesDrawerOpen}
        onClose={() => setSalesDrawerOpen(false)}
        onSubmitted={fetchCashUpSubmissions}
      />
      {/* Audit Review Drawer */}
      <CashUpSubmissionReviewDrawer
        open={reviewDrawerOpen}
        onClose={() => {
          setReviewDrawerOpen(false);
          setSelectedCashUpSubmission(null);
        }}
        cashUpSubmission={selectedCashUpSubmission}
        onUpdated={fetchCashUpSubmissions}
      />

      {/* Weekly Summary Drawer */}
      <WeeklySummaryDrawer
        open={summaryDrawerOpen}
        onClose={() => setSummaryDrawerOpen(false)}
        summary={weeklySummary}
        selectedWeek={selectedWeek}
        onWeekChange={setSelectedWeek}
      />
    </div>
  );
};

export default withRoleGuard(CashUpDashboardPage, [ERoles.Admin, ERoles.Member]); 