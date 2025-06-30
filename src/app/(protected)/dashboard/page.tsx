"use client";

import React, { useEffect, useState } from "react";

import { Card } from "@nextui-org/react";
import {
  BadgeCheck,
  ChurchIcon,
  GroupIcon,
  ScrollText,
  ShieldCheck,
  Users,
} from "lucide-react";
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import PageHeader from "@/app/components/page-header";
import { CardContent } from "@/app/components/ui/card";

interface DashboardStats {
  userCount: number;
  prepaidSocietyCount: number;
  eftTransactionCount: number;
  easypayTransactionCount: number;
  policyCount: number;
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

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch("/api/dashboard");
        const json = await res.json();
        if (json.success) {
          setStats(json.data);
        }
      } catch (error) {
        console.error("Failed to fetch dashboard data", error);
      }
    };

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
      <PageHeader title="Dashboard Overview" />

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
