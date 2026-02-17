"use client";

import { useEffect, useMemo, useState } from "react";

import PageHeader from "@/app/components/page-header";
import { useAuth } from "@/context/auth-context";
import { PlusOutlined, ReloadOutlined, UploadOutlined } from "@ant-design/icons";
import {
    Button,
    Drawer,
    Form,
    Input,
    Select,
    Space,
    Switch,
    Table,
    Tag,
    Upload
} from "antd";
import type { ColumnsType } from "antd/es/table";
import type { UploadFile } from "antd/es/upload/interface";
import dayjs from "dayjs";
import swal from "sweetalert";

type Category =
    | "FORMS"
    | "CLAIMS"
    | "TERMS"
    | "POLICIES"
    | "HR"
    | "BRANCH_OPS"
    | "OTHER";

type DmsCurrentVersion = {
    _id: string;
    fileUrl: string;
    mimeType: string;
    versionNumber: number;
    uploadedAt?: string;
    notes?: string;
};

type DmsDoc = {
    _id: string;
    title: string;
    slug: string;
    baseSlug?: string;
    category: Category;
    regionId?: string | null;
    isActive: boolean;
    updatedAt?: string;
    updatedBy?: {
        firstName?: string;
        lastName?: string;
        name?: string;
        email?: string;
    };
    currentVersionId?: string;
    currentVersion?: DmsCurrentVersion | null;
};

type Region = { _id: string; name?: string; code?: string };

const CATEGORY_OPTIONS: { value: Category; label: string }[] = [
    { value: "FORMS", label: "Forms" },
    { value: "CLAIMS", label: "Claims" },
    { value: "TERMS", label: "Terms & Conditions" },
    { value: "POLICIES", label: "Policies" },
    { value: "HR", label: "HR" },
    { value: "BRANCH_OPS", label: "Branch Ops" },
    { value: "OTHER", label: "Other" },
];

function prettyCategory(cat: Category) {
    const map: Record<Category, string> = {
        FORMS: "Forms",
        CLAIMS: "Claims",
        TERMS: "Terms",
        POLICIES: "Policies",
        HR: "HR",
        BRANCH_OPS: "Branch Ops",
        OTHER: "Other",
    };
    return map[cat] ?? cat;
}

