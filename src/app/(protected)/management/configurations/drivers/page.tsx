"use client";

import { LockOutlined, PlusOutlined, ReloadOutlined } from "@ant-design/icons";
import { Button } from "@nextui-org/react";
import { Button as AntButton, Drawer, Form, Input, Select, Space, Table, Tag } from "antd";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { useEffect, useState } from "react";
import sweetAlert from "sweetalert";

import PageHeader from "@/app/components/page-header";
import { ERoles } from "@/types/roles.enum"; // adjust path if needed
import { withRoleGuard } from "@/utils/utils/with-role-guard";

type StaffMember = {
    _id: string;
    firstNames: string;
    lastName: string;
    idNumber?: string;
};

type Driver = {
    _id: string;
    driverCode: string;
    active: boolean;
    status: string;
    pinHash?: string;
    createdAt?: string;
    staffMemberId?: StaffMember | null;
};

const DriversPage = () => {
    dayjs.extend(relativeTime);

    const [drivers, setDrivers] = useState<Driver[]>([]);
    const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);

    const [loading, setLoading] = useState<boolean>(true);

    const [createDrawerOpen, setCreateDrawerOpen] = useState(false);
    const [pinDrawerOpen, setPinDrawerOpen] = useState(false);

    const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);

    const [createForm] = Form.useForm();
    const [pinForm] = Form.useForm();

    const fetchDrivers = async () => {
        try {
            setLoading(true);
            const res = await fetch("/api/admin/drivers");
            const data = await res.json();

            if (!res.ok) {
                sweetAlert({ title: "Failed to fetch drivers", text: data?.message, icon: "error" });
                return;
            }

            setDrivers(data);
        } catch {
            sweetAlert({ title: "Error", text: "An error occurred while fetching drivers.", icon: "error" });
        } finally {
            setLoading(false);
        }
    };

    const fetchStaffMembers = async () => {
        try {
            const res = await fetch("/api/staff");
            const data = await res.json();

            if (!res.ok) {
                sweetAlert({ title: "Failed to fetch staff members", text: data?.message, icon: "error" });
                return;
            }

            setStaffMembers(data.staffMembers || []);
        } catch {
            sweetAlert({ title: "Error", text: "Could not fetch staff members.", icon: "error" });
        }
    };

    useEffect(() => {
        fetchDrivers();
        fetchStaffMembers();
    }, []);

    const openPinDrawer = (driver: Driver) => {
        setSelectedDriver(driver);
        pinForm.resetFields();
        setPinDrawerOpen(true);
    };

    const handleCreateDriver = async (values: any) => {
        try {
            setLoading(true);

            const res = await fetch("/api/admin/drivers", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    staffMemberId: values.staffMemberId,
                    driverCode: String(values.driverCode || "").trim().toUpperCase(),
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                sweetAlert({ title: "Failed to create driver", text: data?.error || data?.message, icon: "error" });
                return;
            }

            sweetAlert({ title: "Driver created", icon: "success", timer: 1500 });

            setCreateDrawerOpen(false);
            createForm.resetFields();

            await fetchDrivers();
        } catch (e: any) {
            sweetAlert({ title: "Error", text: e?.message || "Failed to create driver.", icon: "error" });
        } finally {
            setLoading(false);
        }
    };

    const handleSetPin = async (values: any) => {
        try {
            if (!selectedDriver?._id) return;

            const pin = String(values.pin || "").trim();
            if (!/^\d{4,6}$/.test(pin)) {
                sweetAlert({ title: "Invalid PIN", text: "PIN must be 4–6 digits.", icon: "warning" });
                return;
            }

            const confirmed = await sweetAlert({
                title: selectedDriver.pinHash ? "Rotate PIN?" : "Set PIN?",
                text: `This will ${selectedDriver.pinHash ? "rotate" : "set"} the login PIN for ${selectedDriver.driverCode}.`,
                icon: "warning",
                buttons: ["Cancel", "Yes, continue"],
            });

            if (!confirmed) return;

            setLoading(true);

            const res = await fetch("/api/admin/drivers/set-pin", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ driverId: selectedDriver._id, pin }),
            });

            const data = await res.json();

            if (!res.ok) {
                sweetAlert({ title: "Failed to set PIN", text: data?.error || data?.message, icon: "error" });
                return;
            }

            sweetAlert({ title: "PIN updated", icon: "success", timer: 1500 });

            setPinDrawerOpen(false);
            pinForm.resetFields();
            setSelectedDriver(null);

            await fetchDrivers();
        } catch (e: any) {
            sweetAlert({ title: "Error", text: e?.message || "Failed to set PIN.", icon: "error" });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ padding: "20px" }}>
            <PageHeader
                title="Drivers"
                subtitle="Create drivers from staff members and manage Driver App PIN access"
                actions={[
                    <div className="flex items-center gap-4" key="actions">
                        <AntButton icon={<ReloadOutlined />} loading={loading} onClick={fetchDrivers}>
                            Refresh
                        </AntButton>
                        <AntButton onClick={() => setCreateDrawerOpen(true)}>
                            <PlusOutlined /> New Driver
                        </AntButton>
                    </div>,
                ]}
            />

            <Table
                rowKey="_id"
                bordered
                loading={loading}
                dataSource={drivers}
                rowClassName="cursor-pointer hover:bg-gray-100"
                columns={[
                    {
                        title: "Driver Code",
                        dataIndex: "driverCode",
                        key: "driverCode",
                        sorter: (a: any, b: any) => a.driverCode.localeCompare(b.driverCode),
                        render: (v: string) => <span className="font-semibold">{v}</span>,
                    },
                    {
                        title: "Staff Member",
                        key: "staffMember",
                        render: (_: any, record: Driver) => {
                            const s = record.staffMemberId;
                            return s ? `${s.firstNames} ${s.lastName}`.trim() : "—";
                        },
                    },
                    {
                        title: "Status",
                        dataIndex: "status",
                        key: "status",
                        render: (v: string) => <Tag color={v === "AVAILABLE" ? "green" : "blue"}>{v}</Tag>,
                    },
                    {
                        title: "Active",
                        dataIndex: "active",
                        key: "active",
                        render: (v: boolean) => <Tag color={v ? "green" : "red"}>{v ? "Yes" : "No"}</Tag>,
                    },
                    {
                        title: "PIN",
                        key: "pin",
                        render: (_: any, record: Driver) =>
                            record.pinHash ? (
                                <Tag color="green">Set</Tag>
                            ) : (
                                <Tag color="orange">Not set</Tag>
                            ),
                    },
                    {
                        title: "Created",
                        dataIndex: "createdAt",
                        key: "createdAt",
                        render: (v: string) => <span>{v ? dayjs(v).fromNow() : "-"}</span>,
                    },
                    {
                        title: "Actions",
                        key: "actions",
                        render: (_: any, record: Driver) => (
                            <AntButton icon={<LockOutlined />} onClick={() => openPinDrawer(record)}>
                                {record.pinHash ? "Rotate PIN" : "Set PIN"}
                            </AntButton>
                        ),
                    },
                ]}
            />

            {/* Create Driver Drawer */}
            <Drawer
                styles={{ header: { background: "rgb(255 172 0 / 0.75)" } }}
                title={
                    <Space>
                        <div>
                            <h2 className="text-medium font-semibold text-black">Create Driver</h2>
                            <p className="text-xs font-normal text-gray-800">
                                Link a staff member and assign a driver code
                            </p>
                        </div>
                    </Space>
                }
                placement="right"
                closable={false}
                onClose={() => {
                    createForm.resetFields();
                    setCreateDrawerOpen(false);
                }}
                open={createDrawerOpen}
                width="50%"
                footer={
                    <Space>
                        <Button color="danger" size="md" onClick={() => setCreateDrawerOpen(false)}>
                            Cancel
                        </Button>
                        <Button color="primary" size="md" onClick={() => createForm.submit()}>
                            Submit
                        </Button>
                    </Space>
                }
            >
                <Form form={createForm} layout="vertical" onFinish={handleCreateDriver}>
                    <Form.Item
                        label="Staff Member"
                        name="staffMemberId"
                        rules={[{ required: true, message: "Required" }]}
                    >
                        <Select
                            showSearch
                            options={staffMembers.map((s) => ({
                                label: `${s.firstNames} ${s.lastName}`.trim(),
                                value: s._id,
                            }))}
                            placeholder="Select staff member"
                            filterOption={(input, option) =>
                                String(option?.label ?? "").toLowerCase().includes(input.toLowerCase())
                            }
                        />
                    </Form.Item>

                    <Form.Item
                        label="Driver Code"
                        name="driverCode"
                        rules={[{ required: true, message: "Required" }]}
                    >
                        <Input placeholder="e.g. THABO001 or DRV-0007" />
                    </Form.Item>
                </Form>
            </Drawer>

            {/* Set/Rotate PIN Drawer */}
            <Drawer
                styles={{ header: { background: "rgb(255 172 0 / 0.75)" } }}
                title={
                    <Space>
                        <div>
                            <h2 className="text-medium font-semibold text-black">
                                {selectedDriver?.pinHash ? "Rotate PIN" : "Set PIN"}
                            </h2>
                            <p className="text-xs font-normal text-gray-800">
                                Driver: <strong>{selectedDriver?.driverCode ?? "-"}</strong>
                            </p>
                        </div>
                    </Space>
                }
                placement="right"
                closable={false}
                onClose={() => {
                    pinForm.resetFields();
                    setPinDrawerOpen(false);
                    setSelectedDriver(null);
                }}
                open={pinDrawerOpen}
                width="40%"
                footer={
                    <Space>
                        <Button color="danger" size="md" onClick={() => setPinDrawerOpen(false)}>
                            Cancel
                        </Button>
                        <Button color="primary" size="md" onClick={() => pinForm.submit()}>
                            Save PIN
                        </Button>
                    </Space>
                }
            >
                <Form form={pinForm} layout="vertical" onFinish={handleSetPin}>
                    <Form.Item
                        label="PIN (4–6 digits)"
                        name="pin"
                        rules={[
                            { required: true, message: "Required" },
                            {
                                validator: (_, value) => {
                                    const v = String(value ?? "").trim();
                                    if (!/^\d{4,6}$/.test(v)) return Promise.reject("PIN must be 4–6 digits.");
                                    return Promise.resolve();
                                },
                            },
                        ]}
                    >
                        <Input inputMode="numeric" maxLength={6} placeholder="e.g. 4286" />
                    </Form.Item>
                </Form>

                <Tag color="blue">
                    Tip: Drivers are not portal users — this PIN is only for the Driver App.
                </Tag>
            </Drawer>
        </div>
    );
};

export default withRoleGuard(DriversPage, [ERoles.Admin, ERoles.HRManager, ERoles.RegionalManager]);
