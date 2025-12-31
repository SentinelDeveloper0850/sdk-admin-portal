// src/app/components/funerals/CaseFileSummary.tsx
"use client";

import type { IFuneral } from "@/types/funeral";
import { CalendarOutlined, CopyOutlined, WhatsAppOutlined } from "@ant-design/icons";
import { Button, Divider, Form, Popover, Space, Tag, Typography } from "antd";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

const { Text, Title } = Typography;

type MilestoneKey = "pickUp" | "bathing" | "tentErection" | "delivery" | "serviceEscort" | "burial";

const MILESTONES: Array<{ key: MilestoneKey; label: string }> = [
    { key: "pickUp", label: "Pickup" },
    { key: "bathing", label: "Bathing" },
    { key: "tentErection", label: "Tent" },
    { key: "delivery", label: "Delivery" },
    { key: "serviceEscort", label: "Escort" },
    { key: "burial", label: "Burial" },
];

// Form key -> canonical milestone.type
const KEY_TO_TYPE: Record<MilestoneKey, string> = {
    pickUp: "pickup",
    bathing: "bathing",
    tentErection: "tent_erection",
    delivery: "delivery",
    serviceEscort: "escort",
    burial: "burial",
};

const fmtDT = (d?: any) => {
    if (!d) return "—";
    const x = dayjs(d);
    if (!x.isValid()) return "—";
    return x.format("ddd, D MMM YYYY • HH:mm");
};

const rel = (d?: any) => {
    if (!d) return "";
    const x = dayjs(d);
    if (!x.isValid()) return "";
    return `(${x.from(dayjs())})`;
};

const copy = async (text?: string) => {
    try {
        if (!text) return;
        await navigator.clipboard.writeText(text);
    } catch {
        // ignore
    }
};

function waLinkFromPhone(phone?: string) {
    if (!phone) return undefined;

    const clean = String(phone).replace(/\s/g, "").replace(/[()-]/g, "");
    const digits = clean.replace(/^\+/, "");

    // If it's already E.164 ZA (27xxxxxxxxx)
    if (/^27\d{9}$/.test(digits)) return `https://wa.me/${digits}`;

    // If it's the 9-digit local form input (xxxxxxxxx)
    if (/^\d{9}$/.test(digits)) return `https://wa.me/27${digits}`;

    // If user somehow pasted 0xxxxxxxxx
    if (/^0\d{9}$/.test(digits)) return `https://wa.me/27${digits.slice(1)}`;

    return undefined;
}

function milestoneFromRecord(record: IFuneral | null | undefined, key: MilestoneKey) {
    if (!record) return undefined;
    const type = KEY_TO_TYPE[key];
    const list = Array.isArray((record as any).milestones) ? (record as any).milestones : [];
    return list.find((m: any) => String(m?.type) === type);
}