export default function DmsDocumentsPage() {
    // Loading states
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    const [documents, setDocuments] = useState<DmsDoc[]>([]);
    const [regions, setRegions] = useState<Region[]>([]);
    const [fileList, setFileList] = useState<UploadFile[]>([]);

    // Filters
    const [q, setQ] = useState("");
    const [category, setCategory] = useState<Category | undefined>(undefined);
    const [regionId, setRegionId] = useState<string | undefined>(undefined);

    // Upload drawer states
    const [isUploadOpen, setIsUploadOpen] = useState(false);
    const [selectedDoc, setSelectedDoc] = useState<DmsDoc | null>(null);
    const [uploadingVersion, setUploadingVersion] = useState(false);
    const [uploadForm] = Form.useForm();

    const [uploadFileList, setUploadFileList] = useState<UploadFile[]>([]);

    // Create drawer
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [creatingDocument, setCreatingDocument] = useState(false);
    const [createForm] = Form.useForm();

    const { isManagement } = useAuth();

    const regionLookup = useMemo(() => {
        const m = new Map<string, Region>();
        regions.forEach((r) => m.set(String(r._id), r));
        return m;
    }, [regions]);

    const openUploadDrawer = (doc: DmsDoc) => {
        setSelectedDoc(doc);
        setUploadFileList([]);
        uploadForm.resetFields();
        uploadForm.setFieldsValue({
            setAsCurrent: true,
            versionNotes: `Update ${doc.title}.`,
        });
        setIsUploadOpen(true);
    };

    async function fetchDocs() {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (q.trim()) params.set("q", q.trim());
            if (category) params.set("category", category);
            if (regionId) params.set("regionId", regionId);
            params.set("currentOnly", "false");
            params.set("isActive", "true");

            const res = await fetch(`/api/dms/documents?${params.toString()}`);
            const json = await res.json();

            if (!json?.success) {
                swal({
                    title: "Error",
                    text: json?.error?.message ?? "Failed to load documents",
                    icon: "error",
                })
                throw new Error(json?.error?.message ?? "Failed to load documents");
            }

            setDocuments(json.data ?? []);
        } catch (err: any) {
            swal({
                title: "Error",
                text: err?.message ?? "Failed to load documents",
                icon: "error",
            })
        } finally {
            setLoading(false);
        }
    }

    async function fetchRegions() {
        try {
            // If you already have a regions endpoint, use it.
            // If not, you can remove region dropdowns entirely for now.
            const res = await fetch("/api/configurations/regions");
            const json = await res.json();
            if (json?.success) setRegions(json.data ?? []);
        } catch {
            // silent: region filter is optional
        }
    }

    const handleRefresh = async () => {
        setRefreshing(true);
        try {
            await fetchRegions();
            await fetchDocs();
        } catch (error) {

        } finally {
            setRefreshing(false);
        }
    }

    useEffect(() => {
        fetchRegions();
        fetchDocs();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    async function onCreate(values: any) {
        setCreatingDocument(true);

        let createdDocId: string | null = null;

        try {
            const fileObj = fileList?.[0]?.originFileObj as File | undefined;
            if (!fileObj) {
                swal({ title: "Missing file", text: "Please select the PDF for Version 1.", icon: "warning" });
                return;
            }

            if (fileObj.type !== "application/pdf") {
                swal({
                    title: "Invalid file",
                    text: "Only PDF files are allowed.",
                    icon: "warning",
                });
                return;
            }

            // 1) Create document record without version info
            const docPayload = {
                title: values.title,
                category: values.category,
                slug: values.slug,
                regionId: values.regionId || undefined,
                description: values.description || undefined,
                tags: values.tags
                    ? String(values.tags).split(",").map((t: string) => t.trim()).filter(Boolean)
                    : undefined,
                isActive: true,
            };

            const docRes = await fetch("/api/dms/documents", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(docPayload),
            });

            const docJson = await docRes.json();
            if (!docJson?.success) throw new Error(docJson?.error?.message ?? "Failed to create document");

            const createdDoc: DmsDoc = docJson.data;
            createdDocId = createdDoc._id;

            // 2) Upload file to Cloudinary via dms-documents upload api
            const formData = new FormData();
            formData.append("file", fileObj);

            const uploadRes = await fetch("/api/upload/dms-documents", {
                method: "POST",
                body: formData,
            });

            const uploadJson = await uploadRes.json();
            if (!uploadJson?.success) {
                throw new Error(uploadJson?.message ?? "Failed to upload PDF");
            }

            const { url, publicId, bytes, originalFilename, format } = uploadJson.data;

            // 3) Create Version 1 via your versions endpoint
            const v1Payload = {
                fileUrl: url,
                filePublicId: publicId,
                mimeType: fileObj.type || "application/pdf",
                originalFileName: originalFilename ? `${originalFilename}.${format ?? "pdf"}` : fileObj.name,
                fileSizeBytes: bytes ?? fileObj.size,
                notes: values.versionNotes || "Initial release.",
                setAsCurrent: values.setAsCurrent ?? true,
            };

            const vRes = await fetch(`/api/dms/documents/${createdDoc._id}/versions`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(v1Payload),
            });

            const vJson = await vRes.json();
            if (!vJson?.success) throw new Error(vJson?.error?.message ?? "Failed to create version 1");

            swal({ title: "Success", text: "Document + Version 1 created successfully", icon: "success" });

            setIsCreateOpen(false);
            createForm.resetFields();
            setFileList([]);
            fetchDocs();
        } catch (err: any) {
            // UX safeguard: if doc was created but version upload failed, show a warning and let them upload v1 manually from the table (instead of leaving them with a broken doc and no recourse)
            if (createdDocId) {
                swal({
                    title: "Partial success",
                    text: "Document created but upload failed — please upload v1 from the table.",
                    icon: "warning",
                });

                // Optional: refresh docs so the newly created doc appears immediately
                fetchDocs();
                setIsCreateOpen(false);
                createForm.resetFields();
                setFileList([]);
                return;
            }

            swal({
                title: "Error",
                text: err?.message ?? "Failed to create document",
                icon: "error",
            });
        } finally {
            setCreatingDocument(false);
        }
    }

    async function onUploadVersion(values: any) {
        setUploadingVersion(true);
        try {
            if (!selectedDoc?._id) throw new Error("No document selected");

            const fileObj = uploadFileList?.[0]?.originFileObj as File | undefined;
            if (!fileObj) {
                swal({ title: "Missing file", text: "Please select a PDF.", icon: "warning" });
                return;
            }
            if (fileObj.type !== "application/pdf") {
                swal({ title: "Invalid file", text: "Only PDF files are allowed.", icon: "warning" });
                return;
            }

            // 1) upload to cloudinary via your endpoint
            const fd = new FormData();
            fd.append("file", fileObj);

            const uploadRes = await fetch("/api/upload/dms-documents", {
                method: "POST",
                body: fd,
            });

            const uploadJson = await uploadRes.json();
            if (!uploadJson?.success) throw new Error(uploadJson?.message ?? "Failed to upload PDF");

            const { url, publicId, bytes, originalFilename, format } = uploadJson.data;

            // 2) create version record
            const vPayload = {
                fileUrl: url,
                filePublicId: publicId,
                mimeType: "application/pdf",
                originalFileName: originalFilename
                    ? `${originalFilename}.${format ?? "pdf"}`
                    : fileObj.name,
                fileSizeBytes: bytes ?? fileObj.size,
                notes: values.versionNotes || "",
                setAsCurrent: values.setAsCurrent ?? true,
            };

            const vRes = await fetch(`/api/dms/documents/${selectedDoc._id}/versions`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(vPayload),
            });

            const vJson = await vRes.json();
            if (!vJson?.success) throw new Error(vJson?.error?.message ?? "Failed to create version");

            swal({ title: "Success", text: "Version uploaded successfully", icon: "success" });

            setIsUploadOpen(false);
            setSelectedDoc(null);
            setUploadFileList([]);
            uploadForm.resetFields();
            fetchDocs();
        } catch (err: any) {
            swal({ title: "Error", text: err?.message ?? "Failed to upload version", icon: "error" });
        } finally {
            setUploadingVersion(false);
        }
    }

    async function logPrint(docId: string) {
        // fire-and-forget, don't block printing
        fetch(`/api/dms/documents/${docId}/events`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ eventType: "PRINT" }),
            keepalive: true,
        }).catch(() => { });
    };

    const columns: ColumnsType<DmsDoc> = [
        {
            title: "Document",
            dataIndex: "title",
            key: "title",
            render: (_, row) => (
                <div>
                    <div className="font-medium">{row.title}</div>
                    <small className="text-xs dark:text-gray-500 italics">
                        {row.slug}
                    </small>
                </div>
            ),
        },
        {
            title: "Category",
            dataIndex: "category",
            key: "category",
            width: 140,
            render: (cat: Category) => <Tag>{prettyCategory(cat)}</Tag>,
        },
        {
            title: "Scope",
            key: "scope",
            width: 140,
            render: (_, row) => {
                if (!row.regionId) return <Tag color="blue">GLOBAL</Tag>;
                const r = regionLookup.get(String(row.regionId));
                const label = r?.code ? `${r.code}` : "REGION";
                return <Tag color="gold">{label}</Tag>;
            },
        },
        {
            title: "Current",
            key: "current",
            width: 140,
            render: (_, row) => {
                const v = row.currentVersion;
                if (!v) return <Tag>None</Tag>;
                return <Tag color="green">Current approved version</Tag>;
            },
        },
        {
            title: "Updated",
            dataIndex: "updatedAt",
            key: "updatedAt",
            width: 160,
            render: (d?: string) => (d ? dayjs(d).format("YYYY-MM-DD HH:mm") : "—"),
        },
        {
            title: "Last Updated By",
            key: "updatedBy",
            width: 200,
            render: (_, row) => {
                const user = row.updatedBy;
                if (!user) return <Tag>System</Tag>;

                const displayName =
                    user.name ||
                    `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() ||
                    user.email ||
                    "Unknown";

                return <span className="text-sm dark:text-gray-300">{displayName}</span>;
            },
        },
        {
            title: "Actions",
            key: "actions",
            width: 220,
            render: (_, row) => {
                const url = row.currentVersion?.fileUrl;
                console.log("🚀 ~ DmsDocumentsPage ~ url:", url)
                return (
                    <Space>
                        <Button
                            size="small"
                            disabled={!url}
                            onClick={() => {
                                if (!url) return;
                                logPrint(row._id);
                                window.open(url, "_blank", "noopener,noreferrer");
                            }}>
                            Print
                        </Button>

                        {/* Placeholder for next step (upload new version) */}
                        {isManagement && <Button size="small" type={!row.currentVersion ? "primary" : "default"} onClick={() => openUploadDrawer(row)}>
                            <UploadOutlined /> New Version
                        </Button>}
                    </Space>
                );
            },
        },
    ];

    return (
        <div className="p-6">
            <PageHeader title="Documents" subtitle="Current approved office documents — printable on demand." actions={[<Space>
                <Button
                    onClick={handleRefresh}
                    loading={refreshing}
                    icon={<ReloadOutlined />}
                >
                    Refresh
                </Button>
                {isManagement && <Button
                    onClick={() => setIsCreateOpen(true)}
                    icon={<PlusOutlined />}
                >
                    Create Document
                </Button>}
            </Space>]} />

            <div className="mt-5 flex flex-wrap items-center gap-3">
                <Input.Search
                    allowClear
                    placeholder="Search by title, slug, tag…"
                    style={{ width: 320 }}
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    onSearch={() => fetchDocs()}
                />

                <Select
                    allowClear
                    placeholder="Category"
                    style={{ width: 200 }}
                    value={category}
                    options={CATEGORY_OPTIONS}
                    onChange={(v) => setCategory(v)}
                />

                <Select
                    allowClear
                    placeholder="Region (optional)"
                    style={{ width: 240 }}
                    value={regionId}
                    options={regions.map((r) => ({
                        value: r._id,
                        label: r.code ? `${r.code} — ${r.name ?? ""}`.trim() : (r.name ?? r._id),
                    }))}
                    onChange={(v) => setRegionId(v)}
                />

                <Button onClick={() => fetchDocs()}>Apply</Button>
                <Button
                    onClick={() => {
                        setQ("");
                        setCategory(undefined);
                        setRegionId(undefined);
                        // fetch after state flush
                        setTimeout(() => fetchDocs(), 0);
                    }}
                >
                    Clear
                </Button>
            </div>

            <div className="mt-4">
                <Table<DmsDoc>
                    rowKey="_id"
                    loading={loading || refreshing}
                    columns={columns}
                    dataSource={documents}
                    rowClassName={(record) => `cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 ${!record.currentVersion ? "bg-red-50 dark:bg-red-900/20" : ""}`}
                    pagination={{ pageSize: 10, showSizeChanger: true }}
                />
            </div>

            <Drawer
                title="Create Document"
                open={isCreateOpen}
                onClose={() => setIsCreateOpen(false)}
                width={520}
                destroyOnClose
            >
                <Form
                    layout="vertical"
                    form={createForm}
                    onFinish={onCreate}
                    initialValues={{ category: "FORMS" }}
                >
                    <Form.Item
                        label="Title"
                        name="title"
                        rules={[{ required: true, message: "Title is required" }]}
                    >
                        <Input placeholder="e.g. Joining Form" />
                    </Form.Item>

                    <Form.Item
                        label="Category"
                        name="category"
                        rules={[{ required: true, message: "Category is required" }]}
                    >
                        <Select options={CATEGORY_OPTIONS} />
                    </Form.Item>

                    <Form.Item label="Region (optional)" name="regionId">
                        <Select
                            allowClear
                            placeholder="If set, backend will prefix slug with region code"
                            options={regions.map((r) => ({
                                value: r._id,
                                label: r.code ? `${r.code} — ${r.name ?? ""}`.trim() : (r.name ?? r._id),
                            }))}
                        />
                    </Form.Item>

                    <Form.Item
                        label="Slug (base)"
                        name="slug"
                        rules={[{ required: true, message: "Slug is required" }]}
                        extra={<span className="dark:text-gray-500">Use lowercase with hyphens (e.g. joining-form). If region is selected, backend prefixes it automatically.</span>}
                    >
                        <Input placeholder="joining-form" />
                    </Form.Item>

                    <Form.Item label="Description" name="description">
                        <Input.TextArea rows={3} placeholder="Optional notes about this document" />
                    </Form.Item>

                    <Form.Item
                        label="Tags (comma-separated)"
                        name="tags"
                        extra={<span className="dark:text-gray-500">e.g. onboarding, forms, membership</span>}
                    >
                        <Input placeholder="onboarding, forms" />
                    </Form.Item>

                    <Form.Item
                        label="Version 1 PDF"
                        required
                        extra={<span className="dark:text-gray-500">Upload the initial approved PDF for this document.</span>}
                    >
                        <Upload
                            accept="application/pdf"
                            maxCount={1}
                            fileList={fileList}
                            beforeUpload={() => false}
                            onChange={({ fileList }) => setFileList(fileList)}
                        >
                            <Button icon={<UploadOutlined />}>Select PDF</Button>
                        </Upload>
                    </Form.Item>

                    <Form.Item
                        label="Version notes"
                        name="versionNotes"
                        initialValue="Initial release."
                        extra={<span className="dark:text-gray-500">Shown in version history (keep it short and clear).</span>}
                    >
                        <Input.TextArea rows={2} placeholder="Initial release." />
                    </Form.Item>

                    <Form.Item label="Set as current" name="setAsCurrent" initialValue={true} valuePropName="checked">
                        <Switch />
                    </Form.Item>

                    <Space>
                        <Button onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                        <Button type="primary" htmlType="submit" loading={creatingDocument}>
                            Create
                        </Button>
                    </Space>
                </Form>
            </Drawer>

            <Drawer
                title={selectedDoc ? `Upload Version — ${selectedDoc.title}` : "Upload Version"}
                open={isUploadOpen}
                onClose={() => setIsUploadOpen(false)}
                width={520}
                destroyOnClose
            >
                <Form layout="vertical" form={uploadForm} onFinish={onUploadVersion}>
                    <Form.Item
                        label="PDF File"
                        required
                        extra={<span className="dark:text-gray-500">Upload the next approved PDF version.</span>}
                    >
                        <Upload
                            accept="application/pdf"
                            maxCount={1}
                            fileList={uploadFileList}
                            beforeUpload={() => false}
                            onChange={({ fileList }) => setUploadFileList(fileList)}
                        >
                            <Button icon={<UploadOutlined />}>Select PDF</Button>
                        </Upload>
                    </Form.Item>

                    <Form.Item
                        label="Version notes"
                        name="versionNotes"
                        extra={<span className="dark:text-gray-500">Shown in version history.</span>}
                    >
                        <Input.TextArea rows={2} placeholder="Describe what changed..." />
                    </Form.Item>

                    <Form.Item
                        label="Set as current"
                        name="setAsCurrent"
                        initialValue={true}
                        valuePropName="checked"
                    >
                        <Switch />
                    </Form.Item>

                    <Space>
                        <Button onClick={() => setIsUploadOpen(false)}>Cancel</Button>
                        <Button type="primary" htmlType="submit" loading={uploadingVersion}>
                            Upload
                        </Button>
                    </Space>
                </Form>
            </Drawer>
        </div>
    );
}
