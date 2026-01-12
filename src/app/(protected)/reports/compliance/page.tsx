"use client";

import { useEffect, useMemo, useState } from "react";

import { Card, Spin, Table, Tabs, Typography } from "antd";

import PageHeader from "@/app/components/page-header";
import { withRoleGuard } from "@/utils/utils/with-role-guard";
import { ERoles } from "@/types/roles.enum";

const { Text } = Typography;

type ComplianceUser = {
  _id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  status: string;
  roles?: string[];
};

type ComplianceBlock = {
  compliantUsers: ComplianceUser[];
  nonCompliantUsers: ComplianceUser[];
  complianceRate: number;
  totalUsers: number;
  compliantCount: number;
  nonCompliantCount: number;
};

type DashboardResponse = {
  success: boolean;
  data?: {
    dailyActivityCompliance?: ComplianceBlock;
    cashUpSubmissionCompliance?: ComplianceBlock;
  };
  message?: string;
};

function UsersTable(props: { users: ComplianceUser[] }) {
  const columns = useMemo(
    () => [
      {
        title: "Name",
        dataIndex: "name",
        key: "name",
      },
      {
        title: "Email",
        dataIndex: "email",
        key: "email",
      },
      {
        title: "Status",
        dataIndex: "status",
        key: "status",
      },
    ],
    []
  );

  return (
    <Table
      size="small"
      rowKey="_id"
      dataSource={props.users}
      columns={columns as any}
      pagination={{ pageSize: 15, showSizeChanger: true }}
      locale={{ emptyText: "No users." }}
    />
  );
}

function ComplianceSection(props: { title: string; subtitle: string; block?: ComplianceBlock }) {
  const b = props.block;
  if (!b) return null;

  return (
    <Card size="small" className="bg-white dark:bg-zinc-900">
      <div className="flex flex-col gap-1 mb-3">
        <div className="text-base font-semibold">{props.title}</div>
        <Text type="secondary">{props.subtitle}</Text>
      </div>

      <div className="flex flex-wrap gap-6 mb-4">
        <div>
          <div className="text-xs text-gray-500">Compliance rate</div>
          <div className="text-2xl font-bold">{b.complianceRate.toFixed(1)}%</div>
          <div className="text-xs text-gray-500">
            {b.compliantCount} of {b.totalUsers} users
          </div>
        </div>
        <div>
          <div className="text-xs text-gray-500">Compliant</div>
          <div className="text-2xl font-bold">{b.compliantCount}</div>
        </div>
        <div>
          <div className="text-xs text-gray-500">Non-compliant</div>
          <div className="text-2xl font-bold">{b.nonCompliantCount}</div>
        </div>
      </div>

      <Tabs
        defaultActiveKey="noncompliant"
        items={[
          {
            key: "noncompliant",
            label: `Non-compliant (${b.nonCompliantCount})`,
            children: <UsersTable users={b.nonCompliantUsers} />,
          },
          {
            key: "compliant",
            label: `Compliant (${b.compliantCount})`,
            children: <UsersTable users={b.compliantUsers} />,
          },
        ]}
      />
    </Card>
  );
}

function ComplianceReportingPage() {
  const [loading, setLoading] = useState(true);
  const [dailyActivity, setDailyActivity] = useState<ComplianceBlock | undefined>(undefined);
  const [cashup, setCashup] = useState<ComplianceBlock | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);

  const fetchCompliance = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/dashboard", { cache: "no-store" });
      const json = (await res.json()) as DashboardResponse;
      if (!json?.success || !json?.data) {
        throw new Error(json?.message || "Failed to load compliance data");
      }
      setDailyActivity(json.data.dailyActivityCompliance);
      setCashup(json.data.cashUpSubmissionCompliance);
    } catch (e: any) {
      setError(e?.message || "Failed to load compliance data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompliance();
  }, []);

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title="Compliance Reporting"
        subtitle="Operational compliance across key modules (yesterday)"
        actions={[]}
      />

      {loading ? (
        <div className="flex justify-center py-10">
          <Spin />
        </div>
      ) : error ? (
        <Card size="small">
          <div className="text-red-600 font-medium mb-1">Failed to load compliance data</div>
          <Text type="secondary">{error}</Text>
        </Card>
      ) : (
        <div className="space-y-6">
          <ComplianceSection
            title="Daily Activity Compliance"
            subtitle="Based on yesterday's reports (cutoff: 18:00) • Excludes admins and inactive users"
            block={dailyActivity}
          />

          <ComplianceSection
            title="Cashup Submission Compliance"
            subtitle="Based on yesterday's cashups (cutoff: 20:00) • Cashiers only • Submitted counts as compliant even if not balanced"
            block={cashup}
          />
        </div>
      )}
    </div>
  );
}

export default withRoleGuard(ComplianceReportingPage, [ERoles.Admin, ERoles.ComplianceOfficer]);

