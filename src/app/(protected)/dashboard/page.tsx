"use client";

import React, { useEffect, useState } from "react";

import { Avatar, Badge, Button, Card } from "@nextui-org/react";
import {
  AlertCircle,
  BadgeCheck,
  CheckCircle,
  ChurchIcon,
  RefreshCw,
  ScrollText,
  ShieldCheck,
  Users,
  XCircle
} from "lucide-react";

import PageHeader from "@/app/components/page-header";
import { CardContent } from "@/app/components/ui/card";
import { useToast } from "@/app/hooks/use-toast";

interface DashboardStats {
  userCount: number;
  prepaidSocietyCount: number;
  eftTransactionCount: number;
  easypayTransactionCount: number;
  policyCount: number;
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
}

interface DashboardData {
  userCount: number;
  prepaidSocietyCount: number;
  eftTransactionCount: number;
  easypayTransactionCount: number;
  policyCount: number;
  dailyActivityCompliance: DailyActivityCompliance;
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
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

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
        icon: <BadgeCheck className="h-5 w-5" />,
      },
      {
        label: "EasyPay Transactions",
        value: stats.easypayTransactionCount,
        icon: <ScrollText className="h-5 w-5" />,
      },
      {
        label: "Prepaid Societies (Easipol)",
        value: stats.prepaidSocietyCount,
        icon: <ChurchIcon className="h-5 w-5" />,
      },
      {
        label: "Policies (Easipol)",
        value: stats.policyCount,
        icon: <ShieldCheck className="h-5 w-5" />,
      },
      {
        label: "Registered Users",
        value: stats.userCount,
        icon: <Users className="h-5 w-5" />,
      },
    ]
    : [];

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title="Dashboard Overview"
        actions={[
          <Button
            key="refresh"
            color="primary"
            variant="flat"
            size="sm"
            isLoading={loading}
            onPress={fetchStats}
            startContent={<RefreshCw className="h-4 w-4" />}
          >
            Refresh
          </Button>
        ]}
      />

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-5">
        {cardStats.map((item, idx) => (
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
        ))}
      </div>

      {/* Daily Activity Compliance Section */}
      {dashboardData?.dailyActivityCompliance && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-foreground">
                Daily Activity Compliance
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Based on yesterday's reports (cutoff: 18:00 daily) • Excludes admins and inactive users
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Badge
                content={dashboardData.dailyActivityCompliance.compliantCount}
                color="success"
                className="text-white"
              >
                <div className="flex items-center gap-2 px-3 py-1 bg-green-100 dark:bg-green-900 rounded-full">
                  <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                  <span className="text-sm font-medium text-green-700 dark:text-green-300">
                    Compliant
                  </span>
                </div>
              </Badge>
              <Badge
                content={dashboardData.dailyActivityCompliance.nonCompliantCount}
                color="danger"
                className="text-white"
              >
                <div className="flex items-center gap-2 px-3 py-1 bg-red-100 dark:bg-red-900 rounded-full">
                  <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                  <span className="text-sm font-medium text-red-700 dark:text-red-300">
                    Non-Compliant
                  </span>
                </div>
              </Badge>
              {dashboardData.dailyActivityCompliance.nonCompliantCount > 0 && (
                <Button
                  color="warning"
                  size="sm"
                  variant="flat"
                  className="text-white"
                  startContent={
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z" />
                    </svg>
                  }
                  onClick={async () => {
                    try {
                      const response = await fetch("/api/daily-activity-reminders", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ action: "trigger" }),
                      });

                      const data = await response.json();

                      if (data.success) {
                        let description = `Successfully sent ${data.data.remindersSent} reminders`;
                        if (data.data.discordNotificationSent) {
                          description += " • Discord notification sent";
                        } else if (data.data.remindersSent > 0) {
                          description += " • Discord notification failed";
                        }

                        toast({
                          title: "Reminders Sent",
                          description,
                          variant: "default",
                        });

                        // Refresh dashboard data
                        fetchStats();
                      } else {
                        toast({
                          title: "Error",
                          description: `Failed to send reminders: ${data.message}`,
                          variant: "destructive",
                        });
                      }
                    } catch (error) {
                      console.error("Error sending reminders:", error);
                      toast({
                        title: "Error",
                        description: "Failed to send reminders",
                        variant: "destructive",
                      });
                    }
                  }}
                >
                  Send Reminders
                </Button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Compliant Users */}
            <Card className="bg-muted border-border border dark:border-[#333]">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-4">
                  <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                  <h3 className="text-lg font-semibold text-foreground">
                    Compliant Users ({dashboardData.dailyActivityCompliance.compliantCount})
                  </h3>
                </div>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {dashboardData.dailyActivityCompliance.compliantUsers.length > 0 ? (
                    dashboardData.dailyActivityCompliance.compliantUsers.map((user) => (
                      <div key={user._id} className="flex items-center gap-3 p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
                        <Avatar
                          src={user.avatarUrl || ""}
                          size="sm"
                          name={user.name}
                          className="flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">
                            {user.name}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
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
                    ))
                  ) : (
                    <div className="text-center py-4 text-muted-foreground">
                      <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
                      <p>No compliant users yet</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Non-Compliant Users */}
            <Card className="bg-muted border-border border dark:border-[#333]">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-4">
                  <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                  <h3 className="text-lg font-semibold text-foreground">
                    Non-Compliant Users ({dashboardData.dailyActivityCompliance.nonCompliantCount})
                  </h3>
                </div>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {dashboardData.dailyActivityCompliance.nonCompliantUsers.length > 0 ? (
                    dashboardData.dailyActivityCompliance.nonCompliantUsers.map((user) => (
                      <div key={user._id} className="flex items-center gap-3 p-2 bg-red-50 dark:bg-red-900/20 rounded-lg">
                        <Avatar
                          src={user.avatarUrl || ""}
                          size="sm"
                          name={user.name}
                          className="flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">
                            {user.name}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
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
                    ))
                  ) : (
                    <div className="text-center py-4 text-muted-foreground">
                      <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
                      <p>All users are compliant!</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Compliance Rate */}
          <Card className="bg-muted border-border border dark:border-[#333]">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  <h3 className="text-lg font-semibold text-foreground">
                    Overall Compliance Rate
                  </h3>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-foreground">
                    {dashboardData.dailyActivityCompliance.complianceRate.toFixed(1)}%
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {dashboardData.dailyActivityCompliance.compliantCount} of {dashboardData.dailyActivityCompliance.totalUsers} users
                  </p>
                </div>
              </div>
              <div className="mt-4 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-green-500 to-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${dashboardData.dailyActivityCompliance.complianceRate}%` }}
                ></div>
              </div>
              <div className="mt-2 text-xs text-muted-foreground">
                Checking compliance for: {new Date(Date.now() - 24 * 60 * 60 * 1000).toLocaleDateString()} (cutoff: 18:00) •
                Last updated: {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}
              </div>
            </CardContent>
          </Card>
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
