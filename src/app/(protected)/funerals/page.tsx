"use client";

import PageHeader from "@/app/components/page-header";
import type { IFuneral, EFuneralStatus, EPaymentStatus } from "@/types/funeral";
import { CalendarOutlined, DeleteOutlined, EditOutlined, EyeOutlined, PlusOutlined, ReloadOutlined, SearchOutlined } from "@ant-design/icons";
import {
  Button,
  Card,
  DatePicker,
  Drawer,
  Form,
  Input,
  InputNumber,
  message,
  Popconfirm,
  Select,
  Space,
  Statistic,
  Table,
  Tag,
  Typography,
  Divider,
  Checkbox,
  Alert,
} from "antd";
import { useEffect, useMemo, useState } from "react";
import dayjs, { Dayjs } from "dayjs";
import { CreateFuneralBody } from "@/app/api/funerals/route";

const { RangePicker } = DatePicker;
const { Text } = Typography;

type MilestoneKey = "pickUp" | "bathing" | "tentErection" | "delivery" | "serviceEscort" | "burial";

function MilestoneFields({ name, label }: { name: MilestoneKey; label: string }) {
  const [enabled, setEnabled] = useState(false);
  return (
    <div>
      <Form.Item name={[name, "enabled"]} valuePropName="checked" className="!mb-0">
        <Checkbox checked={enabled} onChange={(e) => setEnabled(e.target.checked)}>{label}</Checkbox>
      </Form.Item>
      {enabled && <div className="grid grid-cols-2 gap-3 items-end">
        <Form.Item label="Date & Time" name={[name, "startDateTime"]} className="col-span-1">
          <DatePicker showTime className="w-full" />
        </Form.Item>
        <Form.Item label="Location/Notes" name={[name, "notes"]} className="col-span-1">
          <Input placeholder="Optional note or location text" />
        </Form.Item>
      </div>}
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
      message.error(e?.message || 'Failed to fetch funerals');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit, q, status, branchId, range]);

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
      pickUp: {
        enabled: !!row.pickUp?.enabled,
        startDateTime: row.pickUp?.startDateTime ? dayjs(row.pickUp.startDateTime) : undefined,
        notes: row.pickUp?.notes,
      },
      bathing: {
        enabled: !!row.bathing?.enabled,
        startDateTime: row.bathing?.startDateTime ? dayjs(row.bathing.startDateTime) : undefined,
        notes: row.bathing?.notes,
      },
      tentErection: {
        enabled: !!row.tentErection?.enabled,
        startDateTime: row.tentErection?.startDateTime ? dayjs(row.tentErection.startDateTime) : undefined,
        notes: row.tentErection?.notes,
      },
      delivery: {
        enabled: !!row.delivery?.enabled,
        startDateTime: row.delivery?.startDateTime ? dayjs(row.delivery.startDateTime) : undefined,
        notes: row.delivery?.notes,
      },
      serviceEscort: {
        enabled: !!row.serviceEscort?.enabled,
        startDateTime: row.serviceEscort?.startDateTime ? dayjs(row.serviceEscort.startDateTime) : undefined,
        notes: row.serviceEscort?.notes,
      },
      burial: {
        enabled: !!row.burial?.enabled,
        startDateTime: row.burial?.startDateTime ? dayjs(row.burial.startDateTime) : undefined,
        notes: row.burial?.notes,
      },

    });
    setOpen(true);
  };

  // create or update submit
  const onSubmit = async () => {
    setSubmitting(true);
    const isDay = (d: any) => d && dayjs.isDayjs(d);
    const toISO = (d: any) => (isDay(d) ? (d as Dayjs).toISOString() : undefined);

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
        pickUp: v.pickUp?.enabled ? { enabled: true, startDateTime: toISO(v.pickUp.startDateTime), notes: v.pickUp.notes } : { enabled: false },
        bathing: v.bathing?.enabled ? { enabled: true, startDateTime: toISO(v.bathing.startDateTime), notes: v.bathing.notes } : { enabled: false },
        tentErection: v.tentErection?.enabled ? { enabled: true, startDateTime: toISO(v.tentErection.startDateTime), notes: v.tentErection.notes } : { enabled: false },
        delivery: v.delivery?.enabled ? { enabled: true, startDateTime: toISO(v.delivery.startDateTime), notes: v.delivery.notes } : { enabled: false },
        serviceEscort: v.serviceEscort?.enabled ? { enabled: true, startDateTime: toISO(v.serviceEscort.startDateTime), notes: v.serviceEscort.notes } : { enabled: false },
        burial: v.burial?.enabled ? { enabled: true, startDateTime: toISO(v.burial.startDateTime), notes: v.burial.notes } : { enabled: false },

        createCalendarEvent: true, // ignored; API always upserts milestones
      };

      const res = await fetch(editing ? `/api/funerals/${editing._id}` : '/api/funerals', {
        method: editing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json?.message || 'Save failed');

      message.success(editing ? 'Funeral updated' : 'Funeral created');
      setOpen(false);
      setEditing(null);
      fetchData();
    } catch (e: any) {
      if (e?.errorFields) return; // antd form validation error
      console.error(e);
      setError(e?.message || 'Failed to save');
      message.error(e?.message || 'Failed to save');
    } finally {
      setSubmitting(false);
    }
  };

  const onDelete = async (row: IFuneral) => {
    try {
      const res = await fetch(`/api/funerals/${row._id}?deleteCalendar=true`, { method: 'DELETE' });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json?.message || 'Delete failed');
      message.success('Funeral deleted');
      // if table ends up on an empty page, pull back one page
      if (items.length === 1 && page > 1) setPage(p => p - 1);
      else fetchData();
    } catch (e: any) {
      console.error(e);
      message.error(e?.message || 'Failed to delete');
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
          <Input
            allowClear
            placeholder="Branch ID"
            value={branchId}
            onChange={(e) => {
              setPage(1);
              setBranchId(e.target.value || undefined);
            }}
            style={{ width: 160 }}
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
          <div className="grid grid-cols-3 gap-4">
            <Form.Item label="Reference #" name="referenceNumber">
              <Input placeholder="Auto if blank (e.g., FNR-YYYYMMDD-HHmmss)" />
            </Form.Item>
            <Form.Item label="Policy #" name="policyNumber">
              <Input placeholder="Optional" />
            </Form.Item>
            <Form.Item label="Branch ID" name="branchId">
              <Input placeholder="e.g., BR-EDENPARK" />
            </Form.Item>
          </div>

          <Divider orientation="center" plain className="uppercase !text-xs !font-bold !tracking-wider">Deceased Details</Divider>

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

          <Divider orientation="center" plain className="uppercase !text-xs !font-bold !tracking-wider">Informant Details</Divider>

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

          <Divider orientation="center" plain className="uppercase !text-xs !font-bold !tracking-wider">Service Details (optional/legacy)</Divider>

          <div className="grid grid-cols-2 gap-4">
            <Form.Item
              label="Service Date & Time"
              name="serviceDateTime"
            >
              <DatePicker showTime className="w-full" />
            </Form.Item>

            <Form.Item label="Burial Date & Time" name="burialDateTime">
              <DatePicker showTime className="w-full" />
            </Form.Item>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Form.Item label="Cemetery" name="cemetery">
              <Input />
            </Form.Item>
            <Form.Item label="Grave Number" name="graveNumber">
              <Input />
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

          <Divider orientation="center" plain className="uppercase !text-xs !font-bold !tracking-wider">
            Milestones (calendar)
          </Divider>

          <MilestoneFields name="pickUp" label="Pickup (hospital/mortuary)" />
          <MilestoneFields name="bathing" label="Family bathing" />
          <MilestoneFields name="tentErection" label="Tent erection" />
          <MilestoneFields name="delivery" label="Delivery to family/church" />
          <MilestoneFields name="serviceEscort" label="Church/service escort" />
          <MilestoneFields name="burial" label="Burial (cemetery)" />

          <Divider orientation="center" plain className="uppercase !text-xs !font-bold !tracking-wider">Additional Information</Divider>

          <Form.Item label="Notes" name="notes">
            <Input.TextArea rows={4} />
          </Form.Item>
        </Form>
      </Drawer>
    </div>
  );
}

export default FuneralsPage;