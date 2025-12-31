// src/app/components/funerals/FuneralForm.tsx
"use client";

import CaseFileSummary from "@/app/components/funerals/CaseFileSummary";
import { InfoCircleOutlined } from "@ant-design/icons";
import {
    Alert,
    Button,
    Card,
    Checkbox,
    Collapse,
    DatePicker,
    Form,
    Input,
    InputNumber,
    Popconfirm,
    Select,
    Space,
    Spin,
    Tooltip,
} from "antd";
import dayjs from "dayjs";
import { useEffect, useMemo, useState } from "react";
import sweetAlert from "sweetalert";

type Mode = "create" | "edit";

type FuneralStatus =
    | "draft"
    | "confirmed"
    | "in_progress"
    | "completed"
    | "cancelled"
    | "postponed";

type PaymentStatus = "unpaid" | "partial" | "paid" | "waived";

type FuneralMilestoneType =
    | "pickup"
    | "bathing"
    | "tent_erection"
    | "delivery"
    | "service"
    | "escort"
    | "burial";

type MilestoneKey =
    | "pickUp"
    | "bathing"
    | "tentErection"
    | "delivery"
    | "serviceEscort"
    | "burial";

const RELATIONSHIP_OPTIONS: Array<{ value: string; label: string }> = [
    { value: "spouse", label: "Spouse" },
    { value: "child", label: "Child" },
    { value: "parent", label: "Parent" },
    { value: "sibling", label: "Sibling" },
    { value: "friend", label: "Friend" },
    { value: "other", label: "Other" },
];

const STATUS_OPTIONS: Array<{ value: FuneralStatus; label: string }> = [
    { value: "draft", label: "Draft" },
    { value: "confirmed", label: "Confirmed" },
    { value: "in_progress", label: "In Progress" },
    { value: "completed", label: "Completed" },
    { value: "cancelled", label: "Cancelled" },
    { value: "postponed", label: "Postponed" },
];

const PAYMENT_OPTIONS: Array<{ value: PaymentStatus; label: string }> = [
    { value: "unpaid", label: "Unpaid" },
    { value: "partial", label: "Partially Paid" },
    { value: "paid", label: "Paid" },
    { value: "waived", label: "Waived" },
];

const MILESTONE_FORM: Array<{
    type: FuneralMilestoneType;
    key: MilestoneKey;
    label: string;
    defaultMins: number;
    isEscort?: boolean;
}> = [
        { type: "pickup", key: "pickUp", label: "Pickup", defaultMins: 60 },
        { type: "bathing", key: "bathing", label: "Bathing", defaultMins: 90 },
        { type: "tent_erection", key: "tentErection", label: "Tent Erection", defaultMins: 180 },
        { type: "delivery", key: "delivery", label: "Delivery", defaultMins: 60 },
        { type: "escort", key: "serviceEscort", label: "Church Escort", defaultMins: 120, isEscort: true },
        { type: "burial", key: "burial", label: "Burial", defaultMins: 90 },
    ];

const toLocationObject = (v: any) => {
    if (!v) return undefined;
    if (typeof v === "object" && v?.name) return v;
    const s = String(v).trim();
    if (!s) return undefined;
    return { name: s, address: s };
};

const notesTextToNotesArray = (text: any) => {
    const s = typeof text === "string" ? text.trim() : "";
    if (!s) return [];
    return [{ note: s, createdAt: new Date(), createdBy: "UI", createdById: "UI" }];
};

const milestonesToFormValues = (milestones: any[] | undefined) => {
    const out: Record<string, any> = {};
    const list = Array.isArray(milestones) ? milestones : [];

    for (const m of list) {
        const type = String(m?.type) as FuneralMilestoneType;
        const def = MILESTONE_FORM.find((x) => x.type === type);
        if (!def) continue;

        out[def.key] = {
            enabled: !!m.enabled,
            startDateTime: m.startDateTime ? dayjs(m.startDateTime) : undefined,
            endDateTime: m.endDateTime ? dayjs(m.endDateTime) : undefined,
            durationMinutes: m.durationMinutes ?? def.defaultMins,

            // common fields
            location: m.location?.name || m.location?.address || "",
            origin: m.origin?.name || m.origin?.address || "",
            destination: m.destination?.name || m.destination?.address || "",

            // delivery detour
            via: m.via?.name || m.via?.address || "",

            // burial
            cemeteryCode: m.cemeteryCode,
            graveNumber: m.graveNumber,

            notes: Array.isArray(m.notes) ? m.notes.map((n: any) => n?.note).filter(Boolean).join("\n") : "",
            status: m.status,
            calendarEventId: m.calendarEventId,
        };
    }

    return out;
};

