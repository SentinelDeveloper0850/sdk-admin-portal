"use client";

import { Button, Input, Space, Table } from "antd";
import axios from "axios";
import dayjs from "dayjs";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import swal from "sweetalert";

import PageHeader from "@/app/components/page-header";
import { ERoles } from "@/types/roles.enum";
import { withRoleGuard } from "@/utils/utils/with-role-guard";

const AmsInvoicesPage = () => {
    const router = useRouter();

    const [loading, setLoading] = useState(false);
    const [invoices, setInvoices] = useState<any[]>([]);
    const [query, setQuery] = useState("");

    const fetchInvoices = async () => {
        setLoading(true);
        try {
            const res = await axios.get("/api/ams/invoices", {
                params: { q: query },
            });

            if (!res.data?.success) {
                throw new Error(res.data?.error || "Failed to fetch invoices");
            }

            setInvoices(res.data.data || []);
        } catch (err: any) {
            swal({
                title: "Error",
                text: err?.message || "Failed to load invoices",
                icon: "error",
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInvoices();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const columns = useMemo(
        () => [
            {
                title: "Invoice #",
                dataIndex: "invoiceNumber",
                key: "invoiceNumber",
            },
            {
                title: "Supplier",
                key: "supplier",
                render: (_: any, r: any) => r.supplierId?.name || "-",
            },
            {
                title: "Purchase Date",
                dataIndex: "purchaseDate",
                key: "purchaseDate",
                render: (v: any) => (v ? dayjs(v).format("YYYY-MM-DD") : "-"),
            },
            {
                title: "Total Amount",
                dataIndex: "totalAmount",
                key: "totalAmount",
                render: (v: any) =>
                    typeof v === "number"
                        ? `R ${v.toLocaleString()}`
                        : "-",
            },
            {
                title: "Invoice PDF",
                key: "pdf",
                render: (_: any, r: any) =>
                    r.fileUrl ? (
                        <a href={r.fileUrl} target="_blank" rel="noreferrer">
                            View
                        </a>
                    ) : (
                        "-"
                    ),
            },
            {
                title: "",
                key: "actions",
                render: (_: any, r: any) => (
                    <Button
                        size="small"
                        onClick={() =>
                            router.push(
                                `/management/asset-management/invoices/${r._id}`
                            )
                        }
                    >
                        View
                    </Button>
                ),
            },
        ],
        [router]
    );

    return (
        <div className="p-4">
            <PageHeader
                title="Purchase Invoices"
                subtitle="View and manage procurement invoices"
                actions={[
                    <Button
                        key="new"
                        type="primary"
                        onClick={() =>
                            router.push(
                                "/management/asset-management/invoices/new"
                            )
                        }
                    >
                        New Intake
                    </Button>,
                ]}
            />

            <div>
                <Space style={{ marginBottom: 16 }}>
                    <Input
                        placeholder="Search invoices..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onPressEnter={fetchInvoices}
                        allowClear
                        style={{ width: 320 }}
                    />
                    <Button onClick={fetchInvoices} loading={loading}>
                        Search
                    </Button>
                </Space>

                <Table
                    rowKey={(r) => r._id}
                    loading={loading}
                    dataSource={invoices}
                    columns={columns as any}
                />
            </div>
        </div>
    );
}

export default withRoleGuard(AmsInvoicesPage, [ERoles.Admin, ERoles.ITManager, ERoles.ProcurementManager, ERoles.FinanceManager]);