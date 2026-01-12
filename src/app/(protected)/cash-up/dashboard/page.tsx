"use client";

import { useEffect, useMemo, useState } from "react";

import { AlertOutlined, CheckCircleOutlined, ClockCircleOutlined, ExclamationCircleOutlined, FileTextOutlined, PlusOutlined } from "@ant-design/icons";
import { Alert, Button, Card, Space, Spin, Table, Tag, Tabs, Typography } from "antd";
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
  submissions?: Array<{
    _idx: number;
    invoiceNumber?: string | null;
    paymentMethod?: string | null;
    submittedAmount?: number | null;
    cashAmount?: number | null;
    cardAmount?: number | null;
    bankDepositReference?: string | null;
    bankName?: string | null;
    depositorName?: string | null;
    notes?: string | null;
    submittedAt?: string | null;
    files: string[];
  }>;
  isLateSubmission?: boolean;
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
      case "needs_changes":
        return "orange";
      case "resolved":
        return "blue";
      case "approved":
        return "green";
      case "rejected":
        return "red";
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
      case "needs_changes":
        return "Sent Back";
      case "resolved":
        return "Re-Submitted";
      case "approved":
        return "Approved";
      case "rejected":
        return "Rejected";
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
      case "draft":
        return "default";
      case "pending":
        return "blue";
      case "needs_changes":
        return "orange";
      case "resolved":
        return "blue";
      case "approved":
        return "green";
      case "rejected":
        return "red";
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
  const { awaitingReview, draftCount, sentBackCount, approvedCount, lateCount } = useMemo(() => {
    const n = (s?: string) => (s || "").toLowerCase();
    return {
      awaitingReview: cashUpSubmissions.filter(a => ["pending", "resolved"].includes(n(a.status))).length,
      draftCount: cashUpSubmissions.filter(a => n(a.status) === "draft").length,
      sentBackCount: cashUpSubmissions.filter(a => n(a.status) === "needs_changes").length,
      approvedCount: cashUpSubmissions.filter(a => n(a.status) === "approved").length,
      lateCount: cashUpSubmissions.filter(a => (a as any).isLateSubmission && ["pending", "resolved", "approved", "rejected"].includes(n(a.status))).length,
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
  ];

  const statsCards = [
    {
      title: "Awaiting Review",
      value: awaitingReview,
      icon: <FileTextOutlined />,
      color: "blue",
    },
    {
      title: "Drafts",
      value: draftCount,
      icon: <CheckCircleOutlined />,
      color: "green",
    },
    {
      title: "Sent Back",
      value: sentBackCount,
      icon: <ExclamationCircleOutlined />,
      color: "orange",
    },
    {
      title: "Approved",
      value: approvedCount,
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

  const today = dayjs().format("YYYY-MM-DD");

  const currentSubmission = useMemo(() => {
    // Prefer an "open" submission for today, else any for today, else null
    const isOpen = (s?: string) => ["draft", "needs_changes"].includes(norm(s));
    const todays = cashUpSubmissions.filter((s) => s.date === today);
    return (
      todays.find((s) => isOpen(s.status)) ||
      todays.find((s) => isOpen(s.submissionStatus)) ||
      todays[0] ||
      null
    );
  }, [cashUpSubmissions, today]);

  const previousSubmissions = useMemo(() => {
    if (!currentSubmission) return cashUpSubmissions;
    return cashUpSubmissions.filter((s) => s._id !== currentSubmission._id);
  }, [cashUpSubmissions, currentSubmission]);

  // Check if the user has the user submitted today?
  const hasSubmittedToday = cashUpSubmissions.some(
    a => a.date === today && ["pending", "resolved", "approved", "rejected"].includes(norm(a.status))
  );

  // Calculate the time remaining until the submission deadline in minutes
  const cutoff = dayjs().hour(20).minute(0).second(0);
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
        <CashUpCountdown cutOffTime={"20:00:00"} />
      </div>

      {/* Current vs Previous */}
      <Tabs
        defaultActiveKey="current"
        items={[
          {
            key: "current",
            label: "Current Submission",
            children: (
              <Card
                size="small"
                title={<span>Current Submission ({today})</span>}
                extra={
                  currentSubmission &&
                  ["draft", "needs_changes"].includes(norm(currentSubmission.status)) &&
                  isOwner(currentSubmission) && (
                    <Button type="primary" className="text-black uppercase" onClick={() => submitForReview(currentSubmission)}>
                      Submit for Review
                    </Button>
                  )
                }
              >
                {loading ? (
                  <div className="flex justify-center py-8">
                    <Spin size="large" />
                  </div>
                ) : !currentSubmission ? (
                  <Alert
                    type="info"
                    showIcon
                    message="No current submission"
                    description="Upload receipts (Policy/Funeral/Sales) to start today’s cash-up."
                  />
                ) : (
                  <div className="space-y-4">
                    <div className="flex flex-wrap gap-3">
                      <Tag color={getStatusColor(currentSubmission.status)} className="uppercase">
                        {getStatusText(currentSubmission.status)}
                      </Tag>
                      {!!currentSubmission.isLateSubmission && <Tag color="red">LATE</Tag>}
                      <Tag color="blue">Total: {formatCurrency(currentSubmission.batchReceiptTotal ?? 0)}</Tag>
                    </div>

                    <Table
                      size="small"
                      rowKey={(r) => String(r._idx)}
                      dataSource={(currentSubmission.submissions || []).map((s) => ({
                        ...s,
                        attachmentsCount: Array.isArray(s.files) ? s.files.length : 0,
                      }))}
                      columns={[
                        {
                          title: "#",
                          dataIndex: "_idx",
                          key: "_idx",
                          width: 60,
                          render: (v: number) => v + 1,
                        },
                        {
                          title: "Invoice",
                          dataIndex: "invoiceNumber",
                          key: "invoiceNumber",
                          render: (v: string) => v || "—",
                        },
                        {
                          title: "Payment",
                          dataIndex: "paymentMethod",
                          key: "paymentMethod",
                          render: (v: string) => (v ? String(v).replace("_", " ") : "—"),
                        },
                        {
                          title: "Amount",
                          dataIndex: "submittedAmount",
                          key: "submittedAmount",
                          align: "right",
                          render: (v: number) => (v === null || v === undefined ? "—" : formatCurrency(Number(v))),
                        },
                        {
                          title: "Notes",
                          dataIndex: "notes",
                          key: "notes",
                          render: (v: string) => v || "—",
                        },
                        {
                          title: "Submitted",
                          dataIndex: "submittedAt",
                          key: "submittedAt",
                          render: (v: string) => (v ? dayjs(v).format("DD MMM HH:mm") : "—"),
                        },
                        {
                          title: "Files",
                          dataIndex: "attachmentsCount",
                          key: "attachmentsCount",
                          align: "center",
                          render: (v: number, r: any) => (
                            <span>{v || 0}</span>
                          ),
                        },
                      ]}
                      pagination={false}
                      locale={{ emptyText: "No receipt entries yet for the current submission." }}
                    />
                  </div>
                )}
              </Card>
            ),
          },
          {
            key: "previous",
            label: "Previous Submissions",
            children: (
              <Card size="small">
                <div className="mb-4">
                  <Title level={4}>Previous Submissions</Title>
                </div>
                {loading ? (
                  <div className="flex justify-center py-8">
                    <Spin size="large" />
                  </div>
                ) : (
                  <Table
                    dataSource={previousSubmissions}
                    columns={columns as ColumnType<ICashUpSubmission>[]}
                    rowKey="_id"
                    pagination={{
                      pageSize: 10,
                      showSizeChanger: true,
                      showQuickJumper: true,
                    }}
                    locale={{ emptyText: "No previous submissions." }}
                  />
                )}
              </Card>
            ),
          },
        ]}
      />

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

export default withRoleGuard(CashUpDashboardPage, Object.values(ERoles) as unknown as string[]); 