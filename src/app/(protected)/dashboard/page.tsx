"use client";

import Link from "next/link";
import React, { useEffect, useState } from "react";

import { ReloadOutlined } from "@ant-design/icons";
import { Avatar, Badge, Card } from "@nextui-org/react";
import { Button } from "antd";
import {
  AlertCircle,
  Banknote,
  CheckCircle,
  ChurchIcon,
  FileText,
  FileWarning,
  HandCoins,
  PenBox,
  ShieldCheck,
  Users,
  XCircle
} from "lucide-react";

import PageHeader from "@/app/components/page-header";
import { CardContent } from "@/app/components/ui/card";

interface DashboardStats {
  userCount: number;
  schemeSocietyCount: number;
  prepaidSocietyCount: number;
  eftTransactionCount: number;
  easypayTransactionCount: number;
  policyCount: number;
  pendingItems: {
    claims: number;
    signupRequests: number;
    cancellationRequests: number;
    eftAllocationRequests: number;
    easypayAllocationRequests: number;
  };
  dailyActivityCompliance: {
    compliantUsers: number;
    nonCompliantUsers: number;
    complianceRate: number;
    totalUsers: number;
    compliantCount: number;
    nonCompliantCount: number;
  };
  cashUpSubmissionCompliance: {
    compliantUsers: number;
    nonCompliantUsers: number;
    complianceRate: number;
    totalUsers: number;
    compliantCount: number;
    nonCompliantCount: number;
  };
  todayActivity: {
    eftTransactions: number;
    easypayTransactions: number;
    claims: number;
    signupRequests: number;
  };
}

interface DailyActivityCompliance {
  compliantUsers: Array<{
    _id: string;
    name: string;
    email: string;
    avatarUrl?: string;
    status: string;
    roles?: string[];
  }>;
  nonCompliantUsers: Array<{
    _id: string;
    name: string;
    email: string;
    avatarUrl?: string;
    status: string;
    roles?: string[];
  }>;
  complianceRate: number;
  totalUsers: number;
  compliantCount: number;
  nonCompliantCount: number;
  expectedSource?: "duty_roster" | "all_active_users";
}

interface DashboardData {
  userCount: number;
  prepaidSocietyCount: number;
  eftTransactionCount: number;
  easypayTransactionCount: number;
  policyCount: number;
  dailyActivityCompliance: DailyActivityCompliance;
  cashUpSubmissionCompliance: DailyActivityCompliance;
}

const chartData = [
  { name: "Mon", EFT: 320, EasyPay: 140 },
  { name: "Tue", EFT: 280, EasyPay: 200 },
  { name: "Wed", EFT: 350, EasyPay: 180 },
  { name: "Thu", EFT: 300, EasyPay: 160 },
  { name: "Fri", EFT: 200, EasyPay: 120 },
];

const recentActivity = [
  { id: 1, text: "User John Dube uploaded EFT statement.", time: "2h ago" },
  { id: 2, text: "Policy #29384 was updated.", time: "5h ago" },
  { id: 3, text: "New user Thandi N. registered.", time: "Today" },
];

const notices = [
  { id: 1, message: "📌 Remember to reconcile all EasyPay uploads by Friday." },
  { id: 2, message: "🛠 Scheduled maintenance: Sunday, 10 PM – 12 AM." },
];

const formatNumber = (num: number) =>
  new Intl.NumberFormat("en-ZA").format(num);

