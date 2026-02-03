"use client";

import React, { useState } from "react";

import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  UserOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import {
  Alert,
  Button,
  Card,
  Col,
  DatePicker,
  Drawer,
  Progress,
  Row,
  Space,
  Statistic,
  Table,
  Tag,
  Typography,
} from "antd";
import dayjs from "dayjs";

const { Title, Text } = Typography;

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

interface RepeatOffender {
  employeeId: string;
  employeeName: string;
  discrepancyCount: number;
  lateSubmissionCount: number;
  totalIssues: number;
  lastIssueDate: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  summary: WeeklySummary | null;
  selectedWeek: string;
  onWeekChange: (week: string) => void;
}

const WeeklySummaryDrawer: React.FC<Props> = ({
  open,
  onClose,
  summary,
  selectedWeek,
  onWeekChange,
}) => {
  const [loading, setLoading] = useState(false);
  const [repeatOffenders, setRepeatOffenders] = useState<RepeatOffender[]>([]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-ZA", {
      style: "currency",
      currency: "ZAR",
    }).format(amount);
  };

  const getBalanceRate = () => {
    if (!summary || summary.totalStaffAudited === 0) return 0;
    return Math.round(
      (summary.fullyBalanced / summary.totalStaffAudited) * 100
    );
  };

  const getSubmissionRate = () => {
    if (!summary || summary.totalStaffAudited === 0) return 0;
    const totalSubmissions =
      summary.onTimeSubmissions + summary.lateSubmissions;
    return Math.round((totalSubmissions / summary.totalStaffAudited) * 100);
  };

  const getRiskLevelColor = (count: number) => {
    if (count === 0) return "green";
    if (count <= 2) return "orange";
    return "red";
  };

  const summaryColumns = [
    {
      title: "Metric",
      dataIndex: "metric",
      key: "metric",
      render: (text: string) => <Text className="font-medium">{text}</Text>,
    },
    {
      title: "Count",
      dataIndex: "count",
      key: "count",
      render: (count: number) => (
        <Text className="text-lg font-semibold">{count}</Text>
      ),
    },
    {
      title: "Percentage",
      dataIndex: "percentage",
      key: "percentage",
      render: (percentage: number) => (
        <div className="flex items-center gap-2">
          <Progress
            percent={percentage}
            size="small"
            showInfo={false}
            strokeColor={
              percentage >= 80
                ? "#52c41a"
                : percentage >= 60
                  ? "#faad14"
                  : "#ff4d4f"
            }
          />
          <Text className="text-sm">{percentage}%</Text>
        </div>
      ),
    },
  ];

  const repeatOffenderColumns = [
    {
      title: "Employee",
      dataIndex: "employeeName",
      key: "employeeName",
      render: (text: string) => (
        <div className="flex items-center gap-2">
          <UserOutlined />
          <Text className="font-medium">{text}</Text>
        </div>
      ),
    },
    {
      title: "Discrepancies",
      dataIndex: "discrepancyCount",
      key: "discrepancyCount",
      render: (count: number) => (
        <Tag color={getRiskLevelColor(count)}>{count} issues</Tag>
      ),
    },
    {
      title: "Late Submissions",
      dataIndex: "lateSubmissionCount",
      key: "lateSubmissionCount",
      render: (count: number) => (
        <Tag color={getRiskLevelColor(count)}>{count} late</Tag>
      ),
    },
    {
      title: "Total Issues",
      dataIndex: "totalIssues",
      key: "totalIssues",
      render: (count: number) => (
        <Tag color={getRiskLevelColor(count)}>{count} total</Tag>
      ),
    },
    {
      title: "Last Issue",
      dataIndex: "lastIssueDate",
      key: "lastIssueDate",
      render: (date: string) => dayjs(date).format("DD MMM"),
    },
  ];

  const summaryData = summary
    ? [
        {
          key: "balanced",
          metric: "Fully Balanced",
          count: summary.fullyBalanced,
          percentage: getBalanceRate(),
        },
        {
          key: "submissions",
          metric: "On-Time Submissions",
          count: summary.onTimeSubmissions,
          percentage: getSubmissionRate(),
        },
        {
          key: "discrepancies",
          metric: "Discrepancies Found",
          count: summary.discrepanciesFound,
          percentage:
            summary.totalStaffAudited > 0
              ? Math.round(
                  (summary.discrepanciesFound / summary.totalStaffAudited) * 100
                )
              : 0,
        },
        {
          key: "late",
          metric: "Late Submissions",
          count: summary.lateSubmissions,
          percentage:
            summary.totalStaffAudited > 0
              ? Math.round(
                  (summary.lateSubmissions / summary.totalStaffAudited) * 100
                )
              : 0,
        },
      ]
    : [];

  return (
    <Drawer
      title="Weekly Audit Summary"
      placement="right"
      width="70%"
      open={open}
      onClose={onClose}
      footer={
        <Space>
          <Button onClick={onClose}>Close</Button>
          <Button type="primary">Export Report</Button>
        </Space>
      }
    >
      <div className="space-y-6">
        {/* Week Selector */}
        <div className="flex items-center justify-between">
          <Title level={4}>
            Week of {dayjs(selectedWeek).format("DD MMM YYYY")}
          </Title>
          <DatePicker
            picker="week"
            value={dayjs(selectedWeek)}
            onChange={(date) => {
              if (date) {
                onWeekChange(date.format("YYYY-MM-DD"));
              }
            }}
          />
        </div>

        {!summary ? (
          <div className="py-8 text-center">
            <Text className="text-gray-500">
              No data available for this week
            </Text>
          </div>
        ) : (
          <>
            {/* Key Metrics */}
            <Row gutter={16}>
              <Col xs={24} sm={12} lg={6}>
                <Card>
                  <Statistic
                    title="Total Staff Audited"
                    value={summary.totalStaffAudited}
                    prefix={<UserOutlined />}
                    valueStyle={{ color: "#1890ff" }}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <Card>
                  <Statistic
                    title="Fully Balanced"
                    value={summary.fullyBalanced}
                    prefix={<CheckCircleOutlined />}
                    valueStyle={{ color: "#52c41a" }}
                    suffix={`/ ${summary.totalStaffAudited}`}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <Card>
                  <Statistic
                    title="Discrepancies"
                    value={summary.discrepanciesFound}
                    prefix={<ExclamationCircleOutlined />}
                    valueStyle={{ color: "#ff4d4f" }}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <Card>
                  <Statistic
                    title="Late Submissions"
                    value={summary.lateSubmissions}
                    prefix={<ClockCircleOutlined />}
                    valueStyle={{ color: "#faad14" }}
                  />
                </Card>
              </Col>
            </Row>

            {/* Progress Indicators */}
            <Row gutter={16}>
              <Col xs={24} lg={12}>
                <Card title="Balance Rate">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Text>Fully Balanced</Text>
                      <Text className="font-semibold">{getBalanceRate()}%</Text>
                    </div>
                    <Progress
                      percent={getBalanceRate()}
                      strokeColor={
                        getBalanceRate() >= 80
                          ? "#52c41a"
                          : getBalanceRate() >= 60
                            ? "#faad14"
                            : "#ff4d4f"
                      }
                      showInfo={false}
                    />
                    <Text className="text-xs text-gray-500">
                      {summary.fullyBalanced} out of {summary.totalStaffAudited}{" "}
                      staff members
                    </Text>
                  </div>
                </Card>
              </Col>
              <Col xs={24} lg={12}>
                <Card title="Submission Rate">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Text>On-Time Submissions</Text>
                      <Text className="font-semibold">
                        {getSubmissionRate()}%
                      </Text>
                    </div>
                    <Progress
                      percent={getSubmissionRate()}
                      strokeColor={
                        getSubmissionRate() >= 80
                          ? "#52c41a"
                          : getSubmissionRate() >= 60
                            ? "#faad14"
                            : "#ff4d4f"
                      }
                      showInfo={false}
                    />
                    <Text className="text-xs text-gray-500">
                      {summary.onTimeSubmissions} out of{" "}
                      {summary.totalStaffAudited} staff members
                    </Text>
                  </div>
                </Card>
              </Col>
            </Row>

            {/* Risk Alerts */}
            {(summary.highRiskDiscrepancies > 0 ||
              summary.repeatOffenders > 0) && (
              <div className="space-y-4">
                <Title level={4}>Risk Alerts</Title>

                {summary.highRiskDiscrepancies > 0 && (
                  <Alert
                    message="High Risk Discrepancies"
                    description={`${summary.highRiskDiscrepancies} high-risk discrepancies detected this week. These require immediate attention.`}
                    type="error"
                    showIcon
                    icon={<WarningOutlined />}
                  />
                )}

                {summary.repeatOffenders > 0 && (
                  <Alert
                    message="Repeat Offenders"
                    description={`${summary.repeatOffenders} employees have multiple issues in the past 30 days. Consider additional training or disciplinary action.`}
                    type="warning"
                    showIcon
                    icon={<ExclamationCircleOutlined />}
                  />
                )}
              </div>
            )}

            {/* Detailed Summary Table */}
            <Card title="Detailed Summary">
              <Table
                dataSource={summaryData}
                columns={summaryColumns}
                pagination={false}
                size="small"
              />
            </Card>

            {/* Repeat Offenders Table */}
            {summary.repeatOffenders > 0 && (
              <Card title="Repeat Offenders (Last 30 Days)">
                <Table
                  dataSource={repeatOffenders}
                  columns={repeatOffenderColumns}
                  pagination={false}
                  size="small"
                />
              </Card>
            )}

            {/* Recommendations */}
            <Card title="Recommendations">
              <div className="space-y-3">
                {summary.discrepanciesFound > 0 && (
                  <div className="flex items-start gap-3">
                    <ExclamationCircleOutlined className="mt-1 text-orange-500" />
                    <div>
                      <Text className="font-medium">Address Discrepancies</Text>
                      <div className="text-sm text-gray-500">
                        {summary.discrepanciesFound} discrepancies found. Review
                        and resolve these issues promptly.
                      </div>
                    </div>
                  </div>
                )}

                {summary.lateSubmissions > 0 && (
                  <div className="flex items-start gap-3">
                    <ClockCircleOutlined className="mt-1 text-orange-500" />
                    <div>
                      <Text className="font-medium">
                        Improve Submission Timeliness
                      </Text>
                      <div className="text-sm text-gray-500">
                        {summary.lateSubmissions} late submissions. Consider
                        reminders or training on submission deadlines.
                      </div>
                    </div>
                  </div>
                )}

                {summary.repeatOffenders > 0 && (
                  <div className="flex items-start gap-3">
                    <WarningOutlined className="mt-1 text-red-500" />
                    <div>
                      <Text className="font-medium">
                        Address Repeat Offenders
                      </Text>
                      <div className="text-sm text-gray-500">
                        {summary.repeatOffenders} employees with multiple
                        issues. Consider additional training or disciplinary
                        measures.
                      </div>
                    </div>
                  </div>
                )}

                {getBalanceRate() >= 90 && (
                  <div className="flex items-start gap-3">
                    <CheckCircleOutlined className="mt-1 text-green-500" />
                    <div>
                      <Text className="font-medium">Excellent Performance</Text>
                      <div className="text-sm text-gray-500">
                        {getBalanceRate()}% balance rate is excellent. Keep up
                        the good work!
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </>
        )}
      </div>
    </Drawer>
  );
};

export default WeeklySummaryDrawer;
