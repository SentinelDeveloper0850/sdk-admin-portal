"use client";

import { Button, Input, Space, Table, Tag } from "antd";
import axios from "axios";
import { useEffect, useMemo, useState } from "react";
import swal from "sweetalert";

import PageHeader from "@/app/components/page-header";
import { PlusOutlined, ReloadOutlined } from "@ant-design/icons";
import SupplierFormDrawer from "./components/supplier-form.drawer";

export default function AmsSuppliersPage() {
    const [loading, setLoading] = useState(false);
    const [suppliers, setSuppliers] = useState<any[]>([]);
    const [query, setQuery] = useState("");
    const [drawerOpen, setDrawerOpen] = useState(false);

    const fetchSuppliers = async () => {
        setLoading(true);
        try {
            const res = await axios.get("/api/ams/suppliers", {
                params: { query, active: "true" },
            });

            if (!res.data?.success) throw new Error(res.data?.error || "Failed");
            setSuppliers(res.data.data || []);
        } catch (err: any) {
            swal({
                title: "Error",
                text: err?.message || "Failed to load suppliers",
                icon: "error",
            })
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSuppliers();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const columns = useMemo(
        () => [
            {
                title: "Supplier",
                dataIndex: "name",
                key: "name",
            },
            {
                title: "Contact",
                key: "contact",
                render: (_: any, r: any) =>
                    [r.contactName, r.contactEmail, r.contactPhone].filter(Boolean).join(" • ") || "-",
            },
            {
                title: "Default Warranty",
                dataIndex: "defaultWarrantyMonths",
                key: "defaultWarrantyMonths",
                render: (v: any) => (typeof v === "number" ? `${v} months` : "-"),
            },
            {
                title: "Status",
                dataIndex: "isActive",
                key: "isActive",
                render: (v: boolean) => (v ? <Tag color="green">Active</Tag> : <Tag>Inactive</Tag>),
            },
        ],
        []
    );

    return (
        <div style={{ padding: 16 }}>
            <PageHeader
                title="Suppliers"
                subtitle="Manage your suppliers and their details"
                actions={[
                    <Button
                        key="refresh"
                        onClick={() => fetchSuppliers()}
                        icon={<ReloadOutlined />}
                        loading={loading}
                    >
                        Refresh
                    </Button>,
                    <Button
                        key="add"
                        onClick={() => setDrawerOpen(true)}
                        icon={<PlusOutlined />}
                    >
                        Add Supplier
                    </Button>,
                ]}
            />
            <Space style={{ marginBottom: 16, width: "100%", justifyContent: "space-between" }}>
                <Space>
                    <Input
                        placeholder="Search suppliers..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onPressEnter={fetchSuppliers}
                        style={{ width: 320 }}
                        allowClear
                    />
                    <Button onClick={fetchSuppliers} loading={loading}>
                        Search
                    </Button>
                </Space>
            </Space>

            <Table
                rowKey={(r) => r._id}
                loading={loading}
                dataSource={suppliers}
                columns={columns as any}
            />

            <SupplierFormDrawer
                open={drawerOpen}
                onClose={() => setDrawerOpen(false)}
                onSaved={() => {
                    setDrawerOpen(false);
                    fetchSuppliers();
                }}
            />
        </div>
    );
}
