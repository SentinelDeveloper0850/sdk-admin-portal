"use client";

import { CreateFuneralBody } from "@/app/api/funerals/route";
import PageHeader from "@/app/components/page-header";
import type { EFuneralStatus, EPaymentStatus, IFuneral } from "@/types/funeral";
import { CalendarOutlined, DeleteOutlined, EditOutlined, PlusOutlined, ReloadOutlined, SearchOutlined } from "@ant-design/icons";
import {
  Alert,
  Button,
  Card,
  Checkbox,
  Collapse,
  DatePicker,
  Divider,
  Drawer,
  Form,
  Input,
  InputNumber,
  Popconfirm,
  Select,
  Space,
  Statistic,
  Table,
  Tag,
  Typography,
} from "antd";
import dayjs, { Dayjs } from "dayjs";
import { useEffect, useMemo, useState } from "react";
import sweetAlert from "sweetalert";

const { RangePicker } = DatePicker;
const { Text } = Typography;

type MilestoneKey = "pickUp" | "bathing" | "tentErection" | "delivery" | "serviceEscort" | "burial";

const DECEASED_AGE_GROUPS = [
  { id: 'infant', value: 'infant', label: 'Infant', ageRange: '0-2 years', ageMin: 0, ageMax: 2 }, // 0-2 years
  { id: 'child', value: 'child', label: 'Child', ageRange: '3-12 years', ageMin: 3, ageMax: 12 }, // 3-12 years
  { id: 'teen', value: 'teen', label: 'Teen', ageRange: '13-19 years', ageMin: 13, ageMax: 19 }, // 13-19 years
  { id: 'adult', value: 'adult', label: 'Adult', ageRange: '20-64 years', ageMin: 20, ageMax: 64 }, // 20-64 years
  { id: 'elderly', value: 'elderly', label: 'Elderly', ageRange: '65+ years', ageMin: 65, ageMax: null }, // 65+ years
];

function MilestoneFields({ name, label }: { name: MilestoneKey; label: string }) {
  const form = Form.useFormInstance();
  const milestoneValue = Form.useWatch(name, form) as any;

  const status = milestoneValue?.status;
  const isCompleted = typeof status === "string" && status.toLowerCase() === "completed";
  const isEnabled = Boolean(milestoneValue?.enabled);

  const startValue = milestoneValue?.startDateTime;
  const formattedStart = startValue
    ? dayjs.isDayjs(startValue)
      ? startValue.format('ddd, D MMM YYYY • HH:mm')
      : fmtDT(startValue)
    : 'Not provided';
  const notesValue = milestoneValue?.notes;

  return (
    <div className="space-y-2">
      <Form.Item name={[name, "status"]} hidden>
        <Input />
      </Form.Item>

      {isCompleted ? (
        <>
          <div style={{ display: 'none' }}>
            <Form.Item name={[name, "enabled"]} valuePropName="checked">
              <Checkbox />
            </Form.Item>
            <Form.Item name={[name, "startDateTime"]}>
              <DatePicker showTime className="w-full" />
            </Form.Item>
            <Form.Item name={[name, "notes"]}>
              <Input />
            </Form.Item>
          </div>

          <div className="rounded-md border border-green-200 bg-green-50 p-3">
            <Space align="center" className="mb-1">
              <Text strong>{label}</Text>
              <Tag color="green">Completed</Tag>
            </Space>
            <div className="text-sm text-gray-700">
              <Text strong>Date &amp; Time: </Text>
              {formattedStart}
            </div>
            <div className="text-sm text-gray-700">
              <Text strong>Notes: </Text>
              {notesValue ? notesValue : <span className="text-gray-500">No additional notes.</span>}
            </div>
          </div>
        </>
      ) : (
        <>
          <Form.Item name={[name, "enabled"]} valuePropName="checked" className="!mb-0">
            <Checkbox>{label}</Checkbox>
          </Form.Item>
          {isEnabled && (
            <div className="grid grid-cols-2 gap-3 items-end">
              <Form.Item label="Date & Time" name={[name, "startDateTime"]} className="col-span-1">
                <DatePicker showTime className="w-full" />
              </Form.Item>
              <Form.Item label="Location/Notes" name={[name, "notes"]} className="col-span-1">
                <Input placeholder="Optional note or location text" />
              </Form.Item>
            </div>
          )}
        </>
      )}
    </div>
  );
}

