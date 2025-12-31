// src/app/(protected)/configurations/cemeteries/page.tsx
"use client";

import PageHeader from "@/app/components/page-header";
import { useAuth } from "@/context/auth-context";
import { withRoleGuard } from "@/utils/utils/with-role-guard";
import { useEffect, useMemo, useState } from "react";
import sweetAlert from "sweetalert";
import { ERoles } from "../../../../types/roles.enum";

import { generateCemeteryCode } from "@/utils";
import { PlusOutlined, ReloadOutlined, SaveOutlined } from "@ant-design/icons";
import {
    Button,
    Drawer,
    Form,
    Input,
    InputNumber,
    message,
    Popconfirm,
    Select,
    Space,
    Spin,
    Table,
    Tag,
    Tooltip,
} from "antd";
import { Delete, Edit, MapPin } from "lucide-react";

const { Option } = Select;

type CemeteryConfig = {
    _id: string;
    name: string;
    code: string;
    branchId?: string; // optional linkage
    address?: string;
    city?: string;
    province?: string;
    postalCode?: string;
    latitude?: number;
    longitude?: number;
    isActive: boolean;
    createdAt?: string;
    updatedAt?: string;
    updatedBy?: string;
};

const PROVINCES = [
    "Gauteng",
    "Western Cape",
    "KwaZulu-Natal",
    "Eastern Cape",
    "Free State",
    "Mpumalanga",
    "Limpopo",
    "North West",
    "Northern Cape",
];