export default function CaseFileSummary({
    record,
    readOnly = false,
    onJump,
    calendarLink = "/calendar",
    cemeteryMap,
}: {
    record?: IFuneral | null;
    readOnly?: boolean;
    onJump?: (panelKey: string) => void;
    calendarLink?: string;
    cemeteryMap?: Record<string, string>;
}) {
    const form = Form.useFormInstance?.();
    const usingForm = !record && !!form;

    // helper to read from either record or form
    const get = (path: any, fallback?: any) => {
        if (record) {
            const parts = String(path).split(".");
            let cur: any = record;
            for (const p of parts) cur = cur?.[p];
            return cur ?? fallback;
        }
        if (usingForm) {
            return Form.useWatch(path, form) ?? fallback;
        }
        return fallback;
    };

    const referenceNumber = get("referenceNumber");
    const policyNumber = get("policyNumber");
    const branchId = get("branchId");

    const deceasedFirstName = record ? record.deceased?.firstName : get("deceasedFirstName");
    const deceasedLastName = record ? record.deceased?.lastName : get("deceasedLastName");

    const informantFirstName = record ? record.informant?.firstName : get("informantFirstName");
    const informantLastName = record ? record.informant?.lastName : get("informantLastName");
    const informantPhone = record ? record.informant?.phoneNumber : get("informantPhoneNumber");

    const status = (get("status") as string) || "draft";
    const paymentStatus = get("paymentStatus");

    const estimatedCost = get("estimatedCost");
    const actualCost = get("actualCost");

    const deceasedName = `${deceasedFirstName ?? ""} ${deceasedLastName ?? ""}`.trim() || "—";
    const informantName = `${informantFirstName ?? ""} ${informantLastName ?? ""}`.trim() || "—";

    // ✅ Canonical milestone values:
    // - in edit/list drawer mode: read from record.milestones[]
    // - in create/edit form mode: read from Form values (pickUp/bathing/...)
    const milestoneValues: Record<MilestoneKey, any> = record
        ? {
            pickUp: milestoneFromRecord(record, "pickUp") || {},
            bathing: milestoneFromRecord(record, "bathing") || {},
            tentErection: milestoneFromRecord(record, "tentErection") || {},
            delivery: milestoneFromRecord(record, "delivery") || {},
            serviceEscort: milestoneFromRecord(record, "serviceEscort") || {},
            burial: milestoneFromRecord(record, "burial") || {},
        }
        : {
            pickUp: Form.useWatch("pickUp", form),
            bathing: Form.useWatch("bathing", form),
            tentErection: Form.useWatch("tentErection", form),
            delivery: Form.useWatch("delivery", form),
            serviceEscort: Form.useWatch("serviceEscort", form),
            burial: Form.useWatch("burial", form),
        };

    const enabledWithDates = MILESTONES
        .map((m) => {
            const v = milestoneValues[m.key] || {};
            return { ...m, enabled: !!v.enabled, startDateTime: v.startDateTime };
        })
        .filter((m) => m.enabled && !!m.startDateTime)
        .sort((a, b) => new Date(a.startDateTime).getTime() - new Date(b.startDateTime).getTime());

    const next = enabledWithDates[0];

    // Burial details (from Burial milestone)
    const burial = milestoneValues.burial || {};
    const cemeteryCode = burial?.cemeteryCode;
    const graveNumber = burial?.graveNumber;
    const cemeteryName = cemeteryCode ? (cemeteryMap?.[cemeteryCode] ?? cemeteryCode) : "—";

    const warnings: Array<{ text: string; jumpKey?: string }> = [];
    if (!branchId) warnings.push({ text: "Branch not selected", jumpKey: "3" });

    for (const m of MILESTONES) {
        const v = milestoneValues[m.key] || {};
        if (v?.enabled && !v?.startDateTime) warnings.push({ text: `${m.label} enabled but no date/time`, jumpKey: `m_${m.key}` });
    }

    const escort = milestoneValues.serviceEscort || {};
    if (escort?.enabled) {
        if (!escort?.origin) warnings.push({ text: "Escort enabled but origin missing", jumpKey: "m_serviceEscort" });
        if (!escort?.destination) warnings.push({ text: "Escort enabled but destination missing", jumpKey: "m_serviceEscort" });
    }

    const delta =
        typeof estimatedCost === "number" && typeof actualCost === "number"
            ? actualCost - estimatedCost
            : undefined;

    const wa = waLinkFromPhone(informantPhone);

    return (
        <>
            <div className="flex items-start justify-between gap-3">
                <div>
                    <Title level={5} style={{ margin: 0 }}>
                        Funeral File Summary
                    </Title>
                    <Text type="secondary" className="block">
                        {readOnly ? "Preview mode" : "Live preview"}
                    </Text>
                </div>

                <Button icon={<CalendarOutlined />} onClick={() => window.open(calendarLink, "_blank")}>
                    Calendar
                </Button>
            </div>

            <Divider className="!my-3" />

            <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                    <Text strong>Reference</Text>
                    <Space size={6}>
                        <Text code>{referenceNumber || "Auto"}</Text>
                        <Button size="small" icon={<CopyOutlined />} onClick={() => copy(referenceNumber)} />
                    </Space>
                </div>

                <div className="flex items-center justify-between gap-2">
                    <Text strong>Deceased</Text>
                    <Text>{deceasedName}</Text>
                </div>

                <div className="flex items-center justify-between gap-2">
                    <Text strong>Informant</Text>
                    <Space size={8}>
                        <Text>{informantName}</Text>
                        {wa ? (
                            <Popover
                                content={
                                    <div>
                                        <h4 className="text-xs font-medium">Open in WhatsApp</h4>
                                        <p className="text-xs text-gray-500">{wa}</p>
                                    </div>
                                }
                                trigger="hover"
                            >
                                <Button
                                    size="small"
                                    className="hover:!border-[#25D366]"
                                    icon={<WhatsAppOutlined style={{ color: "#25D366" }} />}
                                    onClick={() => window.open(wa, "_blank")}
                                />
                            </Popover>
                        ) : null}
                    </Space>
                </div>

                <div className="flex items-center justify-between gap-2">
                    <Text strong>Branch</Text>
                    <Text>{branchId || "—"}</Text>
                </div>

                <div className="flex items-center justify-between gap-2">
                    <Text strong>Policy #</Text>
                    <Text>{policyNumber || "—"}</Text>
                </div>
            </div>

            <Divider className="!my-3 !text-xs !uppercase !italic">Burial Details</Divider>

            <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                    <Text strong>Cemetery</Text>
                    <Text>{cemeteryName}</Text>
                </div>

                <div className="flex items-center justify-between gap-2">
                    <Text strong>Grave #</Text>
                    <Text>{graveNumber || "—"}</Text>
                </div>
            </div>

            <Divider className="!my-3" />

            <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                    <Text strong>Status</Text>
                    <Tag>{String(status)}</Tag>
                </div>

                <div className="flex items-center justify-between gap-2">
                    <Text strong>Payment</Text>
                    <Tag>{paymentStatus ? String(paymentStatus) : "—"}</Tag>
                </div>

                {typeof delta === "number" ? (
                    <div className="flex items-center justify-between gap-2">
                        <Text strong>Delta</Text>
                        <Text type={delta > 0 ? "danger" : delta < 0 ? "success" : undefined}>
                            {delta === 0 ? "R 0" : `R ${delta.toLocaleString()}`}
                        </Text>
                    </div>
                ) : null}
            </div>

            <Divider className="!my-3" />

            <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                    <Text strong>Next Task</Text>
                    <Text>{next ? `${next.label}` : "—"}</Text>
                </div>
                <div className="flex items-center justify-between gap-2">
                    <Text strong>Date</Text>
                    <Text>
                        {next?.startDateTime ? (
                            <>
                                {fmtDT(next.startDateTime)} <Text type="secondary">{rel(next.startDateTime)}</Text>
                            </>
                        ) : (
                            "—"
                        )}
                    </Text>
                </div>
            </div>

            <Divider className="!my-3 !text-xs !uppercase !italic">Milestones</Divider>

            <div className="space-y-2">
                <div className="space-y-1">
                    {MILESTONES.map((m) => {
                        const v = milestoneValues[m.key] || {};
                        const enabled = !!v.enabled;
                        const dt = v.startDateTime;

                        const burialCemeteryInline =
                            m.key === "burial" && v?.cemeteryCode
                                ? (cemeteryMap?.[v.cemeteryCode] ?? v.cemeteryCode)
                                : "";

                        return (
                            <div key={m.key} className="flex items-center justify-between gap-2">
                                {!readOnly && onJump ? (
                                    <Button type="link" style={{ padding: 0, height: "auto" }} onClick={() => onJump(`m_${m.key}`)}>
                                        {m.label}
                                    </Button>
                                ) : (
                                    <Text>{m.label}</Text>
                                )}

                                <Space size={8}>
                                    <Text type="secondary">
                                        {enabled && dt ? dayjs(dt).format("D MMM HH:mm") : ""}
                                        {enabled && dt && burialCemeteryInline ? ` • ${burialCemeteryInline}` : ""}
                                    </Text>
                                    <Tag color={!enabled ? "default" : dt ? "blue" : "gold"}>
                                        {!enabled ? "Off" : dt ? "Scheduled" : "Needs time"}
                                    </Tag>
                                </Space>
                            </div>
                        );
                    })}
                </div>
            </div>

            {warnings.length ? (
                <>
                    <Divider className="!my-3 !text-xs !uppercase !italic !text-red-500">Warnings</Divider>
                    <div className="space-y-1">
                        {warnings.slice(0, 6).map((w, idx) => (
                            <div key={idx} className="flex items-start justify-between gap-2">
                                <Text type="danger">{w.text}</Text>
                                {!readOnly && w.jumpKey && onJump ? (
                                    <Button size="small" onClick={() => onJump(w.jumpKey!)}>
                                        Fix
                                    </Button>
                                ) : null}
                            </div>
                        ))}
                    </div>
                </>
            ) : null}
        </>
    );
}
