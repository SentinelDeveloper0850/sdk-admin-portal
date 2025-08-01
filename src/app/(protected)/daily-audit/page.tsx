"use client";

import { useEffect, useState } from "react";

import { CheckCircleOutlined, ClockCircleOutlined, ExclamationCircleOutlined, FileTextOutlined, UploadOutlined } from "@ant-design/icons";
import { Button, Card, Col, Row, Space, Spin, Table, Tag, Typography } from "antd";
import dayjs from "dayjs";

import PageHeader from "@/app/components/page-header";
import { useAuth } from "@/context/auth-context";
import { withRoleGuard } from "@/utils/utils/with-role-guard";
import { ERoles } from "../../../../types/roles.enum";

import AuditReviewDrawer from "@/app/components/daily-audit/audit-review-drawer";
import UploadReceiptsDrawer from "@/app/components/daily-audit/upload-receipts-drawer";
import WeeklySummaryDrawer from "@/app/components/daily-audit/weekly-summary-drawer";

const { Title, Text } = Typography;

interface DailyAudit {
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

const DailyAuditPage = () => {
  const { user } = useAuth();
  const [audits, setAudits] = useState<DailyAudit[]>([]);
  const [weeklySummary, setWeeklySummary] = useState<WeeklySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploadDrawerOpen, setUploadDrawerOpen] = useState(false);
  const [reviewDrawerOpen, setReviewDrawerOpen] = useState(false);
  const [summaryDrawerOpen, setSummaryDrawerOpen] = useState(false);
  const [selectedAudit, setSelectedAudit] = useState<DailyAudit | null>(null);
  const [selectedWeek, setSelectedWeek] = useState(dayjs().format('YYYY-MM-DD'));

  const fetchAudits = async () => {
    setLoading(true);
    try {
      const url = user?.role === "admin"
        ? "/api/audit"
        : `/api/audit?employeeId=${user?._id}`;

      const res = await fetch(url);
      const json = await res.json();

      if (json.success) {
        setAudits(json.audits);
      }
    } catch (error) {
      console.error("Failed to fetch audits:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchWeeklySummary = async (week: string) => {
    try {
      const res = await fetch(`/api/audit/summary?week=${week}`);
      const json = await res.json();

      if (json.success) {
        setWeeklySummary(json.summary);
      }
    } catch (error) {
      console.error("Failed to fetch weekly summary:", error);
    }
  };

  useEffect(() => {
    fetchAudits();
    fetchWeeklySummary(selectedWeek);
  }, [user, selectedWeek]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Balanced":
        return "green";
      case "Short":
        return "red";
      case "Over":
        return "orange";
      case "Awaiting System Balance":
        return "blue";
      case "Missing Batch Receipt":
        return "red";
      default:
        return "default";
    }
  };

  const getSubmissionStatusColor = (status: string) => {
    switch (status) {
      case "Submitted":
        return "green";
      case "Submitted Late (Grace Period)":
        return "orange";
      case "Submitted Late":
        return "red";
      case "Not Submitted":
        return "red";
      default:
        return "default";
    }
  };

  const getRiskLevelColor = (riskLevel: string) => {
    switch (riskLevel) {
      case "high":
        return "red";
      case "medium":
        return "orange";
      case "low":
        return "green";
      default:
        return "default";
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR'
    }).format(amount);
  };

  const columns = [
    {
      title: "Employee",
      dataIndex: "employeeName",
      key: "employeeName",
      render: (text: string, record: DailyAudit) => (
        <div>
          <div className="font-medium">{text}</div>
          <div className="text-xs text-gray-500">{dayjs(record.date).format('DD MMM YYYY')}</div>
        </div>
      ),
    },
    {
      title: "Receipt Total",
      dataIndex: "batchReceiptTotal",
      key: "batchReceiptTotal",
      render: (amount: number) => amount ? formatCurrency(amount) : "--",
    },
    {
      title: "System Balance",
      dataIndex: "systemBalance",
      key: "systemBalance",
      render: (amount: number) => amount ? formatCurrency(amount) : "--",
    },
    {
      title: "Discrepancy",
      dataIndex: "discrepancy",
      key: "discrepancy",
      render: (amount: number, record: DailyAudit) => {
        if (!record.batchReceiptTotal || !record.systemBalance) return "--";
        const color = amount === 0 ? "green" : amount > 0 ? "orange" : "red";
        return (
          <Tag color={color}>
            {amount > 0 ? "+" : ""}{formatCurrency(amount)}
          </Tag>
        );
      },
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status: string) => (
        <Tag color={getStatusColor(status)}>
          {status}
        </Tag>
      ),
    },
    {
      title: "Submission",
      dataIndex: "submissionStatus",
      key: "submissionStatus",
      render: (status: string, record: DailyAudit) => (
        <div>
          <Tag color={getSubmissionStatusColor(status)}>
            {status}
          </Tag>
          {record.submittedAt && (
            <div className="text-xs text-gray-500 mt-1">
              {dayjs(record.submittedAt).format('HH:mm')}
            </div>
          )}
        </div>
      ),
    },
    {
      title: "Risk Level",
      dataIndex: "riskLevel",
      key: "riskLevel",
      render: (riskLevel: string) => (
        <Tag color={getRiskLevelColor(riskLevel)}>
          {riskLevel.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_: any, record: DailyAudit) => (
        <Space>
          <Button
            size="small"
            onClick={() => {
              setSelectedAudit(record);
              setReviewDrawerOpen(true);
            }}
          >
            Review
          </Button>
        </Space>
      ),
    },
  ];

