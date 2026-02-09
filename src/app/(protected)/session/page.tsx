"use client";

import { useAuth } from "@/context/auth-context";
import { Button } from "@nextui-org/react";
import { Form, Radio, Select } from "antd";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import sweetAlert from "sweetalert";

const getId = (x: any) => String(x?._id ?? x?.id ?? "");
const getRegionId = (x: any) => String(x?.regionId?._id ?? x?.regionId ?? "");

const SessionPage = () => {
    const [form] = Form.useForm();
    const router = useRouter();
    const { user, startSession } = useAuth();

    const [branches, setBranches] = useState<any[]>([]);
    const [regions, setRegions] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchRegions = async () => {
        try {
            const res = await fetch("/api/configurations/regions");
            const data = await res.json();

            if (data?.success && data?.data) {
                const normalized = data.data.map((r: any) => ({
                    ...r,
                    _normId: getId(r),
                }));
                setRegions(normalized);
            }
        } catch (e) {
            console.error("Error fetching regions:", e);
        }
    };

    const fetchBranches = async () => {
        try {
            setLoading(true);
            const response = await fetch("/api/configurations/branches");
            const data = await response.json();

            if (data.success && data.data) {
                const normalized = data.data.map((b: any) => ({
                    ...b,
                    _normId: getId(b),
                    _normRegionId: getRegionId(b),
                }));
                setBranches(normalized);
            } else {
                sweetAlert({
                    title: "Error",
                    text: data.error || "Failed to fetch branches",
                    icon: "error",
                });
            }
        } catch (error) {
            console.error("Error fetching branches:", error);
            sweetAlert({
                title: "Error",
                text: "An error occurred while fetching branches.",
                icon: "error",
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBranches();
        fetchRegions();
    }, []);

    const mode = Form.useWatch("mode", form);
    const regionId = Form.useWatch("region", form);

    const filteredBranches = useMemo(() => {
        if (!regionId) return [];
        return branches.filter((b) => b.regionId === regionId);
    }, [branches, regionId]);

    useEffect(() => {
        // reset branch whenever region changes
        form.setFieldsValue({ branch: undefined });
    }, [regionId, form]);

    useEffect(() => {
        if (mode === "REMOTE") {
            form.setFieldsValue({ region: undefined, branch: undefined });
        }
    }, [mode, form]);

    const onFinish = (values: any) => {
        startSession({
            userId: user!._id as string,
            mode: values.mode,
            branch: values.mode === "ONSITE" ? values.branch : undefined,
            region: values.mode === "ONSITE" ? values.region : undefined,
        });

        sweetAlert({ title: "Success", text: "Session set successfully.", icon: "success" });
        router.push("/dashboard");
    };

    return (
        <div className="mx-auto max-w-xl p-6">
            <h1 className="text-xl font-semibold mb-2">Set your work session</h1>

            <Form form={form} layout="vertical" onFinish={onFinish} initialValues={{ mode: "ONSITE" }}>
                <Form.Item name="mode" label="Mode" rules={[{ required: true }]}>
                    <Radio.Group>
                        <Radio value="ONSITE">On-site</Radio>
                        <Radio value="REMOTE">Remote</Radio>
                    </Radio.Group>
                </Form.Item>

                {mode === "ONSITE" && (
                    <>
                        <Form.Item name="region" label="Region" rules={[{ required: true }]}>
                            <Select
                                allowClear
                                placeholder="Select region"
                                loading={loading}
                                options={regions.map((r) => ({
                                    value: r.id,          // ✅ always a string
                                    label: r.name,
                                }))}
                            />
                        </Form.Item>

                        <Form.Item name="branch" label="Branch" rules={[{ required: true }]}>
                            <Select
                                allowClear
                                disabled={!regionId}
                                placeholder={regionId ? "Select branch" : "Select a region first"}
                                loading={loading}
                                options={filteredBranches.map((b) => ({
                                    value: b._id,          // ✅ stable unique ID
                                    label: b.name,
                                }))}
                            />
                        </Form.Item>
                    </>
                )}

                <Button color="primary" fullWidth onClick={() => form.submit()}>
                    Continue
                </Button>
            </Form>
        </div>
    );
};

export default SessionPage;
