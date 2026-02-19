"use client";

import type { UploadProps } from "antd";
import { Button, DatePicker, Form, Input, InputNumber, Select, Space, Table, Upload } from "antd";
import axios from "axios";
import dayjs from "dayjs";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import swal from "sweetalert";

import PageHeader from "@/app/components/page-header";
import { ERoles } from "@/types/roles.enum";
import { withRoleGuard } from "@/utils/utils/with-role-guard";

type Supplier = {
    _id: string;
    name: string;
    defaultWarrantyMonths?: number;
};

type AssetRow = {
    key: string;
    name?: string;
    category?: string;
    brand?: string;
    model?: string;
    serialNumber?: string;
    purchasePrice?: number;
    warrantyMonths?: number;
    notes?: string;
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

const AmsNewInvoiceIntakePage = () => {
    const router = useRouter();

    const [form] = Form.useForm();

    const [loadingSuppliers, setLoadingSuppliers] = useState(false);
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);

    const [invoiceUploading, setInvoiceUploading] = useState(false);
    const [invoiceFile, setInvoiceFile] = useState<{ url: string; publicId: string } | null>(null);

    const [submitting, setSubmitting] = useState(false);

    const [assetRows, setAssetRows] = useState<AssetRow[]>([
        { key: crypto.randomUUID() },
    ]);

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

    useEffect(() => {
        fetchSuppliers();
    }, []);

    const supplierOptions = useMemo(
        () => suppliers.map((s) => ({ label: s.name, value: s._id })),
        [suppliers]
    );

    const onSupplierChange = (supplierId: string) => {
        const s = suppliers.find((x) => x._id === supplierId) || null;
        setSelectedSupplier(s);

        // If rows have empty warrantyMonths, prefill from supplier default
        if (s?.defaultWarrantyMonths != null) {
            setAssetRows((prev) =>
                prev.map((r) => ({
                    ...r,
                    warrantyMonths: r.warrantyMonths ?? s.defaultWarrantyMonths,
                }))
            );
        }
    };

    const uploadInvoicePdf = async (file: File) => {
        setInvoiceUploading(true);
        try {
            const fd = new FormData();
            fd.append("file", file);

            const res = await axios.post("/api/upload/ams-invoices", fd, {
                headers: { "Content-Type": "multipart/form-data" },
            });

            if (!res.data?.success) throw new Error(res.data?.message || "Upload failed");

            const { url, publicId } = res.data.data;
            setInvoiceFile({ url, publicId });

            swal({
                title: "Uploaded",
                text: "Invoice uploaded successfully",
                icon: "success",
            });
        } catch (err: any) {
            setInvoiceFile(null);
            swal({
                title: "Upload Failed",
                text: err?.message || "Failed to upload invoice",
                icon: "error",
            });
        } finally {
            setInvoiceUploading(false);
        }
    };

    const uploadProps: UploadProps = {
        accept: "application/pdf",
        maxCount: 1,
        beforeUpload: async (file) => {
            // block auto upload; we handle ourselves
            if (file.type !== "application/pdf") {
                swal({
                    title: "Invalid File",
                    text: "Only PDF files are allowed",
                    icon: "error",
                });
                return Upload.LIST_IGNORE;
            }

            await uploadInvoicePdf(file as File);
            return false;
        },
        onRemove: () => {
            setInvoiceFile(null);
        },
    };

    const addRow = () => setAssetRows((prev) => [...prev, { key: crypto.randomUUID(), warrantyMonths: selectedSupplier?.defaultWarrantyMonths }]);
    const removeRow = (key: string) => setAssetRows((prev) => prev.filter((r) => r.key !== key));

    const setRow = (key: string, patch: Partial<AssetRow>) => {
        setAssetRows((prev) => prev.map((r) => (r.key === key ? { ...r, ...patch } : r)));
    };

    const validateBeforeSubmit = () => {
        const values = form.getFieldsValue();

        if (!values.supplierId) return "Supplier is required";
        if (!values.invoiceNumber?.trim()) return "Invoice number is required";
        if (!values.purchaseDate) return "Purchase date is required";
        if (!invoiceFile?.url) return "Invoice PDF upload is required";

        if (!assetRows.length) return "At least one asset row is required";

        for (let i = 0; i < assetRows.length; i++) {
            const r = assetRows[i];
            if (!r.name?.trim()) return `Row ${i + 1}: Asset name is required`;
            if (!r.category) return `Row ${i + 1}: Category is required`;
            if (!r.serialNumber?.trim()) return `Row ${i + 1}: Serial number is required`;
        }

        // local duplicate serial check (case-insensitive)
        const seen = new Set<string>();
        for (let i = 0; i < assetRows.length; i++) {
            const serial = (assetRows[i].serialNumber || "").trim().toLowerCase();
            if (seen.has(serial)) return `Duplicate serial number in rows: "${assetRows[i].serialNumber}"`;
            seen.add(serial);
        }

        return null;
    };

    const submitIntake = async () => {
        const err = validateBeforeSubmit();
        if (err) {
            swal({ title: "Missing Info", text: err, icon: "error" });
            return;
        }

        setSubmitting(true);
        try {
            const values = await form.validateFields();

            const supplierId = values.supplierId as string;
            const invoiceNumber = values.invoiceNumber.trim();
            const purchaseDateIso = dayjs(values.purchaseDate).toISOString();
            const totalAmount = typeof values.totalAmount === "number" ? values.totalAmount : undefined;
            const notes = values.notes?.trim();

            // 1) Create invoice
            const invoiceRes = await axios.post("/api/ams/invoices", {
                supplierId,
                invoiceNumber,
                purchaseDate: purchaseDateIso,
                totalAmount,
                notes,
                fileUrl: invoiceFile!.url,
                filePublicId: invoiceFile!.publicId,
            });

            if (!invoiceRes.data?.success) {
                throw new Error(invoiceRes.data?.error || "Failed to create invoice");
            }

            const invoiceId = invoiceRes.data.data?._id;
            if (!invoiceId) throw new Error("Invoice created but no invoiceId returned");

            // 2) Bulk create assets
            const assetsPayload = assetRows.map((r) => ({
                name: r.name?.trim(),
                category: r.category,
                brand: r.brand?.trim(),
                model: r.model?.trim(),
                serialNumber: r.serialNumber?.trim(),
                purchasePrice: typeof r.purchasePrice === "number" ? r.purchasePrice : undefined,
                warrantyMonths: typeof r.warrantyMonths === "number" ? r.warrantyMonths : undefined,
                notes: r.notes?.trim(),
            }));

            const bulkRes = await axios.post("/api/ams/assets/bulk", {
                invoiceId,
                supplierId,
                purchaseDate: purchaseDateIso,
                assets: assetsPayload,
            });

            if (!bulkRes.data?.success) {
                throw new Error(bulkRes.data?.error || "Failed to register assets");
            }

            swal({
                title: "Success",
                text: `Invoice created and ${bulkRes.data.count || assetsPayload.length} asset(s) registered.`,
                icon: "success",
            });

            router.push("/management/asset-management/assets");
        } catch (e: any) {
            swal({
                title: "Error",
                text: e?.message || "Failed to complete intake",
                icon: "error",
            });
        } finally {
            setSubmitting(false);
        }
    };

    const columns = useMemo(
        () => [
            {
                title: "Name",
                dataIndex: "name",
                render: (_: any, r: AssetRow) => (
                    <Input
                        value={r.name}
                        onChange={(e) => setRow(r.key, { name: e.target.value })}
                        placeholder="e.g. Dell OptiPlex"
                    />
                ),
            },
            {
                title: "Category",
                dataIndex: "category",
                width: 160,
                render: (_: any, r: AssetRow) => (
                    <Select
                        value={r.category}
                        onChange={(v) => setRow(r.key, { category: v })}
                        options={CATEGORY_OPTIONS}
                        placeholder="Select"
                        style={{ width: "100%" }}
                    />
                ),
            },
            {
                title: "Brand",
                dataIndex: "brand",
                width: 160,
                render: (_: any, r: AssetRow) => (
                    <Input value={r.brand} onChange={(e) => setRow(r.key, { brand: e.target.value })} />
                ),
            },
            {
                title: "Model",
                dataIndex: "model",
                width: 160,
                render: (_: any, r: AssetRow) => (
                    <Input value={r.model} onChange={(e) => setRow(r.key, { model: e.target.value })} />
                ),
            },
            {
                title: "Serial #",
                dataIndex: "serialNumber",
                width: 200,
                render: (_: any, r: AssetRow) => (
                    <Input
                        value={r.serialNumber}
                        onChange={(e) => setRow(r.key, { serialNumber: e.target.value })}
                        placeholder="Required"
                    />
                ),
            },
            {
                title: "Price",
                dataIndex: "purchasePrice",
                width: 140,
                render: (_: any, r: AssetRow) => (
                    <InputNumber
                        value={r.purchasePrice}
                        onChange={(v) => setRow(r.key, { purchasePrice: typeof v === "number" ? v : undefined })}
                        style={{ width: "100%" }}
                        min={0}
                    />
                ),
            },
            {
                title: "Warranty (months)",
                dataIndex: "warrantyMonths",
                width: 170,
                render: (_: any, r: AssetRow) => (
                    <InputNumber
                        value={r.warrantyMonths}
                        onChange={(v) => setRow(r.key, { warrantyMonths: typeof v === "number" ? v : undefined })}
                        style={{ width: "100%" }}
                        min={0}
                        placeholder={selectedSupplier?.defaultWarrantyMonths != null ? String(selectedSupplier.defaultWarrantyMonths) : "—"}
                    />
                ),
            },
            {
                title: "Notes",
                dataIndex: "notes",
                width: 200,
                render: (_: any, r: AssetRow) => (
                    <Input value={r.notes} onChange={(e) => setRow(r.key, { notes: e.target.value })} />
                ),
            },
            {
                title: "",
                key: "actions",
                width: 90,
                render: (_: any, r: AssetRow) => (
                    <Button danger onClick={() => removeRow(r.key)} disabled={assetRows.length <= 1}>
                        Remove
                    </Button>
                ),
            },
        ],
        [assetRows.length, selectedSupplier?.defaultWarrantyMonths]
    );

    return (
        <div className="p-4">
            <PageHeader
                title="New Intake"
                subtitle="Upload an invoice and register assets purchased"
                actions={[
                    <Button key="addrow" onClick={addRow}>
                        Add Row
                    </Button>,
                    <Button
                        key="submit"
                        type="primary"
                        loading={submitting}
                        onClick={submitIntake}
                    >
                        Submit Intake
                    </Button>,
                ]}
            />

            <div>
                <Form form={form} layout="vertical">
                    <Space size={16} style={{ width: "100%", alignItems: "flex-start" }} wrap>
                        <Form.Item
                            label="Supplier"
                            name="supplierId"
                            rules={[{ required: true, message: "Supplier is required" }]}
                            style={{ width: 320 }}
                        >
                            <Select
                                loading={loadingSuppliers}
                                options={supplierOptions}
                                showSearch
                                optionFilterProp="label"
                                placeholder="Select supplier"
                                onChange={onSupplierChange}
                            />
                        </Form.Item>

                        <Form.Item
                            label="Invoice Number"
                            name="invoiceNumber"
                            rules={[{ required: true, message: "Invoice number is required" }]}
                            style={{ width: 260 }}
                        >
                            <Input placeholder="e.g. INV-12345" />
                        </Form.Item>

                        <Form.Item
                            label="Purchase Date"
                            name="purchaseDate"
                            rules={[{ required: true, message: "Purchase date is required" }]}
                            style={{ width: 220 }}
                        >
                            <DatePicker style={{ width: "100%" }} />
                        </Form.Item>

                        <Form.Item label="Total Amount (optional)" name="totalAmount" style={{ width: 220 }}>
                            <InputNumber min={0} style={{ width: "100%" }} />
                        </Form.Item>
                    </Space>

                    <Form.Item label="Invoice PDF (required)">
                        <Upload {...uploadProps}>
                            <Button loading={invoiceUploading}>
                                {invoiceFile?.url ? "Replace PDF" : "Upload PDF"}
                            </Button>
                        </Upload>

                        {invoiceFile?.url ? (
                            <div style={{ marginTop: 8, fontSize: 12 }}>
                                Uploaded: <a href={invoiceFile.url} target="_blank" rel="noreferrer">View invoice</a>
                            </div>
                        ) : null}
                    </Form.Item>

                    <Form.Item label="Notes" name="notes">
                        <Input.TextArea rows={2} placeholder="Optional notes about this procurement" />
                    </Form.Item>
                </Form>

                <div style={{ marginTop: 16 }}>
                    <Table
                        rowKey="key"
                        dataSource={assetRows}
                        columns={columns as any}
                        pagination={false}
                        scroll={{ x: 1400 }}
                    />
                </div>
            </div>
        </div>
    );
}

export default withRoleGuard(AmsNewInvoiceIntakePage, [ERoles.Admin, ERoles.ITManager, ERoles.ProcurementManager, ERoles.FinanceManager]);