  const statsCards = [
    {
      title: "Total Audits",
      value: audits.length,
      icon: <FileTextOutlined />,
      color: "blue",
    },
    {
      title: "Balanced",
      value: audits.filter(a => a.status === "Balanced").length,
      icon: <CheckCircleOutlined />,
      color: "green",
    },
    {
      title: "Discrepancies",
      value: audits.filter(a => a.status === "Short" || a.status === "Over").length,
      icon: <ExclamationCircleOutlined />,
      color: "red",
    },
    {
      title: "Late Submissions",
      value: audits.filter(a => a.submissionStatus.includes("Late")).length,
      icon: <ClockCircleOutlined />,
      color: "orange",
    },
  ];

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title="Daily Audit"
        subtitle="Monitor and manage daily receipt submissions and reconciliations"
        actions={[
          <Space key="actions">
            {user?.role !== "admin" && (
              <Button
                type="primary"
                icon={<UploadOutlined />}
                onClick={() => setUploadDrawerOpen(true)}
              >
                Upload Receipts
              </Button>
            )}
            <Button
              onClick={() => setSummaryDrawerOpen(true)}
            >
              Weekly Summary
            </Button>
          </Space>
        ]}
      />

      {/* Stats Cards */}
      <Row gutter={16}>
        {statsCards.map((card, index) => (
          <Col xs={24} sm={12} lg={6} key={index}>
            <Card>
              <div className="flex items-center justify-between">
                <div>
                  <Text className="text-gray-500">{card.title}</Text>
                  <div className="text-2xl font-bold">{card.value}</div>
                </div>
                <div className={`text-2xl text-${card.color}-500`}>
                  {card.icon}
                </div>
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      {/* Daily Cutoff Timer */}
      <Card>
        <div className="flex items-center justify-between">
          <div>
            <Title level={5}>Daily Submission Deadline</Title>
            <Text className="text-gray-500">
              All receipts must be submitted by 8:00 PM daily
            </Text>
          </div>
          <div className="text-right">
            <div className="text-lg font-mono">
              {dayjs().format('HH:mm:ss')}
            </div>
            <Text className="text-xs text-gray-500">
              {dayjs().format('DD MMM YYYY')}
            </Text>
          </div>
        </div>
      </Card>

      {/* Audits Table */}
      <Card>
        <div className="mb-4">
          <Title level={4}>Daily Audit Records</Title>
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <Spin size="large" />
          </div>
        ) : (
          <Table
            dataSource={audits}
            columns={columns}
            rowKey="_id"
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
            }}
            onRow={(record) => ({
              onClick: () => {
                setSelectedAudit(record);
                setReviewDrawerOpen(true);
              },
              style: { cursor: 'pointer' }
            })}
          />
        )}
      </Card>

      {/* Upload Receipts Drawer */}
      <UploadReceiptsDrawer
        open={uploadDrawerOpen}
        onClose={() => setUploadDrawerOpen(false)}
        onSubmitted={fetchAudits}
      />

      {/* Audit Review Drawer */}
      <AuditReviewDrawer
        open={reviewDrawerOpen}
        onClose={() => {
          setReviewDrawerOpen(false);
          setSelectedAudit(null);
        }}
        audit={selectedAudit}
        onUpdated={fetchAudits}
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

export default withRoleGuard(DailyAuditPage, [ERoles.Admin, ERoles.Member]); 