const getStatusTag = (s: EFuneralStatus) => {
  const map: Record<EFuneralStatus, { color: string; label: string }> = {
    planned: { color: 'gold', label: 'Planned' },
    in_progress: { color: 'processing', label: 'In Progress' },
    completed: { color: 'green', label: 'Completed' },
    cancelled: { color: 'red', label: 'Cancelled' },
  };
  const m = map[s] || map.planned;
  return <Tag color={m.color}> {m.label} </Tag>;
};

const paymentStatusTag = (s?: EPaymentStatus) => {
  if (!s) return null;
  const map: Record<EPaymentStatus, { color: string; label: string }> = {
    unpaid: { color: 'red', label: 'Unpaid' },
    partial: { color: 'gold', label: 'Partially Paid' },
    paid: { color: 'green', label: 'Paid' },
  };
  const m = map[s];
  return <Tag color={m.color}>{m.label}</Tag>;
};

const fmtDT = (iso?: string) => (iso ? dayjs(iso).format('ddd, D MMM YYYY • HH:mm') : '—');

const FuneralsPage = () => {
  // table state
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<IFuneral[]>([]);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);

  // filters
  const [q, setQ] = useState('');
  const [status, setStatus] = useState<EFuneralStatus | undefined>();
  const [branchId, setBranchId] = useState<string | undefined>();
  const [range, setRange] = useState<[Dayjs, Dayjs] | null>(null);
  const [branches, setBranches] = useState<Array<{ name: string; code: string }>>([]);
  const [branchesLoading, setBranchesLoading] = useState(false);

  // drawer (create/edit)
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<IFuneral | null>(null);
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', String(limit));
      if (q) params.set('q', q);
      if (status) params.set('status', status);
      if (branchId) params.set('branchId', branchId);
      if (range) {
        params.set('startDate', range[0].startOf('day').toISOString());
        params.set('endDate', range[1].endOf('day').toISOString());
      }
      const res = await fetch(`/api/funerals?${params.toString()}`);
      const json = await res.json();
      if (!json?.success) throw new Error(json?.message || 'Failed to fetch');
      setItems(json.items);
      setTotal(json.total);
    } catch (e: any) {
      console.error(e);
      sweetAlert({ title: 'Error', text: e?.message || 'Failed to fetch funerals', icon: 'error' });
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
        const res = await fetch('/api/configurations/branches');
        const json = await res.json();
        if (!res.ok || !json?.success) {
          throw new Error(json?.error?.message || 'Failed to load branches');
        }
        const list = Array.isArray(json.data) ? json.data : [];
        setBranches(
          list
            .filter((item: any) => item?.name && item?.code)
            .map((item: any) => ({
              name: String(item.name),
              code: String(item.code),
            }))
        );
      } catch (error: any) {
        console.error(error);
        sweetAlert({
          title: 'Error loading branches',
          text: error?.message || 'Unable to load branches',
          icon: 'error',
        });
      } finally {
        setBranchesLoading(false);
      }
    };

    loadBranches();
  }, []);

  const branchOptions = useMemo(
    () =>
      branches.map((branch) => ({
        label: `${branch.name} (${branch.code})`,
        value: branch.code,
      })),
    [branches]
  );

  const onResetFilters = () => {
    setQ('');
    setStatus(undefined);
    setBranchId(undefined);
    setRange(null);
    setPage(1);
  };

  // open drawer for create
  const openCreate = () => {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({
      createCalendarEvent: true,
      status: 'planned',
      paymentStatus: 'unpaid',
      isSameDay: true,
    });
    setOpen(true);
  };

  // open drawer for edit
  const openEdit = (row: IFuneral) => {
    setEditing(row);
    form.resetFields();
    form.setFieldsValue({
      referenceNumber: row.referenceNumber,
      policyNumber: row.policyNumber,
      deceasedFirstName: row.deceased?.firstName,
      deceasedLastName: row.deceased?.lastName,
      deceasedIdNumber: row.deceased?.idNumber,
      deceasedPassportNumber: row.deceased?.passportNumber,
      deceasedDateOfBirth: row.deceased?.dateOfBirth ? dayjs(row.deceased.dateOfBirth) : undefined,
      deceasedDateOfDeath: row.deceased?.dateOfDeath ? dayjs(row.deceased.dateOfDeath) : undefined,
      serviceDateTime: row.serviceDateTime ? dayjs(row.serviceDateTime) : undefined,
      burialDateTime: row.burialDateTime ? dayjs(row.burialDateTime) : undefined,
      isSameDay: row.isSameDay,
      branchId: row.branchId,
      cemetery: row.cemetery,
      graveNumber: row.graveNumber,
      notes: row.notes,
      estimatedCost: row.estimatedCost,
      actualCost: row.actualCost,
      paymentStatus: row.paymentStatus,
      status: row.status,
      createCalendarEvent: true, // for edits this flag is ignored; calendar is already linked
      informantFirstName: row.informant?.firstName,
      informantLastName: row.informant?.lastName,
      informantIdNumber: row.informant?.idNumber,
      informantPassportNumber: row.informant?.passportNumber,
      informantAddress: row.informant?.address,
      informantPhoneNumber: row.informant?.phoneNumber,
      informantEmail: row.informant?.email,
      informantRelationship: row.informant?.relationship,
      pickUp: {
        enabled: !!row.pickUp?.enabled,
        startDateTime: row.pickUp?.startDateTime ? dayjs(row.pickUp.startDateTime) : undefined,
        notes: row.pickUp?.notes,
        status: row.pickUp?.status,
      },
      bathing: {
        enabled: !!row.bathing?.enabled,
        startDateTime: row.bathing?.startDateTime ? dayjs(row.bathing.startDateTime) : undefined,
        notes: row.bathing?.notes,
        status: row.bathing?.status,
      },
      tentErection: {
        enabled: !!row.tentErection?.enabled,
        startDateTime: row.tentErection?.startDateTime ? dayjs(row.tentErection.startDateTime) : undefined,
        notes: row.tentErection?.notes,
        status: row.tentErection?.status,
      },
      delivery: {
        enabled: !!row.delivery?.enabled,
        startDateTime: row.delivery?.startDateTime ? dayjs(row.delivery.startDateTime) : undefined,
        notes: row.delivery?.notes,
        status: row.delivery?.status,
      },
      serviceEscort: {
        enabled: !!row.serviceEscort?.enabled,
        startDateTime: row.serviceEscort?.startDateTime ? dayjs(row.serviceEscort.startDateTime) : undefined,
        notes: row.serviceEscort?.notes,
        status: row.serviceEscort?.status,
      },
      burial: {
        enabled: !!row.burial?.enabled,
        startDateTime: row.burial?.startDateTime ? dayjs(row.burial.startDateTime) : undefined,
        notes: row.burial?.notes,
        status: row.burial?.status,
      },

    });
    setOpen(true);
  };

  // create or update submit
  const onSubmit = async () => {
    setSubmitting(true);
    const isDay = (d: any) => d && dayjs.isDayjs(d);
    const toISO = (d: any) => (isDay(d) ? (d as Dayjs).toISOString() : undefined);

    const mapMilestone = (milestone: any) => {
      if (!milestone) return { enabled: false };

      const status = milestone.status;
      const enabled = Boolean(milestone.enabled) || status === 'completed';

      if (!enabled && status !== 'completed') {
        return { enabled: false };
      }

      const result: Record<string, any> = {
        enabled: enabled || status === 'completed',
      };

      const iso = toISO(milestone.startDateTime);
      if (iso) {
        result.startDateTime = iso;
      }

      if (milestone.notes) {
        result.notes = milestone.notes;
      }

      if (status) {
        result.status = status;
      }

      return result;
    };

    try {
      const v = await form.validateFields();
      const body: CreateFuneralBody = {
        referenceNumber: v.referenceNumber || undefined,
        policyNumber: v.policyNumber || undefined,

        deceased: {
          firstName: v.deceasedFirstName,
          lastName: v.deceasedLastName,
          idNumber: v.deceasedIdNumber || undefined,          // ✅ fix
          passportNumber: v.deceasedPassportNumber || undefined,
          dateOfBirth: toISO(v.deceasedDateOfBirth),
          dateOfDeath: toISO(v.deceasedDateOfDeath),
        },

        informant: {
          firstName: v.informantFirstName,
          lastName: v.informantLastName,
          idNumber: v.informantIdNumber || undefined,
          passportNumber: v.informantPassportNumber || undefined,
          address: v.informantAddress || undefined,
          phoneNumber: v.informantPhoneNumber || undefined,
          email: v.informantEmail || undefined,
          relationship: v.informantRelationship || undefined,
        },

        // optional legacy times
        serviceDateTime: toISO(v.serviceDateTime),
        burialDateTime: toISO(v.burialDateTime),

        branchId: v.branchId || undefined,
        cemetery: v.cemetery || undefined,
        graveNumber: v.graveNumber || undefined,
        estimatedCost: v.estimatedCost ?? undefined,
        actualCost: v.actualCost ?? undefined,
        paymentStatus: v.paymentStatus || undefined,
        status: v.status || undefined,
        notes: v.notes || undefined,

        // milestones
        pickUp: mapMilestone(v.pickUp),
        bathing: mapMilestone(v.bathing),
        tentErection: mapMilestone(v.tentErection),
        delivery: mapMilestone(v.delivery),
        serviceEscort: mapMilestone(v.serviceEscort),
        burial: mapMilestone(v.burial),

        createCalendarEvent: true, // ignored; API always upserts milestones
      };

      console.log("🚀 ~ onSubmit ~ body:", body)

      const res = await fetch(editing ? `/api/funerals/${editing._id}` : '/api/funerals', {
        method: editing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json?.message || 'Save failed');

      sweetAlert({ title: 'Success', text: editing ? 'Funeral updated' : 'Funeral created', icon: 'success' });
      // setOpen(false);
      // setEditing(null);
      // fetchData();
    } catch (e: any) {
      if (e?.errorFields) return; // antd form validation error
      console.error(e);
      setError(e?.message || 'Failed to save');
      sweetAlert({ title: 'Error', text: e?.message || 'Failed to save', icon: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const onDelete = async (row: IFuneral) => {
    try {
      const res = await fetch(`/api/funerals/${row._id}?deleteCalendar=true`, { method: 'DELETE' });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json?.message || 'Delete failed');
      sweetAlert({ title: 'Success', text: 'Funeral deleted', icon: 'success' });
      // if table ends up on an empty page, pull back one page
      if (items.length === 1 && page > 1) setPage(p => p - 1);
      else fetchData();
    } catch (e: any) {
      console.error(e);
      sweetAlert({ title: 'Error', text: e?.message || 'Failed to delete', icon: 'error' });
    }
  };

  const searchFunerals = () => {
    setPage(1);
    fetchData();
  };

  const nextMilestone = (r: IFuneral) => {
    const pairs = [
      ["Pickup", r.pickUp?.startDateTime],
      ["Bathing", r.bathing?.startDateTime],
      ["Tent", r.tentErection?.startDateTime],
      ["Delivery", r.delivery?.startDateTime],
      ["Service", r.serviceEscort?.startDateTime],
      ["Burial", r.burial?.startDateTime],
      ["Service (legacy)", r.serviceDateTime],
    ].filter(([, d]) => !!d) as [string, string][];

    if (!pairs.length) return "—";
    pairs.sort((a, b) => new Date(a[1]).getTime() - new Date(b[1]).getTime());
    return `${pairs[0][0]} • ${fmtDT(pairs[0][1])}`;
  };

  // ---------- Table columns ----------
  const columns = useMemo(
    () => [
      {
        title: 'Ref',
        dataIndex: 'referenceNumber',
        key: 'referenceNumber',
        width: 180,
        render: (v: string) => <Text code>{v}</Text>,
      },
      {
        title: 'Deceased',
        key: 'deceased',
        render: (_: any, r: IFuneral) => (
          <span>{`${r.deceased?.firstName ?? ''} ${r.deceased?.lastName ?? ''}`.trim()}</span>
        ),
      },
      {
        title: 'Church',
        dataIndex: 'serviceDateTime',
        key: 'serviceDateTime',
        render: (v: string, model: any) => fmtDT(model.serviceDateTime) || '--',
      },
      {
        title: 'Burial',
        dataIndex: 'burialDateTime',
        key: 'burialDateTime',
        render: (v: string, model: any) => fmtDT(model.burialDateTime) || '--',
      },
      {
        title: 'Payment',
        dataIndex: 'paymentStatus',
        key: 'paymentStatus',
        width: 120,
        render: (v: EPaymentStatus) => paymentStatusTag(v),
      },
      {
        title: 'Status',
        dataIndex: 'status',
        key: 'status',
        width: 130,
        render: (v: EFuneralStatus) => getStatusTag(v),
      },
      { title: 'Next Task', key: 'next', render: (_: any, r: IFuneral) => nextMilestone(r) },
      {
        title: 'Actions',
        key: 'actions',
        fixed: 'right' as const,
        width: 180,
        render: (_: any, row: IFuneral) => (
          <Space>
            <Button size="small" icon={<CalendarOutlined />} onClick={() => window.open('/calendar', '_blank')}></Button>
            <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(row)}></Button>
            <Popconfirm title="Delete this funeral?" onConfirm={() => onDelete(row)}>
              <Button size="small" danger icon={<DeleteOutlined />} />
            </Popconfirm>
          </Space>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [items]
  );

  return (
    <div className="p-4">
      <PageHeader
        title="Funerals" noDivider
        subtitle="Create, update, and delete Funerals from your system"
        actions={[
          <Button icon={<ReloadOutlined />} onClick={() => fetchData()}>
            Refresh
          </Button>,
          <Button icon={<PlusOutlined />} onClick={openCreate}>
            New Funeral
          </Button>,
        ]}
      />

      <Space size={32}>
        <Statistic title="Total Funerals" value={total} />
        <Statistic
          title="Listed Funerals"
          value={items ? items.length : 0}
        />
      </Space>

      <Divider />

      <Card className="mb-6">
        <Space>
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
              setStatus(v as EFuneralStatus | undefined);
            }}
            style={{ width: 150 }}
            options={[
              { value: 'planned', label: 'Planned' },
              { value: 'in_progress', label: 'In Progress' },
              { value: 'completed', label: 'Completed' },
              { value: 'cancelled', label: 'Cancelled' },
            ]}
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
          <Button icon={<SearchOutlined />} onClick={() => searchFunerals()}>
            Search Funerals
          </Button>
        </Space>
      </Card>

      <Table
        loading={loading}
        rowKey={(r: IFuneral) => r._id as string}
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

      {/* Create / Edit Drawer */}
      <Drawer
        open={open}
        width="50%"
        className="sm:w-full md:w-3/4 lg:w-2/3 xl:w-1/2"
        title={editing ? 'Edit Funeral' : 'New Funeral'}
        onClose={() => {
          setOpen(false);
          setEditing(null);
          setError(null);
        }}
        destroyOnClose
        extra={
          <Space>
            <Button onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="primary" onClick={onSubmit} loading={submitting}>
              {editing ? submitting ? 'Saving...' : 'Save' : submitting ? 'Creating...' : 'Create'}
            </Button>
          </Space>
        }
        footer={
          <div>
            {error && <Alert message={error} type="error" showIcon closable onClose={() => setError(null)} />}
          </div>
        }
      >
        <Form form={form} layout="vertical">
          <Collapse defaultActiveKey={['1']} bordered={false} className="bg-transparent" expandIconPosition="right" accordion={true}>
            <Collapse.Panel header={<h4 className="uppercase !text-xs !font-bold !tracking-wider">1. Deceased Details</h4>} key="1">
              <div className="grid grid-cols-2 gap-4">
                <Form.Item
                  label="Deceased First Name"
                  name="deceasedFirstName"
                  rules={[{ required: true, message: 'Required' }]}
                >
                  <Input />
                </Form.Item>

                <Form.Item
                  label="Deceased Last Name"
                  name="deceasedLastName"
                  rules={[{ required: true, message: 'Required' }]}
                >
                  <Input />
                </Form.Item>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Form.Item
                  label="Deceased ID Number"
                  name="deceasedIdNumber"
                >
                  <Input />
                </Form.Item>

                <Form.Item
                  label="Deceased Passport Number"
                  name="deceasedPassportNumber"
                >
                  <Input />
                </Form.Item>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Form.Item
                  label="Deceased Date of Birth"
                  name="deceasedDateOfBirth"
                >
                  <DatePicker showTime={false} className="w-full" />
                </Form.Item>

                <Form.Item
                  label="Deceased Date of Death"
                  name="deceasedDateOfDeath"
                >
                  <DatePicker showTime={false} className="w-full" />
                </Form.Item>
              </div>
            </Collapse.Panel>
            <Collapse.Panel header={<h4 className="uppercase !text-xs !font-bold !tracking-wider">2. Informant Details</h4>} key="2">
              <div className="grid grid-cols-2 gap-4">
                <Form.Item
                  label="Informant First Name"
                  name="informantFirstName"
                  rules={[{ required: true, message: 'Required' }]}
                >
                  <Input />
                </Form.Item>
                <Form.Item
                  label="Informant Last Name"
                  name="informantLastName"
                  rules={[{ required: true, message: 'Required' }]}
                >
                  <Input />
                </Form.Item>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Form.Item
                  label="Informant ID Number"
                  name="informantIdNumber"
                >
                  <Input />
                </Form.Item>
                <Form.Item
                  label="Informant Passport Number"
                  name="informantPassportNumber"
                >
                  <Input />
                </Form.Item>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Form.Item
                  label="Informant Address"
                  name="informantAddress"
                >
                  <Input />
                </Form.Item>
                <Form.Item
                  label="Informant Phone Number"
                  name="informantPhoneNumber"
                >
                  <Input />
                </Form.Item>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Form.Item
                  label="Informant Email"
                  name="informantEmail"
                >
                  <Input />
                </Form.Item>
                <Form.Item
                  label="Informant Relationship"
                  name="informantRelationship"
                >
                  <Input />
                </Form.Item>
              </div>
            </Collapse.Panel>
            <Collapse.Panel header={<h4 className="uppercase !text-xs !font-bold !tracking-wider">3. Billing Details</h4>} key="3">
              <div className="grid grid-cols-3 gap-4">
                <Form.Item label="Reference #" name="referenceNumber">
                  <Input placeholder="Auto if blank (e.g., FNR-YYYYMMDD-HHmmss)" />
                </Form.Item>
                <Form.Item label="Policy #" name="policyNumber">
                  <Input placeholder="Optional" />
                </Form.Item>
                <Form.Item label="Branch" name="branchId">
                  <Select
                    allowClear
                    showSearch
                    placeholder="Select branch"
                    options={branchOptions}
                    optionFilterProp="label"
                    loading={branchesLoading}
                  />
                </Form.Item>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Form.Item label="Estimated Cost (ZAR)" name="estimatedCost">
                  <InputNumber className="w-full" min={0} step={100} />
                </Form.Item>
                <Form.Item label="Actual Cost (ZAR)" name="actualCost">
                  <InputNumber className="w-full" min={0} step={100} />
                </Form.Item>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Form.Item label="Payment Status" name="paymentStatus">
                  <Select
                    allowClear
                    options={[
                      { value: 'unpaid', label: 'Unpaid' },
                      { value: 'partial', label: 'Partially Paid' },
                      { value: 'paid', label: 'Paid' },
                    ]}
                  />
                </Form.Item>

                <Form.Item label="Status" name="status" initialValue="planned">
                  <Select
                    options={[
                      { value: 'planned', label: 'Planned' },
                      { value: 'in_progress', label: 'In Progress' },
                      { value: 'completed', label: 'Completed' },
                      { value: 'cancelled', label: 'Cancelled' },
                    ]}
                  />
                </Form.Item>
              </div>
            </Collapse.Panel>
            <Collapse.Panel header={<h4 className="uppercase !text-xs !font-bold !tracking-wider">4. Pickup Details</h4>} key="4">
              <div className="grid grid-cols-2 gap-4">
                <Form.Item label="Address / Location" name="pickUp.location">
                  <Input />
                </Form.Item>
                <div className="grid grid-cols-2 gap-4">
                  <Form.Item label="Age Group" name="pickUp.deceasedAge">
                    <Select options={DECEASED_AGE_GROUPS} />
                  </Form.Item>
                  <Form.Item label="Date & Time" name="pickUp.dateTime">
                    <DatePicker showTime className="w-full" />
                  </Form.Item>
                </div>
                <Form.Item label="Notes" name="pickUp.notes" className="col-span-2">
                  <Input.TextArea rows={4} />
                </Form.Item>
              </div>
            </Collapse.Panel>
            <Collapse.Panel header={<h4 className="uppercase !text-xs !font-bold !tracking-wider">5. Bathing Details</h4>} key="5">
              <div className="grid grid-cols-2 gap-4">
                <Form.Item label="Address / Location" name="bathing.location">
                  <Select options={branches.map((branch) => ({ label: branch.name, value: branch.code }))} />
                </Form.Item>
                <Form.Item label="Date & Time" name="bathing.dateTime">
                  <DatePicker showTime className="w-full" />
                </Form.Item>
                <Form.Item label="Notes" name="bathing.notes" className="col-span-2">
                  <Input.TextArea rows={4} />
                </Form.Item>
              </div>
            </Collapse.Panel>
            <Collapse.Panel header={<h4 className="uppercase !text-xs !font-bold !tracking-wider">6. Tent Erection Details</h4>} key="6">
              <div className="grid grid-cols-2 gap-4">
                <Form.Item label="Address / Location" name="tentErection.location">
                  <Input />
                </Form.Item>
                <Form.Item label="Date & Time" name="tentErection.dateTime">
                  <DatePicker showTime className="w-full" />
                </Form.Item>
                <Form.Item label="Notes" name="tentErection.notes" className="col-span-2">
                  <Input.TextArea rows={4} />
                </Form.Item>
              </div>
            </Collapse.Panel>
            <Collapse.Panel header={<h4 className="uppercase !text-xs !font-bold !tracking-wider">7. Delivery Details</h4>} key="7">
              <div className="grid grid-cols-2 gap-4">
                <Form.Item label="Address / Location" name="delivery.location">
                  <Input />
                </Form.Item>
                <Form.Item label="Date & Time" name="delivery.dateTime">
                  <DatePicker showTime className="w-full" />
                </Form.Item>
                <Form.Item label="Notes" name="delivery.notes" className="col-span-2">
                  <Input.TextArea rows={4} />
                </Form.Item>
              </div>
            </Collapse.Panel>
            <Collapse.Panel header={<h4 className="uppercase !text-xs !font-bold !tracking-wider">8. Church Escort Details</h4>} key="8">
              <div className="grid grid-cols-2 gap-4">
                <Form.Item label="Origin (Collection Point)" name="church.escort.origin">
                  <Input />
                </Form.Item>
                <Form.Item label="Destination (Drop-off Point)" name="church.escort.destination">
                  <Input />
                </Form.Item>
                <Form.Item label="Date & Time" name="church.escort.dateTime">
                  <DatePicker showTime className="w-full" />
                </Form.Item>
                <Form.Item label="Notes" name="church.escort.notes" className="col-span-2">
                  <Input.TextArea rows={4} />
                </Form.Item>
              </div>
            </Collapse.Panel>
            <Collapse.Panel header={<h4 className="uppercase !text-xs !font-bold !tracking-wider">9. Burial Details</h4>} key="9">
              <div className="grid grid-cols-2 gap-4">
                <Form.Item label="Cemetery" name="burial.cemetery">
                  <Input />
                </Form.Item>
                <Form.Item label="Grave Number" name="burial.graveNumber">
                  <Input />
                </Form.Item>
                <Form.Item label="Date & Time" name="burial.dateTime">
                  <DatePicker showTime className="w-full" />
                </Form.Item>
                <Form.Item label="Notes" name="burial.notes" className="col-span-2">
                  <Input.TextArea rows={4} />
                </Form.Item>
              </div>
            </Collapse.Panel>
            <Collapse.Panel header={<h4 className="uppercase !text-xs !font-bold !tracking-wider">10. Additional Information</h4>} key="10">
              <Form.Item label="Funeral Notes" name="notes">
                <Input.TextArea rows={4} />
              </Form.Item>
            </Collapse.Panel>
          </Collapse>
        </Form>
      </Drawer>
    </div>
  );
}

export default FuneralsPage;