const buildMilestonesFromForm = (v: any) => {
    const out: any[] = [];

    for (const def of MILESTONE_FORM) {
        const slot = v?.[def.key];
        if (!slot) continue;

        const enabled = !!slot.enabled;
        const startISO =
            slot.startDateTime && dayjs.isDayjs(slot.startDateTime)
                ? slot.startDateTime.toISOString()
                : undefined;

        if (!enabled && !startISO) continue;

        const endISO =
            slot.endDateTime && dayjs.isDayjs(slot.endDateTime) ? slot.endDateTime.toISOString() : undefined;

        const milestone: any = {
            type: def.type,
            enabled,
            startDateTime: startISO,
            endDateTime: endISO,
            durationMinutes: slot.durationMinutes ?? def.defaultMins,

            // keep location for non-route style, but allow anyway if user types it
            location: toLocationObject(slot.location),

            status: slot.status,
            calendarEventId: slot.calendarEventId || undefined,
            notes: notesTextToNotesArray(slot.notes),
        };

        // Escort needs origin/destination
        if (def.isEscort) {
            milestone.origin = toLocationObject(slot.origin);
            milestone.destination = toLocationObject(slot.destination);
        }

        // Delivery supports origin/via/destination (optional origin + via, destination expected)
        if (def.type === "delivery") {
            milestone.origin = toLocationObject(slot.origin);
            milestone.via = toLocationObject(slot.via);
            milestone.destination = toLocationObject(slot.destination);
        }

        // Burial has cemetery/grave
        if (def.type === "burial") {
            milestone.cemeteryCode = slot.cemeteryCode || undefined;
            milestone.graveNumber = slot.graveNumber || undefined;
        }

        out.push(milestone);
    }

    return out;
};

function MilestoneHeaderActions({
    def,
    funeralId,
    form,
}: {
    def: {
        type: FuneralMilestoneType;
        key: MilestoneKey;
        label: string;
        defaultMins: number;
        isEscort?: boolean;
    };
    funeralId?: string;
    form: any;
}) {
    const milestone = Form.useWatch(def.key, form) as any;
    const milestoneStatus = String(milestone?.status || "").toLowerCase();
    const isCompleted = milestoneStatus === "completed";

    return (
        <div className="flex justify-end items-center gap-2">
            <Tooltip
                title="Use this if the milestone already happened (e.g. pickup completed before the funeral file was opened)."
                placement="top"
            >
                <InfoCircleOutlined className="cursor-help text-gray-400" />
            </Tooltip>

            <Popconfirm
                title={`Mark ${def.label} as completed?`}
                description="This will lock the milestone and update the calendar."
                okText="Yes, mark completed"
                cancelText="Cancel"
                disabled={!funeralId || isCompleted}
                onConfirm={async () => {
                    const res = await fetch(`/api/funerals/${funeralId}/milestones/${def.type}/complete`, {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ completedAt: new Date().toISOString() }),
                    });

                    const json = await res.json().catch(() => ({}));
                    if (!res.ok || !json?.success) {
                        sweetAlert({ title: "Error", text: json?.message || "Failed to mark completed", icon: "error" });
                        return;
                    }

                    form.setFieldsValue({
                        [def.key]: {
                            ...form.getFieldValue(def.key),
                            status: "completed",
                            completedAt: dayjs(),
                        },
                    });
                }}
            >
                <Button size="small" disabled={!funeralId || isCompleted}>
                    <small>{isCompleted ? "Completed" : "Mark Completed"}</small>
                </Button>
            </Popconfirm>
        </div>
    );
}

