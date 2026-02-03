// src/app/(protected)/funerals/page.tsx
"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import {
  CalendarOutlined,
  EditOutlined,
  EyeOutlined,
  PlusOutlined,
  ReloadOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import {
  Button,
  Card,
  DatePicker,
  Divider,
  Drawer,
  Input,
  Select,
  Space,
  Statistic,
  Table,
  Tag,
  Typography,
} from "antd";
import dayjs, { Dayjs } from "dayjs";
import sweetAlert from "sweetalert";

import CaseFileSummary from "@/app/components/funerals/CaseFileSummary";
import PageHeader from "@/app/components/page-header";
import type { IFuneral } from "@/types/funeral";

// src/app/(protected)/funerals/page.tsx

// src/app/(protected)/funerals/page.tsx

const { RangePicker } = DatePicker;
const { Text } = Typography;

type FuneralStatus =
  | "draft"
  | "confirmed"
  | "in_progress"
  | "completed"
  | "cancelled"
  | "postponed";

type PaymentStatus = "unpaid" | "partial" | "paid" | "waived";

const STATUS_OPTIONS: Array<{ value: FuneralStatus; label: string }> = [
  { value: "draft", label: "Draft" },
  { value: "confirmed", label: "Confirmed" },
  { value: "in_progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
  { value: "postponed", label: "Postponed" },
];

const fmtDT = (iso?: string) =>
  iso ? dayjs(iso).format("ddd, D MMM YYYY • HH:mm") : "—";

const getStatusTag = (s: FuneralStatus) => {
  const map: Record<FuneralStatus, { color: string; label: string }> = {
    draft: { color: "default", label: "Draft" },
    confirmed: { color: "blue", label: "Confirmed" },
    in_progress: { color: "processing", label: "In Progress" },
    completed: { color: "green", label: "Completed" },
    cancelled: { color: "red", label: "Cancelled" },
    postponed: { color: "gold", label: "Postponed" },
  };
  const m = map[s] || map.draft;
  return <Tag color={m.color}>{m.label}</Tag>;
};

const paymentStatusTag = (s?: PaymentStatus) => {
  if (!s) return null;
  const map: Record<PaymentStatus, { color: string; label: string }> = {
    unpaid: { color: "red", label: "Unpaid" },
    partial: { color: "gold", label: "Partially Paid" },
    paid: { color: "green", label: "Paid" },
    waived: { color: "default", label: "Waived" },
  };
  const m = map[s];
  return <Tag color={m.color}>{m.label}</Tag>;
};

const nextMilestone = (r: any) => {
  const ms = Array.isArray(r?.milestones) ? r.milestones : [];

  const pairs: Array<[string, string]> = ms
    .filter((m: any) => !!m?.enabled && !!m?.startDateTime)
    .map((m: any) => [String(m.type), String(m.startDateTime)]);

  if (r?.serviceDateTime)
    pairs.push(["service_legacy", String(r.serviceDateTime)]);
  if (r?.burialDateTime)
    pairs.push(["burial_legacy", String(r.burialDateTime)]);

  if (!pairs.length) return "—";

  pairs.sort((a, b) => new Date(a[1]).getTime() - new Date(b[1]).getTime());

  const labelMap: Record<string, string> = {
    pickup: "Pickup",
    bathing: "Bathing",
    tent_erection: "Tent",
    delivery: "Delivery",
    service: "Service",
    escort: "Escort",
    burial: "Burial",
    service_legacy: "Service (legacy)",
    burial_legacy: "Burial (legacy)",
  };

  const [t, dt] = pairs[0];
  return `${labelMap[t] || t} • ${fmtDT(dt)}`;
};

export default function FuneralsListPage() {
  const router = useRouter();

  // table state
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<IFuneral[]>([]);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);

  // filters
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<FuneralStatus | undefined>();
  const [branchId, setBranchId] = useState<string | undefined>();
  const [range, setRange] = useState<[Dayjs, Dayjs] | null>(null);
  const [branches, setBranches] = useState<
    Array<{ name: string; code: string }>
  >([]);
  const [branchesLoading, setBranchesLoading] = useState(false);

  // drawer state
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [summaryRow, setSummaryRow] = useState<IFuneral | null>(null);

  const openSummary = (row: IFuneral) => {
    setSummaryRow(row);
    setSummaryOpen(true);
  };

  const closeSummary = () => {
    setSummaryOpen(false);
    setSummaryRow(null);
  };

  // fetch data
  const fetchData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", String(limit));
      if (q) params.set("q", q);
      if (status) params.set("status", status);
      if (branchId) params.set("branchId", branchId);
      if (range) {
        params.set("startDate", range[0].startOf("day").toISOString());
        params.set("endDate", range[1].endOf("day").toISOString());
      }

      const res = await fetch(`/api/funerals?${params.toString()}`);
      const json = await res.json();
      if (!json?.success) throw new Error(json?.message || "Failed to fetch");

      setItems(json.items);
      setTotal(json.total);
    } catch (e: any) {
      console.error(e);
      sweetAlert({
        title: "Error",
        text: e?.message || "Failed to fetch funerals",
        icon: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit, q, status, branchId, range]);

  useEffect(() => {
    const loadBranches = async () => {
      try {
        setBranchesLoading(true);
        const res = await fetch("/api/configurations/branches");
        const json = await res.json();
        if (!res.ok || !json?.success)
          throw new Error(json?.error?.message || "Failed to load branches");

        const list = Array.isArray(json.data) ? json.data : [];
        setBranches(
          list
            .filter((item: any) => item?.name && item?.code)
            .map((item: any) => ({
              name: String(item.name),
              code: String(item.code),
            }))
        );
      } catch (e: any) {
        console.error(e);
        sweetAlert({
          title: "Error loading branches",
          text: e?.message || "Unable to load branches",
          icon: "error",
        });
      } finally {
        setBranchesLoading(false);
      }
    };
    loadBranches();
  }, []);

  const branchOptions = useMemo(
    () =>
      branches.map((b) => ({ label: `${b.name} (${b.code})`, value: b.code })),
    [branches]
  );

  const columns = useMemo(
    () => [
      {
        title: "Ref",
        dataIndex: "referenceNumber",
        key: "referenceNumber",
        width: 180,
        render: (v: string) => <Text code>{v}</Text>,
      },
      {
        title: "Deceased",
        key: "deceased",
        render: (_: any, r: any) => (
          <span>
            {`${r.deceased?.firstName ?? ""} ${r.deceased?.lastName ?? ""}`.trim()}
          </span>
        ),
      },
      {
        title: "Church",
        key: "serviceDateTime",
        render: (_: any, r: any) => fmtDT(r.serviceDateTime) || "--",
      },
      {
        title: "Burial",
        key: "burialDateTime",
        render: (_: any, r: any) => fmtDT(r.burialDateTime) || "--",
      },
      {
        title: "Payment",
        dataIndex: "paymentStatus",
        key: "paymentStatus",
        width: 140,
        render: (v: PaymentStatus) => paymentStatusTag(v),
      },
      {
        title: "Status",
        dataIndex: "status",
        key: "status",
        width: 140,
        render: (v: FuneralStatus) => getStatusTag(v),
      },
      {
        title: "Next Task",
        key: "next",
        render: (_: any, r: any) => nextMilestone(r),
      },
      {
        title: "Actions",
        key: "actions",
        fixed: "right" as const,
        width: 160,
        render: (_: any, row: any) => (
          <Space>
            <Button
              size="small"
              icon={<CalendarOutlined />}
              onClick={() => window.open("/calendar", "_blank")}
            />
            <Button
              size="small"
              icon={<EditOutlined />}
              onClick={() => router.push(`/funerals/${row._id}`)}
            />
            <Button
              size="small"
              icon={<EyeOutlined />}
              onClick={() => openSummary(row)}
            />
          </Space>
        ),
      },
    ],
    [router]
  );

  return (
    <div className="p-4">
      <PageHeader
        title="Funerals"
        noDivider
        subtitle="Create, update, and manage funeral case files"
        actions={[
          <Button
            key="refresh"
            icon={<ReloadOutlined />}
            onClick={() => fetchData()}
          >
            Refresh
          </Button>,
          <Button
            key="new"
            icon={<PlusOutlined />}
            onClick={() => router.push("/funerals/new")}
          >
            New Funeral
          </Button>,
        ]}
      />

      <Space size={32}>
        <Statistic title="Total Funerals" value={total} />
        <Statistic title="Listed Funerals" value={items.length} />
      </Space>

      <Divider />

      <Card className="mb-6">
        <Space wrap>
          <Input
            allowClear
            placeholder="Search (ref, policy, name)"
            prefix={<SearchOutlined />}
            value={q}
            onChange={(e) => {
              setPage(1);
              setQ(e.target.value);
            }}
            style={{ width: 260 }}
          />

          <Select
            allowClear
            placeholder="Status"
            value={status}
            onChange={(v) => {
              setPage(1);
              setStatus((v as FuneralStatus) || undefined);
            }}
            style={{ width: 170 }}
            options={STATUS_OPTIONS}
          />

          <Select
            allowClear
            showSearch
            placeholder="Branch"
            value={branchId}
            loading={branchesLoading}
            options={branchOptions}
            optionFilterProp="label"
            onChange={(value) => {
              setPage(1);
              setBranchId((value as string) || undefined);
            }}
            style={{ width: 220 }}
          />

          <RangePicker
            allowEmpty={[true, true]}
            value={range as any}
            onChange={(v) => {
              setPage(1);
              setRange((v as [Dayjs, Dayjs]) || null);
            }}
            showTime={false}
          />

          <Button icon={<SearchOutlined />} onClick={() => fetchData()}>
            Search Funerals
          </Button>
        </Space>
      </Card>

      <Table
        loading={loading}
        rowKey={(r: any) => r._id as string}
        dataSource={items}
        columns={columns as any}
        scroll={{ x: 1000 }}
        size="small"
        pagination={{
          current: page,
          pageSize: limit,
          total,
          showSizeChanger: true,
          onChange: (p, s) => {
            setPage(p);
            setLimit(s);
          },
        }}
      />

      <Drawer
        open={summaryOpen}
        onClose={closeSummary}
        closable={false}
        width={520}
        placement="right"
        destroyOnClose
      >
        <CaseFileSummary record={summaryRow} readOnly />
      </Drawer>
    </div>
  );
}
