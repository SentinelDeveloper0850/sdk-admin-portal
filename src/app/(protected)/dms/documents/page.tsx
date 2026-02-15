"use client";

import { useEffect, useMemo, useState } from "react";

import PageHeader from "@/app/components/page-header";
import { PlusOutlined, ReloadOutlined } from "@ant-design/icons";
import {
    Button,
    Drawer,
    Form,
    Input,
    Select,
    Space,
    Table,
    Tag,
    Typography,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import swal from "sweetalert";

const { Title, Text } = Typography;

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
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [docs, setDocs] = useState<DmsDoc[]>([]);
    const [regions, setRegions] = useState<Region[]>([]);

    // Filters
    const [q, setQ] = useState("");
    const [category, setCategory] = useState<Category | undefined>(undefined);
    const [regionId, setRegionId] = useState<string | undefined>(undefined);

    // Create drawer
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [creatingDocument, setCreatingDocument] = useState(false);
    const [createForm] = Form.useForm();

    const regionLookup = useMemo(() => {
        const m = new Map<string, Region>();
        regions.forEach((r) => m.set(String(r._id), r));
        return m;
    }, [regions]);

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

            setDocs(json.data ?? []);
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
        try {
            const payload = {
                title: values.title,
                category: values.category,
                slug: values.slug,
                regionId: values.regionId || undefined,
                description: values.description || undefined,
                tags: values.tags ? String(values.tags).split(",").map((t: string) => t.trim()).filter(Boolean) : undefined,
                isActive: true,
            };

            const res = await fetch("/api/dms/documents", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            const json = await res.json();
            if (!json?.success) throw new Error(json?.error?.message ?? "Failed to create document");


            swal({
                title: "Success",
                text: "Document created successfully",
                icon: "success",
            })
            setIsCreateOpen(false);
            createForm.resetFields();
            fetchDocs();
        } catch (err: any) {
            swal({
                title: "Error",
                text: err?.message ?? "Failed to create document",
                icon: "error",
            })
        } finally {
            setCreatingDocument(false)
        }
    }

    const columns: ColumnsType<DmsDoc> = [
        {
            title: "Document",
            dataIndex: "title",
            key: "title",
            render: (_, row) => (
                <div>
                    <div className="font-medium">{row.title}</div>
                    <small className="text-xs dark:text-gray-400 italics">
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
                return <Tag color="green">v{v.versionNumber}</Tag>;
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
            title: "Actions",
            key: "actions",
            width: 220,
            render: (_, row) => {
                const url = row.currentVersion?.fileUrl;
                return (
                    <Space>
                        <Button
                            size="small"
                            disabled={!url}
                            onClick={() => url && window.open(url, "_blank", "noopener,noreferrer")}
                        >
                            Preview
                        </Button>
                        <Button
                            size="small"
                            disabled={!url}
                            onClick={() => {
                                // simplest “print”: open pdf in new tab and print from viewer
                                if (url) window.open(url, "_blank", "noopener,noreferrer");
                            }}
                        >
                            Print
                        </Button>

                        {/* Placeholder for next step (upload new version) */}
                        <Button size="small" disabled>
                            Upload
                        </Button>
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
                <Button
                    onClick={() => setIsCreateOpen(true)}
                    icon={<PlusOutlined />}
                >
                    Create Document
                </Button>
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
                    dataSource={docs}
                    rowClassName="cursor-pointer hover:bg-gray-100"
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

                    <Space>
                        <Button onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                        <Button type="primary" htmlType="submit" loading={creatingDocument}>
                            Create
                        </Button>
                    </Space>
                </Form>
            </Drawer>
        </div>
    );
}