export default function FuneralForm({
    mode,
    funeralId,
    onDone,
}: {
    mode: Mode;
    funeralId?: string;
    onDone?: () => void;
}) {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(mode === "edit");
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [branches, setBranches] = useState<Array<{ name: string; code: string }>>([]);
    const [branchesLoading, setBranchesLoading] = useState(false);

    const [cemeteries, setCemeteries] = useState<Array<{ code: string; name: string }>>([]);
    const [cemeteriesLoading, setCemeteriesLoading] = useState(false);

    const [activeKey, setActiveKey] = useState<string | string[]>("1");

    useEffect(() => {
        const loadCemeteries = async () => {
            try {
                setCemeteriesLoading(true);
                const res = await fetch("/api/configurations/cemeteries");
                const json = await res.json();
                if (!json?.success) throw new Error("Failed to load cemeteries");
                setCemeteries(Array.isArray(json.data) ? json.data : []);
            } catch (e) {
                sweetAlert({ title: "Error", text: "Failed to load cemeteries", icon: "error" });
            } finally {
                setCemeteriesLoading(false);
            }
        };
        loadCemeteries();
    }, []);

    useEffect(() => {
        const loadBranches = async () => {
            try {
                setBranchesLoading(true);
                const res = await fetch("/api/configurations/branches");
                const json = await res.json();
                if (!res.ok || !json?.success) throw new Error(json?.error?.message || "Failed to load branches");

                const list = Array.isArray(json.data) ? json.data : [];
                setBranches(
                    list
                        .filter((item: any) => item?.name && item?.code)
                        .map((item: any) => ({ name: String(item.name), code: String(item.code) }))
                );
            } catch (e: any) {
                console.error(e);
                sweetAlert({ title: "Error", text: e?.message || "Unable to load branches", icon: "error" });
            } finally {
                setBranchesLoading(false);
            }
        };
        loadBranches();
    }, []);

    const branchOptions = useMemo(
        () => branches.map((b) => ({ label: `${b.name} (${b.code})`, value: b.code })),
        [branches]
    );

    const cemeteryOptions = useMemo(
        () => cemeteries.map((c) => ({ value: c.code, label: c.name })),
        [cemeteries]
    );

    const cemeteryMap = useMemo(() => {
        const m: Record<string, string> = {};
        cemeteries.forEach((c) => (m[c.code] = c.name));
        return m;
    }, [cemeteries]);

    useEffect(() => {
        if (mode !== "create") return;
        form.setFieldsValue({
            status: "draft",
            paymentStatus: "unpaid",
            isSameDay: true,
            pickUp: { enabled: false, durationMinutes: 60 },
            bathing: { enabled: false, durationMinutes: 90 },
            tentErection: { enabled: false, durationMinutes: 180 },
            delivery: { enabled: false, durationMinutes: 60 },
            serviceEscort: { enabled: false, durationMinutes: 120 },
            burial: { enabled: false, durationMinutes: 90 },
        });
    }, [mode, form]);

    useEffect(() => {
        const load = async () => {
            if (mode !== "edit" || !funeralId) return;
            try {
                setLoading(true);
                const res = await fetch(`/api/funerals/${funeralId}`);
                const json = await res.json();
                if (!res.ok || !json?.success) throw new Error(json?.message || "Failed to load funeral");

                const row = json.funeral;

                form.setFieldsValue({
                    referenceNumber: row.referenceNumber,
                    policyNumber: row.policyNumber,

                    deceasedFirstName: row.deceased?.firstName,
                    deceasedLastName: row.deceased?.lastName,
                    deceasedIdNumber: row.deceased?.idNumber,
                    deceasedPassportNumber: row.deceased?.passportNumber,
                    deceasedDateOfBirth: row.deceased?.dateOfBirth ? dayjs(row.deceased.dateOfBirth) : undefined,
                    deceasedDateOfDeath: row.deceased?.dateOfDeath ? dayjs(row.deceased.dateOfDeath) : undefined,

                    informantFirstName: row.informant?.firstName,
                    informantLastName: row.informant?.lastName,
                    informantIdNumber: row.informant?.idNumber,
                    informantPassportNumber: row.informant?.passportNumber,
                    informantAddress: row.informant?.address,
                    informantPhoneNumber: row.informant?.phoneNumber,
                    informantEmail: row.informant?.email,
                    informantRelationship: row.informant?.relationship,

                    branchId: row.branchId,

                    estimatedCost: row.estimatedCost,
                    actualCost: row.actualCost,
                    paymentStatus: row.paymentStatus,
                    status: row.status,

                    notes: "",
                    ...milestonesToFormValues(row?.milestones),
                });
            } catch (e: any) {
                console.error(e);
                setError(e?.message || "Failed to load");
                sweetAlert({ title: "Error", text: e?.message || "Failed to load funeral", icon: "error" });
            } finally {
                setLoading(false);
            }
        };

        load();
    }, [mode, funeralId, form]);

    const jumpTo = (panelKey: string) => {
        setActiveKey(panelKey);
        setTimeout(() => {
            const el = document.getElementById(`panel_${panelKey}`);
            el?.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 50);
    };

    const onSave = async () => {
        setSaving(true);
        setError(null);

        try {
            const v = await form.validateFields();

            const body: any = {
                referenceNumber: v.referenceNumber || undefined,
                policyNumber: v.policyNumber || undefined,

                deceased: {
                    firstName: v.deceasedFirstName,
                    lastName: v.deceasedLastName,
                    idNumber: v.deceasedIdNumber || undefined,
                    passportNumber: v.deceasedPassportNumber || undefined,
                    dateOfBirth: v.deceasedDateOfBirth ? v.deceasedDateOfBirth.toISOString() : undefined,
                    dateOfDeath: v.deceasedDateOfDeath ? v.deceasedDateOfDeath.toISOString() : undefined,
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

                branchId: v.branchId || undefined,

                estimatedCost: v.estimatedCost ?? undefined,
                actualCost: v.actualCost ?? undefined,
                paymentStatus: (v.paymentStatus as PaymentStatus) || undefined,
                status: (v.status as FuneralStatus) || undefined,

                notes: notesTextToNotesArray(v.notes),

                milestones: buildMilestonesFromForm(v),
            };

            const url = mode === "edit" ? `/api/funerals/${funeralId}` : "/api/funerals";
            const method = mode === "edit" ? "PUT" : "POST";

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });

            const json = await res.json();
            if (!res.ok || !json?.success) throw new Error(json?.message || "Save failed");

            sweetAlert({
                title: "Success",
                text: mode === "edit" ? "Funeral updated" : "Funeral created",
                icon: "success",
            });

            onDone?.();
        } catch (e: any) {
            if (e?.errorFields) return;
            console.error(e);
            setError(e?.message || "Failed to save");
            sweetAlert({ title: "Error", text: e?.message || "Failed to save", icon: "error" });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <Card>
                <Space>
                    <Spin />
                    <span>Loading funeral…</span>
                </Space>
            </Card>
        );
    }

    return (
        <Form form={form} layout="vertical">
            <div className="grid grid-cols-12 gap-4 items-start">
                <div className="col-span-12 xl:col-span-8 space-y-4">
                    <Card>
                        <div className="flex items-center justify-between gap-3">
                            <div className="text-sm text-gray-600">
                                {mode === "edit" ? "Editing existing case file" : "Creating new case file"}
                            </div>

                            <Button type="primary" onClick={onSave} loading={saving}>
                                Save
                            </Button>
                        </div>

                        {error && (
                            <div className="mt-3">
                                <Alert message={error} type="error" showIcon closable onClose={() => setError(null)} />
                            </div>
                        )}
                    </Card>

                    <Collapse
                        activeKey={activeKey}
                        onChange={(k) => setActiveKey(k as any)}
                        bordered={false}
                        className="bg-transparent"
                        expandIconPosition="right"
                        accordion
                    >
                        <Collapse.Panel
                            header={<h4 className="uppercase !text-xs !font-bold !tracking-wider">1. Deceased Details</h4>}
                            key="1"
                        >
                            <div id="panel_1" className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <Form.Item
                                        label="Deceased First Name"
                                        name="deceasedFirstName"
                                        rules={[{ required: true, message: "Required" }]}
                                    >
                                        <Input />
                                    </Form.Item>
                                    <Form.Item
                                        label="Deceased Last Name"
                                        name="deceasedLastName"
                                        rules={[{ required: true, message: "Required" }]}
                                    >
                                        <Input />
                                    </Form.Item>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <Form.Item label="Deceased ID Number" name="deceasedIdNumber">
                                        <Input />
                                    </Form.Item>
                                    <Form.Item label="Deceased Passport Number" name="deceasedPassportNumber">
                                        <Input />
                                    </Form.Item>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <Form.Item label="Deceased Date of Birth" name="deceasedDateOfBirth">
                                        <DatePicker showTime={false} className="w-full" />
                                    </Form.Item>
                                    <Form.Item label="Deceased Date of Death" name="deceasedDateOfDeath">
                                        <DatePicker showTime={false} className="w-full" />
                                    </Form.Item>
                                </div>
                            </div>
                        </Collapse.Panel>

                        <Collapse.Panel
                            header={<h4 className="uppercase !text-xs !font-bold !tracking-wider">2. Informant Details</h4>}
                            key="2"
                        >
                            <div id="panel_2" className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <Form.Item
                                        label="Informant First Name"
                                        name="informantFirstName"
                                        rules={[{ required: true, message: "Required" }]}
                                    >
                                        <Input />
                                    </Form.Item>
                                    <Form.Item
                                        label="Informant Last Name"
                                        name="informantLastName"
                                        rules={[{ required: true, message: "Required" }]}
                                    >
                                        <Input />
                                    </Form.Item>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <Form.Item label="Informant ID Number" name="informantIdNumber">
                                        <Input />
                                    </Form.Item>
                                    <Form.Item label="Informant Passport Number" name="informantPassportNumber">
                                        <Input />
                                    </Form.Item>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <Form.Item label="Informant Address" name="informantAddress">
                                        <Input />
                                    </Form.Item>
                                    <Form.Item
                                        label="Informant Phone Number"
                                        name="informantPhoneNumber"
                                        rules={[
                                            { required: true, message: "Phone number is required" },
                                            {
                                                validator: async (_, value: string) => {
                                                    const first = value?.slice(0, 1);
                                                    if (first === "0") return Promise.reject(new Error("First digit cannot be 0"));
                                                    return Promise.resolve();
                                                },
                                            },
                                            {
                                                validator: async (_, value: string) => {
                                                    const digits = value;
                                                    if (!digits) return Promise.resolve();
                                                    if (isNaN(Number(digits))) return Promise.reject(new Error("Phone number must be numbers"));
                                                    if (digits.length !== 9) return Promise.reject(new Error("Phone number must be 9 digits"));
                                                    return Promise.resolve();
                                                },
                                            },
                                        ]}
                                    >
                                        <Input
                                            prefix="+27"
                                            inputMode="numeric"
                                            placeholder="e.g. 812345678"
                                            maxLength={9}
                                            value={undefined as any}
                                        />
                                    </Form.Item>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <Form.Item label="Informant Email" name="informantEmail">
                                        <Input />
                                    </Form.Item>
                                    <Form.Item label="Informant Relationship" name="informantRelationship">
                                        <Select
                                            allowClear
                                            showSearch
                                            placeholder="Select relationship"
                                            options={RELATIONSHIP_OPTIONS}
                                            optionFilterProp="label"
                                        />
                                    </Form.Item>
                                </div>
                            </div>
                        </Collapse.Panel>

                        <Collapse.Panel
                            header={<h4 className="uppercase !text-xs !font-bold !tracking-wider">3. Billing & Case Details</h4>}
                            key="3"
                        >
                            <div id="panel_3" className="space-y-4">
                                <div className="grid grid-cols-3 gap-4">
                                    <Form.Item label="Reference #" name="referenceNumber">
                                        <Input placeholder="Auto if blank (e.g., FNR-YYYYMMDD-HHmmss)" />
                                    </Form.Item>
                                    <Form.Item label="Policy #" name="policyNumber">
                                        <Input placeholder="Optional" />
                                    </Form.Item>
                                    <Form.Item label="Branch" name="branchId" rules={[{ required: true, message: "Branch is required" }]}>
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
                                    <Form.Item label="Payment Status" name="paymentStatus" initialValue="unpaid">
                                        <Select allowClear options={PAYMENT_OPTIONS} />
                                    </Form.Item>
                                    <Form.Item label="Status" name="status" initialValue="draft">
                                        <Select options={STATUS_OPTIONS} />
                                    </Form.Item>
                                </div>
                            </div>
                        </Collapse.Panel>

                        {MILESTONE_FORM.map((def, idx) => (
                            <Collapse.Panel
                                key={`m_${def.key}`}
                                header={<h4 className="uppercase !text-xs !font-bold !tracking-wider">{`${4 + idx}. ${def.label}`}</h4>}
                            >
                                <div id={`panel_m_${def.key}`} className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <Form.Item name={[def.key, "enabled"]} valuePropName="checked" className="!mb-0">
                                            <Checkbox>{`Enable ${def.label}`}</Checkbox>
                                        </Form.Item>

                                        <MilestoneHeaderActions def={def} funeralId={funeralId} form={form} />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <Form.Item label="Date & Time" name={[def.key, "startDateTime"]}>
                                            <DatePicker showTime className="w-full" />
                                        </Form.Item>
                                        <Form.Item
                                            label="Duration (minutes)"
                                            name={[def.key, "durationMinutes"]}
                                            initialValue={def.defaultMins}
                                        >
                                            <InputNumber className="w-full" min={0} step={5} />
                                        </Form.Item>
                                    </div>

                                    {def.type === "delivery" ? (
                                        <div className="grid grid-cols-2 gap-4">
                                            <Form.Item label="Origin (Optional)" name={[def.key, "origin"]}>
                                                <Input placeholder="Where the body is collected from (optional)" />
                                            </Form.Item>
                                            <Form.Item label="Via (Optional)" name={[def.key, "via"]}>
                                                <Input placeholder="Detour location (e.g. place of death)" />
                                            </Form.Item>
                                            <Form.Item label="Destination" name={[def.key, "destination"]} className="col-span-2">
                                                <Input placeholder="Family house / final delivery point" />
                                            </Form.Item>
                                        </div>
                                    ) : def.isEscort ? (
                                        <div className="grid grid-cols-2 gap-4">
                                            <Form.Item label="Origin (Collection Point)" name={[def.key, "origin"]}>
                                                <Input placeholder="Where the escort starts" />
                                            </Form.Item>
                                            <Form.Item label="Destination (Church)" name={[def.key, "destination"]}>
                                                <Input placeholder="Church / service location" />
                                            </Form.Item>
                                        </div>
                                    ) : def.type === "burial" ? (
                                        <div className="grid grid-cols-2 gap-4">
                                            <Form.Item
                                                label="Cemetery"
                                                name={[def.key, "cemeteryCode"]}
                                                rules={[{ required: true, message: "Cemetery is required" }]}
                                            >
                                                <Select
                                                    showSearch
                                                    allowClear
                                                    loading={cemeteriesLoading}
                                                    placeholder="Select cemetery"
                                                    options={cemeteryOptions}
                                                    optionFilterProp="label"
                                                />
                                            </Form.Item>

                                            <Form.Item label="Grave Number" name={[def.key, "graveNumber"]}>
                                                <Input placeholder="Optional / if assigned" />
                                            </Form.Item>
                                        </div>
                                    ) : (
                                        <Form.Item label="Location" name={[def.key, "location"]}>
                                            <Input placeholder="Address / Location" />
                                        </Form.Item>
                                    )}

                                    <Form.Item label="Notes" name={[def.key, "notes"]}>
                                        <Input.TextArea rows={3} />
                                    </Form.Item>

                                    <Form.Item name={[def.key, "calendarEventId"]} hidden>
                                        <Input />
                                    </Form.Item>
                                    <Form.Item name={[def.key, "status"]} hidden>
                                        <Input />
                                    </Form.Item>
                                </div>
                            </Collapse.Panel>
                        ))}

                        <Collapse.Panel
                            header={<h4 className="uppercase !text-xs !font-bold !tracking-wider">{`${4 + MILESTONE_FORM.length}. Final Notes`}</h4>}
                            key="notes"
                        >
                            <div id="panel_notes">
                                <Form.Item label="Funeral Notes" name="notes">
                                    <Input.TextArea rows={4} placeholder="Internal notes (saved as Note[] with placeholder audit fields)" />
                                </Form.Item>
                            </div>
                        </Collapse.Panel>
                    </Collapse>
                </div>

                <div className="col-span-12 xl:col-span-4">
                    <div className="sticky top-4 shadow-sm rounded-md p-4 bg-white">
                        <CaseFileSummary onJump={jumpTo} cemeteryMap={cemeteryMap} />
                    </div>
                </div>
            </div>
        </Form>
    );
}
