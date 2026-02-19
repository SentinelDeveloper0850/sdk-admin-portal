"use client";

import { Button, Input, Select, Space, Table, Tag } from "antd";
import axios from "axios";
import dayjs from "dayjs";
import { useEffect, useMemo, useState } from "react";
import swal from "sweetalert";

import PageHeader from "@/app/components/page-header";

type Supplier = {
    _id: string;
    name: string;
};

const CATEGORY_OPTIONS = [
    "Laptop",
    "Desktop",
    "Monitor",
    "Printer",
    "Router",
    "Switch",
    "UPS",
    "Mobile Device",
    "Other",
].map((v) => ({ label: v, value: v }));

const STATUS_OPTIONS = [
    { label: "In Storage", value: "In Storage" },
    { label: "Assigned", value: "Assigned" },
];

const WARRANTY_OPTIONS = [
    { label: "30 days", value: 30 },
    { label: "60 days", value: 60 },
    { label: "90 days", value: 90 },
];

export default function AmsAssetsPage() {
    const [loading, setLoading] = useState(false);
    const [assets, setAssets] = useState<any[]>([]);

    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [loadingSuppliers, setLoadingSuppliers] = useState(false);

    // filters
    const [q, setQ] = useState("");
    const [category, setCategory] = useState<string | undefined>(undefined);
    const [status, setStatus] = useState<string | undefined>(undefined);
    const [supplierId, setSupplierId] = useState<string | undefined>(undefined);
    const [warrantyDays, setWarrantyDays] = useState<number | undefined>(undefined);

    const fetchSuppliers = async () => {
        setLoadingSuppliers(true);
        try {
            const res = await axios.get("/api/ams/suppliers", {
                params: { active: "true" },
            });

            if (!res.data?.success) throw new Error(res.data?.error || "Failed to fetch suppliers");
            setSuppliers(res.data.data || []);
        } catch (err: any) {
            swal({
                title: "Error",
                text: err?.message || "Failed to load suppliers",
                icon: "error",
            });
        } finally {
            setLoadingSuppliers(false);
        }
    };

    const fetchAssets = async () => {
        setLoading(true);
        try {
            const res = await axios.get("/api/ams/assets", {
                params: {
                    q: q || undefined,
                    category: category || undefined,
                    status: status || undefined,
                    supplierId: supplierId || undefined,
                    warrantyExpiringDays: warrantyDays || undefined,
                },
            });

            if (!res.data?.success) throw new Error(res.data?.error || "Failed to fetch assets");
            setAssets(res.data.data || []);
        } catch (err: any) {
            swal({
                title: "Error",
                text: err?.message || "Failed to load assets",
                icon: "error",
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSuppliers();
        fetchAssets();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const resetFilters = () => {
        setQ("");
        setCategory(undefined);
        setStatus(undefined);
        setSupplierId(undefined);
        setWarrantyDays(undefined);
        // fetch fresh
        setTimeout(fetchAssets, 0);
    };

    const supplierOptions = useMemo(
        () => suppliers.map((s) => ({ label: s.name, value: s._id })),
        [suppliers]
    );

    const columns = useMemo(
        () => [
            {
                title: "Asset Tag",
                dataIndex: "assetTag",
                key: "assetTag",
                render: (v: any) => <span style={{ fontFamily: "monospace" }}>{v || "-"}</span>,
            },
            {
                title: "Name",
                dataIndex: "name",
                key: "name",
                render: (v: any, r: any) => (
                    <div>
                        <div style={{ fontWeight: 600 }}>{v || "-"}</div>
                        <div style={{ fontSize: 12, opacity: 0.75 }}>
                            {r.brand || ""} {r.model ? `• ${r.model}` : ""}
                        </div>
                    </div>
                ),
            },
            {
                title: "Serial",
                dataIndex: "serialNumber",
                key: "serialNumber",
                render: (v: any) => <span style={{ fontFamily: "monospace" }}>{v || "-"}</span>,
            },
            {
                title: "Category",
                dataIndex: "category",
                key: "category",
                render: (v: any) => (v ? <Tag>{v}</Tag> : "-"),
            },
            {
                title: "Status",
                dataIndex: "status",
                key: "status",
                render: (v: any) =>
                    v === "Assigned" ? <Tag color="blue">Assigned</Tag> : <Tag color="green">In Storage</Tag>,
            },
            {
                title: "Warranty Expiry",
                dataIndex: "warrantyExpiryDate",
                key: "warrantyExpiryDate",
                render: (v: any) => (v ? dayjs(v).format("YYYY-MM-DD") : "-"),
            },
            {
                title: "Supplier",
                key: "supplier",
                render: (_: any, r: any) => r.supplierId?.name || "-",
            },
            {
                title: "Invoice",
                key: "invoice",
                render: (_: any, r: any) => {
                    const inv = r.invoiceId;
                    if (!inv) return "-";
                    return (
                        <div>
                            <div style={{ fontFamily: "monospace" }}>{inv.invoiceNumber || "-"}</div>
                            {inv.fileUrl ? (
                                <a href={inv.fileUrl} target="_blank" rel="noreferrer">
                                    View PDF
                                </a>
                            ) : null}
                        </div>
                    );
                },
            },
        ],
        []
    );

    return (
        <div className="p-4">
            <PageHeader
                title="Assets"
                subtitle="Track company assets captured from procurement"
                actions={[
                    <Button key="refresh" onClick={fetchAssets} loading={loading}>
                        Refresh
                    </Button>,
                ]}
            />

            <div>
                <Space wrap style={{ marginBottom: 16 }}>
                    <Input
                        placeholder="Search (tag / name / serial)..."
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                        onPressEnter={fetchAssets}
                        allowClear
                        style={{ width: 320 }}
                    />

                    <Select
                        placeholder="Category"
                        allowClear
                        value={category}
                        onChange={(v) => setCategory(v)}
                        options={CATEGORY_OPTIONS}
                        style={{ width: 180 }}
                    />

                    <Select
                        placeholder="Status"
                        allowClear
                        value={status}
                        onChange={(v) => setStatus(v)}
                        options={STATUS_OPTIONS}
                        style={{ width: 160 }}
                    />

                    <Select
                        placeholder="Supplier"
                        allowClear
                        showSearch
                        optionFilterProp="label"
                        loading={loadingSuppliers}
                        value={supplierId}
                        onChange={(v) => setSupplierId(v)}
                        options={supplierOptions}
                        style={{ width: 240 }}
                    />

                    <Select
                        placeholder="Warranty expiring"
                        allowClear
                        value={warrantyDays}
                        onChange={(v) => setWarrantyDays(v)}
                        options={WARRANTY_OPTIONS}
                        style={{ width: 200 }}
                    />

                    <Button type="primary" onClick={fetchAssets} loading={loading}>
                        Search
                    </Button>

                    <Button onClick={resetFilters} disabled={loading}>
                        Reset
                    </Button>
                </Space>

                <Table
                    rowKey={(r) => r._id}
                    loading={loading}
                    dataSource={assets}
                    columns={columns as any}
                    scroll={{ x: 1200 }}
                />
            </div>
        </div>
    );
}