const DashboardPage: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(
    null
  );
  const [loading, setLoading] = useState(false);

  const [showDailyActivityComplianceDetails, setShowDailyActivityComplianceDetails] = useState(false);
  const [showCashUpComplianceDetails, setShowCashUpComplianceDetails] = useState(false);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/dashboard");
      const json = await res.json();
      if (json.success) {
        setStats(json.data);
        setDashboardData(json.data);
      }
    } catch (error) {
      console.error("Failed to fetch dashboard data", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const cardStats = stats
    ? [
      {
        label: "EFT Transactions",
        value: stats.eftTransactionCount,
        icon: <Banknote className="h-5 w-5" />,
        link: "/transactions/eft",
      },
      {
        label: "EasyPay Transactions",
        value: stats.easypayTransactionCount,
        icon: <Banknote className="h-5 w-5" />,
        link: "/transactions/easypay",
      },
      {
        label: "Prepaid Societies (Easipol)",
        value: stats.prepaidSocietyCount,
        icon: <ChurchIcon className="h-5 w-5" />,
        link: "/societies/prepaid",
      },
      {
        label: "Policies (Easipol)",
        value: stats.policyCount,
        icon: <ShieldCheck className="h-5 w-5" />,
        link: "/policies/view",
      },
      {
        label: "Registered Users",
        value: stats.userCount,
        icon: <Users className="h-5 w-5" />,
        link: "/users",
      },
      {
        label: "EFT Allocation Requests",
        value: stats.pendingItems.eftAllocationRequests,
        icon:
          stats.pendingItems.eftAllocationRequests > 0 ? (
            <FileWarning className="h-5 w-5 text-red-500" />
          ) : (
            <HandCoins className="h-5 w-5" />
          ),
        link: "/transactions/eft/allocation-requests",
      },
      {
        label: "EasyPay Allocation Requests",
        value: stats.pendingItems.easypayAllocationRequests,
        icon:
          stats.pendingItems.easypayAllocationRequests > 0 ? (
            <FileWarning className="h-5 w-5 text-red-500" />
          ) : (
            <HandCoins className="h-5 w-5" />
          ),
        link: "/transactions/easypay/allocation-requests",
      },
      {
        label: "Scheme Societies",
        value: stats.schemeSocietyCount,
        icon: <ChurchIcon className="h-5 w-5" />,
        link: "/societies/scheme",
      },
      {
        label: "Signup Requests",
        value: stats.pendingItems.signupRequests,
        icon:
          stats.pendingItems.signupRequests > 0 ? (
            <FileWarning className="h-5 w-5 text-red-500" />
          ) : (
            <PenBox className="h-5 w-5" />
          ),
        link: "/policies/signup-requests",
      },
      {
        label: "Cancellation Requests",
        value: stats.pendingItems.cancellationRequests,
        icon:
          stats.pendingItems.cancellationRequests > 0 ? (
            <FileWarning className="h-5 w-5 text-red-500" />
          ) : (
            <FileText className="h-5 w-5" />
          ),
        link: "/policies/cancellation-requests",
      },
    ]
    : [];

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title="Dashboard Overview"
        subtitle="An overview of statistics and activity aggregated across the company"
        actions={[
          <Button
            key="refresh"
            loading={loading}
            onClick={fetchStats}
            icon={<ReloadOutlined />}
          >
            Refresh
          </Button>,
        ]}
      />

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-5">
        {cardStats.map((item, idx) => (
          <Link href={item.link} key={idx}>
            <Card
              key={idx}
              className="bg-muted border-border border dark:border-[#333]"
            >
              <CardContent className="flex items-center justify-between p-4">
                <div>
                  <p className="text-muted-foreground text-sm">{item.label}</p>
                  <p className="text-xl font-semibold text-foreground">
                    {formatNumber(item.value)}
                  </p>
                </div>
                <div className="text-yellow-500">{item.icon}</div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {dashboardData && <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-2">
        {/* Compliance Rate */}
        <Card className="bg-muted border-border border dark:border-[#333]">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                <h3 className="text-sm font-semibold text-foreground">
                  Overall Compliance Rate
                </h3>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold text-foreground">
                  {dashboardData.dailyActivityCompliance.complianceRate.toFixed(
                    1
                  )}
                  %
                </p>
                <p className="text-muted-foreground text-xs">
                  {dashboardData.dailyActivityCompliance.compliantCount} of{" "}
                  {dashboardData.dailyActivityCompliance.totalUsers} users
                </p>
              </div>
            </div>
            <div className="mt-4 h-2 w-full rounded-full bg-gray-200 dark:bg-gray-700">
              <div
                className="h-2 rounded-full bg-gradient-to-r from-green-500 to-blue-500 transition-all duration-300"
                style={{
                  width: `${dashboardData.dailyActivityCompliance.complianceRate}%`,
                }}
              ></div>
            </div>
            <div className="text-muted-foreground mt-2 text-xs">
              Checking compliance for:{" "}
              {new Date(
                Date.now() - 24 * 60 * 60 * 1000
              ).toLocaleDateString()}{" "}
              (cutoff: 18:00) • Last updated:{" "}
              {new Date().toLocaleDateString()} at{" "}
              {new Date().toLocaleTimeString()}
            </div>
          </CardContent>
        </Card>

        {/* Compliance Rate */}
        <Card className="bg-muted border-border border dark:border-[#333]">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                <h3 className="text-sm font-semibold text-foreground">
                  Overall Compliance Rate
                </h3>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold text-foreground">
                  {dashboardData.cashUpSubmissionCompliance.complianceRate.toFixed(
                    1
                  )}
                  %
                </p>
                <p className="text-muted-foreground text-xs">
                  {dashboardData.cashUpSubmissionCompliance.compliantCount} of{" "}
                  {dashboardData.cashUpSubmissionCompliance.totalUsers} users
                </p>
              </div>
            </div>
            <div className="mt-4 h-2 w-full rounded-full bg-gray-200 dark:bg-gray-700">
              <div
                className="h-2 rounded-full bg-gradient-to-r from-green-500 to-blue-500 transition-all duration-300"
                style={{
                  width: `${dashboardData.cashUpSubmissionCompliance.complianceRate}%`,
                }}
              ></div>
            </div>
            <div className="text-muted-foreground mt-2 text-xs">
              Checking compliance for:{" "}
              {new Date(
                Date.now() - 24 * 60 * 60 * 1000
              ).toLocaleDateString()}{" "}
              (cutoff: 20:00) • Last updated:{" "}
              {new Date().toLocaleDateString()} at{" "}
              {new Date().toLocaleTimeString()}
            </div>
          </CardContent>
        </Card>
      </div>}

      {/* Daily Activity Compliance Section */}
      {dashboardData?.dailyActivityCompliance && showDailyActivityComplianceDetails && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-foreground">
                Daily Activity Compliance
              </h2>
              <p className="text-muted-foreground mt-1 text-sm">
                Based on yesterday's reports (cutoff: 18:00 daily) • Excludes
                admins and inactive users
                {dashboardData.dailyActivityCompliance.expectedSource ===
                  "duty_roster"
                  ? " • Expected users from Duty Roster"
                  : " • Expected users: all active users (no roster)"}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Badge
                content={dashboardData.dailyActivityCompliance.compliantCount}
                color="success"
                className="text-white"
              >
                <div className="flex items-center gap-2 rounded-full bg-green-100 px-3 py-1 dark:bg-green-900">
                  <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                  <span className="text-sm font-medium text-green-700 dark:text-green-300">
                    Compliant
                  </span>
                </div>
              </Badge>
              <Badge
                content={
                  dashboardData.dailyActivityCompliance.nonCompliantCount
                }
                color="danger"
                className="text-white"
              >
                <div className="flex items-center gap-2 rounded-full bg-red-100 px-3 py-1 dark:bg-red-900">
                  <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                  <span className="text-sm font-medium text-red-700 dark:text-red-300">
                    Non-Compliant
                  </span>
                </div>
              </Badge>
            </div>
          </div>

          {<div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Compliant Users */}
            <Card className="bg-muted border-border border dark:border-[#333]">
              <CardContent className="p-4">
                <div className="mb-4 flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                  <h3 className="text-md font-semibold text-foreground">
                    Compliant Users (
                    {dashboardData.dailyActivityCompliance.compliantCount})
                  </h3>
                </div>
                <div className="max-h-64 space-y-3 overflow-y-auto">
                  {dashboardData.dailyActivityCompliance.compliantUsers.length >
                    0 ? (
                    dashboardData.dailyActivityCompliance.compliantUsers.map(
                      (user) => (
                        <div
                          key={user._id}
                          className="flex items-center gap-3 rounded-lg bg-green-50 p-2 dark:bg-green-900/20"
                        >
                          <Avatar
                            src={user.avatarUrl || ""}
                            size="sm"
                            name={user.name}
                            className="flex-shrink-0"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-foreground">
                              {user.name}
                            </p>
                            <p className="text-muted-foreground truncate text-xs">
                              {user.email}
                            </p>
                          </div>
                          <Badge
                            size="sm"
                            color="success"
                            variant="flat"
                            className="flex-shrink-0"
                          >
                            {user.status}
                          </Badge>
                        </div>
                      )
                    )
                  ) : (
                    <div className="text-muted-foreground py-4 text-center">
                      <CheckCircle className="mx-auto mb-2 h-8 w-8 text-green-500" />
                      <p>No compliant users yet</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Non-Compliant Users */}
            <Card className="bg-muted border-border border dark:border-[#333]">
              <CardContent className="p-4">
                <div className="mb-4 flex items-center gap-2">
                  <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                  <h3 className="text-md font-semibold text-foreground">
                    Non-Compliant Users (
                    {dashboardData.dailyActivityCompliance.nonCompliantCount})
                  </h3>
                </div>
                <div className="max-h-64 space-y-3 overflow-y-auto">
                  {dashboardData.dailyActivityCompliance.nonCompliantUsers
                    .length > 0 ? (
                    dashboardData.dailyActivityCompliance.nonCompliantUsers.map(
                      (user) => (
                        <div
                          key={user._id}
                          className="flex items-center gap-3 rounded-lg bg-red-50 p-2 dark:bg-red-900/20"
                        >
                          <Avatar
                            src={user.avatarUrl || ""}
                            size="sm"
                            name={user.name}
                            className="flex-shrink-0"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-foreground">
                              {user.name}
                            </p>
                            <p className="text-muted-foreground truncate text-xs">
                              {user.email}
                            </p>
                          </div>
                          <Badge
                            size="sm"
                            color="danger"
                            variant="flat"
                            className="flex-shrink-0"
                          >
                            {user.status}
                          </Badge>
                        </div>
                      )
                    )
                  ) : (
                    <div className="text-muted-foreground py-4 text-center">
                      <CheckCircle className="mx-auto mb-2 h-8 w-8 text-green-500" />
                      <p>All users are compliant!</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>}
        </div>
      )}

      {/* Cashup Submission Compliance Section */}
      {dashboardData?.cashUpSubmissionCompliance && showCashUpComplianceDetails && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-foreground">
                Cashup Submission Compliance
              </h2>
              <p className="text-muted-foreground mt-1 text-sm">
                Based on yesterday's cashups (cutoff: 20:00 daily) • Cashiers
                only • Excludes admins and inactive users
                {dashboardData.cashUpSubmissionCompliance.expectedSource ===
                  "duty_roster"
                  ? " • Expected users from Duty Roster"
                  : " • Expected users: all active users (no roster)"}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Badge
                content={
                  dashboardData.cashUpSubmissionCompliance.compliantCount
                }
                color="success"
                className="text-white"
              >
                <div className="flex items-center gap-2 rounded-full bg-green-100 px-3 py-1 dark:bg-green-900">
                  <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                  <span className="text-sm font-medium text-green-700 dark:text-green-300">
                    Compliant
                  </span>
                </div>
              </Badge>
              <Badge
                content={
                  dashboardData.cashUpSubmissionCompliance.nonCompliantCount
                }
                color="danger"
                className="text-white"
              >
                <div className="flex items-center gap-2 rounded-full bg-red-100 px-3 py-1 dark:bg-red-900">
                  <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                  <span className="text-sm font-medium text-red-700 dark:text-red-300">
                    Non-Compliant
                  </span>
                </div>
              </Badge>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Compliant Users */}
            <Card className="bg-muted border-border border dark:border-[#333]">
              <CardContent className="p-4">
                <div className="mb-4 flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                  <h3 className="text-md font-semibold text-foreground">
                    Compliant Users (
                    {dashboardData.cashUpSubmissionCompliance.compliantCount})
                  </h3>
                </div>
                <div className="max-h-64 space-y-3 overflow-y-auto">
                  {dashboardData.cashUpSubmissionCompliance.compliantUsers
                    .length > 0 ? (
                    dashboardData.cashUpSubmissionCompliance.compliantUsers.map(
                      (user) => (
                        <div
                          key={user._id}
                          className="flex items-center gap-3 rounded-lg bg-green-50 p-2 dark:bg-green-900/20"
                        >
                          <Avatar
                            src={user.avatarUrl || ""}
                            size="sm"
                            name={user.name}
                            className="flex-shrink-0"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-foreground">
                              {user.name}
                            </p>
                            <p className="text-muted-foreground truncate text-xs">
                              {user.email}
                            </p>
                          </div>
                          <Badge
                            size="sm"
                            color="success"
                            variant="flat"
                            className="flex-shrink-0"
                          >
                            {user.status}
                          </Badge>
                        </div>
                      )
                    )
                  ) : (
                    <div className="text-muted-foreground py-4 text-center">
                      <CheckCircle className="mx-auto mb-2 h-8 w-8 text-green-500" />
                      <p>No compliant users yet</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Non-Compliant Users */}
            <Card className="bg-muted border-border border dark:border-[#333]">
              <CardContent className="p-4">
                <div className="mb-4 flex items-center gap-2">
                  <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                  <h3 className="text-md font-semibold text-foreground">
                    Non-Compliant Users (
                    {dashboardData.cashUpSubmissionCompliance.nonCompliantCount}
                    )
                  </h3>
                </div>
                <div className="max-h-64 space-y-3 overflow-y-auto">
                  {dashboardData.cashUpSubmissionCompliance.nonCompliantUsers
                    .length > 0 ? (
                    dashboardData.cashUpSubmissionCompliance.nonCompliantUsers.map(
                      (user) => (
                        <div
                          key={user._id}
                          className="flex items-center gap-3 rounded-lg bg-red-50 p-2 dark:bg-red-900/20"
                        >
                          <Avatar
                            src={user.avatarUrl || ""}
                            size="sm"
                            name={user.name}
                            className="flex-shrink-0"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-foreground">
                              {user.name}
                            </p>
                            <p className="text-muted-foreground truncate text-xs">
                              {user.email}
                            </p>
                          </div>
                          <Badge
                            size="sm"
                            color="danger"
                            variant="flat"
                            className="flex-shrink-0"
                          >
                            {user.status}
                          </Badge>
                        </div>
                      )
                    )
                  ) : (
                    <div className="text-muted-foreground py-4 text-center">
                      <CheckCircle className="mx-auto mb-2 h-8 w-8 text-green-500" />
                      <p>All users are compliant!</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="col-span-2">
          <CardContent className="p-4">
            <h2 className="mb-4 text-lg font-semibold text-foreground">
              Weekly Transactions
            </h2>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={chartData}>
                <XAxis dataKey="name" stroke="#8884d8" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="EFT" fill="#facc15" radius={[4, 4, 0, 0]} />
                <Bar dataKey="EasyPay" fill="#6b7280" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-4 p-4">
            <h2 className="mb-2 text-lg font-semibold text-foreground">
              Recent Activity
            </h2>
            {recentActivity.map((entry) => (
              <div key={entry.id} className="text-muted-foreground text-sm">
                <p>{entry.text}</p>
                <span className="text-xs text-gray-400">{entry.time}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-4">
          <h2 className="mb-2 text-lg font-semibold text-foreground">
            Admin Notices
          </h2>
          <ul className="list-inside list-disc space-y-1 text-sm text-yellow-700 dark:text-yellow-400">
            {notices.map((notice) => (
              <li key={notice.id}>{notice.message}</li>
            ))}
          </ul>
        </CardContent>
      </Card> */}
    </div>
  );
};

export default DashboardPage;
