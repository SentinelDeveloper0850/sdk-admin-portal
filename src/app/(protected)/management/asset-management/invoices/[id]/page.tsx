"use client";

import { Button, Descriptions, Space, Table, Tag } from "antd";
import axios from "axios";
import dayjs from "dayjs";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import swal from "sweetalert";

import PageHeader from "@/app/components/page-header";
import { formatToMoneyWithCurrency } from "@/utils/formatters";

export default function AmsInvoiceDetailsPage() {
    const router = useRouter();
    const params = useParams<{ id: string }>();
    const invoiceId = params?.id;

    const [loading, setLoading] = useState(false);
    const [invoice, setInvoice] = useState<any>(null);
    const [assets, setAssets] = useState<any[]>([]);
    const [assetCount, setAssetCount] = useState(0);

    const fetchDetails = async () => {
        if (!invoiceId) return;

        setLoading(true);
        try {
            const res = await axios.get(`/api/ams/invoices/${invoiceId}`);

            if (!res.data?.success) {
                throw new Error(res.data?.error || "Failed to fetch invoice");
            }

            setInvoice(res.data.data.invoice);
            setAssets(res.data.data.assets || []);
            setAssetCount(res.data.data.assetCount || 0);
        } catch (err: any) {
            swal({
                title: "Error",
                text: err?.message || "Failed to load invoice details",
                icon: "error",
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDetails();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [invoiceId]);

    const assetColumns = useMemo(
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
                title: "Price",
                dataIndex: "purchasePrice",
                key: "purchasePrice",
                render: (v: any) => (typeof v === "number" ? `${formatToMoneyWithCurrency(v)}` : "-"),
            },
        ],
        []
    );

    const supplier = invoice?.supplierId;

    return (
        <div className="p-4">
            <PageHeader
                title="Invoice Details" isChild
                subtitle={
                    invoice
                        ? `${supplier?.name || "Supplier"} • ${invoice.invoiceNumber || "-"} • ${assetCount} asset(s)`
                        : "Loading invoice..."
                }
                actions={[
                    invoice?.fileUrl ? (
                        <Button
                            key="pdf"
                            onClick={() => window.open(invoice.fileUrl, "_blank")}
                        >
                            View PDF
                        </Button>
                    ) : null,
                ].filter(Boolean) as any}
            >
                <Descriptions
                    bordered
                    size="small"
                    column={2}
                >
                    <Descriptions.Item label="Supplier">
                        {supplier?.name || "-"}
                    </Descriptions.Item>

                    <Descriptions.Item label="Invoice Number">
                        <span style={{ fontFamily: "monospace" }}>
                            {invoice?.invoiceNumber || "-"}
                        </span>
                    </Descriptions.Item>

                    <Descriptions.Item label="Purchase Date">
                        {invoice?.purchaseDate ? dayjs(invoice.purchaseDate).format("YYYY-MM-DD") : "-"}
                    </Descriptions.Item>

                    <Descriptions.Item label="Total Amount">
                        {typeof invoice?.totalAmount === "number"
                            ? `${formatToMoneyWithCurrency(invoice.totalAmount) ?? "-"}`
                            : "-"}
                    </Descriptions.Item>

                    <Descriptions.Item label="Contact">
                        {[supplier?.contactName, supplier?.contactEmail, supplier?.contactPhone]
                            .filter(Boolean)
                            .join(" • ") || "-"}
                    </Descriptions.Item>

                    <Descriptions.Item label="Notes">
                        {invoice?.notes || "-"}
                    </Descriptions.Item>
                </Descriptions>
            </PageHeader>

            <div>
                <Space style={{ marginBottom: 8 }}>
                    <h3 style={{ margin: 0 }}>Assets on this invoice</h3>
                    <Tag color="geekblue">{assetCount}</Tag>
                    <Button size="small" onClick={fetchDetails} loading={loading}>
                        Refresh
                    </Button>
                </Space>

                <Table
                    rowKey={(r) => r._id}
                    loading={loading}
                    dataSource={assets}
                    columns={assetColumns as any}
                    scroll={{ x: 1100 }}
                />
            </div>
        </div>
    );
}