const CemeteriesConfigurationsPage = () => {
    const { user } = useAuth();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [cemeteries, setCemeteries] = useState<CemeteryConfig[]>([]);
    const [branches, setBranches] = useState<Array<{ name: string; code: string }>>([]);
    const [branchesLoading, setBranchesLoading] = useState(false);

    const [drawerVisible, setDrawerVisible] = useState(false);
    const [editDrawerVisible, setEditDrawerVisible] = useState(false);

    const [editingCemetery, setEditingCemetery] = useState<CemeteryConfig | null>(null);
    const [originalCemeteryData, setOriginalCemeteryData] = useState<Partial<CemeteryConfig> | null>(null);

    const [form] = Form.useForm();

    const name = Form.useWatch("name", form);
    const city = Form.useWatch("city", form);

    const fetchCemeteries = async () => {
        try {
            setLoading(true);
            const res = await fetch("/api/configurations/cemeteries");
            const json = await res.json();

            if (json?.success && Array.isArray(json?.data)) {
                setCemeteries(json.data);
            } else {
                sweetAlert({
                    title: "Error",
                    text: json?.error || json?.message || "Failed to fetch cemeteries",
                    icon: "error",
                });
            }
        } catch (e) {
            console.error(e);
            sweetAlert({
                title: "Error",
                text: "An error occurred while fetching cemeteries.",
                icon: "error",
            });
        } finally {
            setLoading(false);
        }
    };

    const fetchBranches = async () => {
        try {
            setBranchesLoading(true);
            const res = await fetch("/api/configurations/branches");
            const json = await res.json();
            if (!res.ok || !json?.success) throw new Error(json?.error?.message || "Failed to load branches");

            const list = Array.isArray(json.data) ? json.data : [];
            setBranches(
                list
                    .filter((b: any) => b?.name && b?.code)
                    .map((b: any) => ({ name: String(b.name), code: String(b.code) }))
            );
        } catch (e: any) {
            console.error(e);
            sweetAlert({ title: "Error", text: e?.message || "Unable to load branches", icon: "error" });
        } finally {
            setBranchesLoading(false);
        }
    };

    useEffect(() => {
        fetchCemeteries();
        fetchBranches();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (name && city && form) {
            const next = generateCemeteryCode(name, city);

            // avoid looping / needless set
            if (next && form.getFieldValue("code") !== next) {
                form.setFieldsValue({ code: next });
            }
        }
    }, [name, city, form]);

    const branchOptions = useMemo(
        () => branches.map((b) => ({ label: `${b.name} (${b.code})`, value: b.code })),
        [branches]
    );

    const handleRefresh = () => {
        fetchCemeteries();
        fetchBranches();
    };

    const openCreate = () => {
        setEditingCemetery(null);
        setOriginalCemeteryData(null);
        form.resetFields();
        form.setFieldsValue({ isActive: true });
        setDrawerVisible(true);
    };

    const openEdit = (cem: CemeteryConfig) => {
        setEditingCemetery(cem);
        setOriginalCemeteryData({
            name: cem.name,
            code: cem.code,
            branchId: cem.branchId,
            address: cem.address,
            city: cem.city,
            province: cem.province,
            postalCode: cem.postalCode,
            latitude: cem.latitude,
            longitude: cem.longitude,
            isActive: cem.isActive,
        });

        form.setFieldsValue({
            name: cem.name,
            code: cem.code,
            branchId: cem.branchId,
            address: cem.address,
            city: cem.city,
            province: cem.province,
            postalCode: cem.postalCode,
            latitude: cem.latitude,
            longitude: cem.longitude,
            isActive: cem.isActive,
        });

        setEditDrawerVisible(true);
    };

    const handleSaveCemetery = async (values: any) => {
        try {
            setSaving(true);
            const res = await fetch("/api/configurations/cemeteries", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...values,
                    createdBy: user?._id,
                }),
            });

            const json = await res.json();
            if (json?.success) {
                sweetAlert({ title: "Success", text: "Cemetery saved successfully", icon: "success" });
                form.resetFields();
                setDrawerVisible(false);
                fetchCemeteries();
            } else {
                sweetAlert({ title: "Error", text: json?.error || json?.message || "Failed to save cemetery", icon: "error" });
            }
        } catch (e) {
            console.error(e);
            sweetAlert({ title: "Error", text: "An error occurred while saving cemetery", icon: "error" });
        } finally {
            setSaving(false);
        }
    };

    const handleUpdateCemetery = async (values: any) => {
        if (!editingCemetery || !originalCemeteryData) return;

        try {
            setSaving(true);

            const dirtiedFields: Record<string, any> = {};
            Object.keys(values).forEach((k) => {
                const key = k as keyof CemeteryConfig;
                if (values[key] !== originalCemeteryData[key]) {
                    dirtiedFields[key] = values[key];
                }
            });

            if (Object.keys(dirtiedFields).length === 0) {
                message.info("No changes detected");
                return;
            }

            const res = await fetch(`/api/configurations/cemeteries/${editingCemetery._id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...dirtiedFields,
                    updatedBy: user?._id,
                }),
            });

            const json = await res.json();

            if (json?.success) {
                sweetAlert({ title: "Success", text: "Cemetery updated successfully", icon: "success" });
                setEditDrawerVisible(false);
                setEditingCemetery(null);
                setOriginalCemeteryData(null);
                form.resetFields();
                fetchCemeteries();
            } else {
                sweetAlert({ title: "Error", text: json?.error || json?.message || "Failed to update cemetery", icon: "error" });
            }
        } catch (e) {
            console.error(e);
            sweetAlert({ title: "Error", text: "An error occurred while updating cemetery", icon: "error" });
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteCemetery = async (id: string) => {
        try {
            const res = await fetch(`/api/configurations/cemeteries/${id}`, { method: "DELETE" });
            const json = await res.json();

            if (json?.success) {
                sweetAlert({ title: "Success", text: "Cemetery deleted successfully", icon: "success" });
                fetchCemeteries();
            } else {
                sweetAlert({ title: "Error", text: json?.error || json?.message || "Failed to delete cemetery", icon: "error" });
            }
        } catch (e) {
            console.error(e);
            sweetAlert({ title: "Error", text: "An error occurred while deleting cemetery", icon: "error" });
        }
    };

    const cemeteryColumns = [
        {
            title: "Name",
            dataIndex: "name",
            key: "name",
        },
        {
            title: "Code",
            dataIndex: "code",
            key: "code",
            render: (text: string) => <Tag color="blue">{text}</Tag>,
        },
        {
            title: "Branch",
            dataIndex: "branchId",
            key: "branchId",
            render: (v: string) => v || "—",
        },
        {
            title: "Location",
            key: "location",
            render: (_: any, r: CemeteryConfig) => (
                <div>
                    <div>{r.address || "—"}</div>
                    <div>
                        {r.city || "—"}
                        {r.province ? `, ${r.province}` : ""}
                    </div>
                    <div className="text-xs text-gray-500">{r.postalCode || ""}</div>
                </div>
            ),
        },
        {
            title: "Coordinates",
            key: "coordinates",
            render: (_: any, r: CemeteryConfig) => (
                <div>
                    <div className="text-xs font-mono">
                        {typeof r.latitude === "number" && typeof r.longitude === "number"
                            ? `${r.latitude.toFixed(6)}, ${r.longitude.toFixed(6)}`
                            : "—"}
                    </div>
                    <div className="text-xs text-gray-500">
                        {typeof r.latitude === "number" && typeof r.longitude === "number" ? "GPS Ready" : "No GPS"}
                    </div>
                </div>
            ),
        },
        {
            title: "Status",
            dataIndex: "isActive",
            key: "isActive",
            render: (isActive: boolean) => <Tag color={isActive ? "green" : "red"}>{isActive ? "Active" : "Inactive"}</Tag>,
        },
        {
            title: "Actions",
            key: "actions",
            render: (_: any, r: CemeteryConfig) => (
                <Space>
                    <Tooltip title="Edit">
                        <Button type="text" icon={<Edit size={16} />} onClick={() => openEdit(r)} />
                    </Tooltip>
                    <Popconfirm
                        title="Are you sure you want to delete this cemetery?"
                        onConfirm={() => handleDeleteCemetery(r._id)}
                        okText="Yes"
                        cancelText="No"
                    >
                        <Tooltip title="Delete">
                            <Button type="text" danger icon={<Delete size={16} />} />
                        </Tooltip>
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    if (loading) {
        return (
            <div className="h-[80vh] flex items-center justify-center">
                <Spin size="large" />
            </div>
        );
    }

    return (
        <div style={{ padding: 20 }}>
            <PageHeader
                title="Cemeteries"
                subtitle="Manage cemetery settings for burial selections"
                actions={[
                    <Button key="refresh" type="default" icon={<ReloadOutlined />} onClick={handleRefresh}>
                        Refresh
                    </Button>,
                    <Button key="add" type="primary" className="text-black" icon={<PlusOutlined />} onClick={openCreate}>
                        Add New Cemetery
                    </Button>,
                ]}
            />

            <Table
                dataSource={cemeteries}
                columns={cemeteryColumns as any}
                rowKey="_id"
                pagination={{ pageSize: 10, showSizeChanger: true, showQuickJumper: true }}
            />

            {/* Create Drawer */}
            <Drawer
                title="Add New Cemetery"
                open={drawerVisible}
                onClose={() => setDrawerVisible(false)}
                destroyOnClose
                width="60%"
                footer={
                    <div className="flex justify-end gap-2 border-t border-gray-200 dark:border-gray-700 pt-4">
                        <Button onClick={() => setDrawerVisible(false)}>Cancel</Button>
                        <Button type="primary" onClick={() => form.submit()} loading={saving} icon={<SaveOutlined size={16} />}>
                            Save Cemetery
                        </Button>
                    </div>
                }
            >
                <Form form={form} layout="vertical" onFinish={handleSaveCemetery} className="grid grid-cols-3 gap-4">
                    <Form.Item name="name" label="Cemetery Name" rules={[{ required: true, message: "Please enter cemetery name" }]}>
                        <Input prefix={<MapPin size={16} className="mr-1" />} placeholder="e.g. West Park Cemetery" allowClear />
                    </Form.Item>

                    <Form.Item name="code" label="Cemetery Code (auto-generated)">
                        <Input placeholder="e.g. WPC001" disabled />
                    </Form.Item>

                    <Form.Item name="branchId" label="Branch (optional)">
                        <Select
                            allowClear
                            showSearch
                            placeholder="Link to branch"
                            options={branchOptions}
                            optionFilterProp="label"
                            loading={branchesLoading}
                        />
                    </Form.Item>

                    <Form.Item name="address" label="Address" className="col-span-3">
                        <Input.TextArea rows={2} placeholder="Enter full address" />
                    </Form.Item>

                    <Form.Item name="city" label="City">
                        <Input placeholder="e.g. Johannesburg" />
                    </Form.Item>

                    <Form.Item name="province" label="Province">
                        <Select placeholder="Select province" allowClear>
                            {PROVINCES.map((p) => (
                                <Option key={p} value={p}>
                                    {p}
                                </Option>
                            ))}
                        </Select>
                    </Form.Item>

                    <Form.Item name="postalCode" label="Postal Code">
                        <Input placeholder="e.g. 2000" />
                    </Form.Item>

                    <Form.Item
                        name="latitude"
                        label="Latitude"
                        rules={[{ type: "number", min: -90, max: 90, message: "Latitude must be between -90 and 90" }]}
                    >
                        <InputNumber placeholder="e.g. -26.2041" className="w-full" step={0.000001} precision={6} />
                    </Form.Item>

                    <Form.Item
                        name="longitude"
                        label="Longitude"
                        rules={[{ type: "number", min: -180, max: 180, message: "Longitude must be between -180 and 180" }]}
                    >
                        <InputNumber placeholder="e.g. 28.0473" className="w-full" step={0.000001} precision={6} />
                    </Form.Item>

                    <Form.Item name="isActive" label="Status" initialValue={true}>
                        <Select
                            options={[
                                { value: true, label: "Active" },
                                { value: false, label: "Inactive" },
                            ]}
                        />
                    </Form.Item>
                </Form>
            </Drawer>

            {/* Edit Drawer */}
            <Drawer
                title="Edit Cemetery"
                open={editDrawerVisible}
                onClose={() => {
                    setEditDrawerVisible(false);
                    setEditingCemetery(null);
                    setOriginalCemeteryData(null);
                    form.resetFields();
                }}
                destroyOnClose
                width="60%"
                footer={
                    <div className="flex justify-end gap-2 border-t border-gray-200 dark:border-gray-700 pt-4">
                        <Button
                            onClick={() => {
                                setEditDrawerVisible(false);
                                setEditingCemetery(null);
                                setOriginalCemeteryData(null);
                                form.resetFields();
                            }}
                        >
                            Cancel
                        </Button>
                        <Button type="primary" onClick={() => form.submit()} loading={saving} icon={<SaveOutlined size={16} />}>
                            Update Cemetery
                        </Button>
                    </div>
                }
            >
                <Form form={form} layout="vertical" onFinish={handleUpdateCemetery} className="grid grid-cols-3 gap-4">
                    <Form.Item name="name" label="Cemetery Name">
                        <Input prefix={<MapPin size={16} className="mr-1" />} placeholder="e.g. West Park Cemetery" allowClear />
                    </Form.Item>

                    <Form.Item name="code" label="Cemetery Code">
                        <Input placeholder="e.g. WPC001" allowClear />
                    </Form.Item>

                    <Form.Item name="branchId" label="Branch (optional)">
                        <Select
                            allowClear
                            showSearch
                            placeholder="Link to branch"
                            options={branchOptions}
                            optionFilterProp="label"
                            loading={branchesLoading}
                        />
                    </Form.Item>

                    <Form.Item name="address" label="Address" className="col-span-3">
                        <Input.TextArea rows={2} placeholder="Enter full address" />
                    </Form.Item>

                    <Form.Item name="city" label="City">
                        <Input placeholder="e.g. Johannesburg" />
                    </Form.Item>

                    <Form.Item name="province" label="Province">
                        <Select placeholder="Select province" allowClear>
                            {PROVINCES.map((p) => (
                                <Option key={p} value={p}>
                                    {p}
                                </Option>
                            ))}
                        </Select>
                    </Form.Item>

                    <Form.Item name="postalCode" label="Postal Code">
                        <Input placeholder="e.g. 2000" />
                    </Form.Item>

                    <Form.Item
                        name="latitude"
                        label="Latitude"
                        rules={[{ type: "number", min: -90, max: 90, message: "Latitude must be between -90 and 90" }]}
                    >
                        <InputNumber placeholder="e.g. -26.2041" className="w-full" step={0.000001} precision={6} />
                    </Form.Item>

                    <Form.Item
                        name="longitude"
                        label="Longitude"
                        rules={[{ type: "number", min: -180, max: 180, message: "Longitude must be between -180 and 180" }]}
                    >
                        <InputNumber placeholder="e.g. 28.0473" className="w-full" step={0.000001} precision={6} />
                    </Form.Item>

                    <Form.Item name="isActive" label="Status">
                        <Select
                            options={[
                                { value: true, label: "Active" },
                                { value: false, label: "Inactive" },
                            ]}
                        />
                    </Form.Item>
                </Form>
            </Drawer>
        </div>
    );
};

export default withRoleGuard(CemeteriesConfigurationsPage, [ERoles.Admin]);
