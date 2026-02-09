"use client";

import { useAuth } from "@/context/auth-context";
import { Button } from "@nextui-org/react";
import { Form, Radio, Select } from "antd";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import sweetAlert from "sweetalert";

const getId = (x: any) => String(x?._id ?? x?.id ?? "");
const getRegionId = (x: any) => String(x?.regionId?._id ?? x?.regionId ?? "");

const getTimeGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
};

const getFirstName = (fullName?: string) => {
    if (!fullName) return "there";
    const first = fullName.trim().split(/\s+/)[0];
    return first || "there";
};

const SessionPage = () => {
    const [form] = Form.useForm();
    const router = useRouter();
    const { user, startSession } = useAuth();

    const [branches, setBranches] = useState<any[]>([]);
    const [regions, setRegions] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    const greeting = useMemo(() => getTimeGreeting(), []);
    const firstName = useMemo(
        () => getFirstName((user as any)?.firstName ?? (user as any)?.name ?? (user as any)?.fullName),
        [user]
    );

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
            regionName: values.mode === "ONSITE" ? regions.find(r => r.id === values.region)?.name : undefined,
            branchName: values.mode === "ONSITE" ? branches.find(b => b._id === values.branch)?.name : undefined,
        });

        sweetAlert({ title: "Success", text: "Session set successfully.", icon: "success" });
        router.push("/dashboard");
    };

    return (
        <div className="mx-auto w-full max-w-5xl px-4 py-10">
            <div className="grid gap-6 md:grid-cols-2">
                {/* LEFT: Welcome + Form */}
                <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                    <div className="mb-5">
                        <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                            {greeting}, {firstName}!
                        </p>
                        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-zinc-900 dark:text-white">
                            Welcome back.
                        </h1>
                        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                            Where are you working from today?
                        </p>
                    </div>

                    <Form form={form} layout="vertical" onFinish={onFinish} initialValues={{ mode: "ONSITE" }}>
                        <Form.Item name="mode" label="Mode" rules={[{ required: true }]}>
                            <Radio.Group className="flex gap-3">
                                <Radio.Button value="ONSITE">On-site</Radio.Button>
                                <Radio.Button value="REMOTE">Remote</Radio.Button>
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
                                            value: r.id,
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
                                            value: b._id,
                                            label: b.name,
                                        }))}
                                    />
                                </Form.Item>
                            </>
                        )}

                        <Button color="primary" fullWidth onClick={() => form.submit()}>
                            Continue
                        </Button>

                        <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-400">
                            This helps route queues and tasks to the correct branch context.
                        </p>
                    </Form>
                </div>

                {/* RIGHT: Illustration */}
                <div className="relative overflow-hidden rounded-2xl border border-zinc-200 bg-gradient-to-br from-amber-50 via-white to-zinc-50 p-6 shadow-sm dark:border-zinc-800 dark:from-zinc-900 dark:via-zinc-900 dark:to-zinc-950">
                    <div className="relative z-10">
                        <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">
                            Today’s context
                        </h2>
                        <p className="mt-1 max-w-sm text-sm text-zinc-600 dark:text-zinc-400">
                            Pick your location to keep the branch queue accurate and avoid “who stole my ticket?” moments.
                        </p>

                        <div className="mt-6 grid grid-cols-2 gap-3">
                            <div className="rounded-xl border border-zinc-200 bg-white/70 p-4 backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/60">
                                <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Mode</p>
                                <p className="mt-1 text-sm font-semibold text-zinc-900 dark:text-white">
                                    {mode === "REMOTE" ? "Remote" : "On-site"}
                                </p>
                            </div>

                            <div className="rounded-xl border border-zinc-200 bg-white/70 p-4 backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/60">
                                <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Region</p>
                                <p className="mt-1 text-sm font-semibold text-zinc-900 dark:text-white">
                                    {mode === "REMOTE"
                                        ? "—"
                                        : regions.find((r) => r.id === regionId)?.name ?? "Not selected"}
                                </p>
                            </div>

                            <div className="col-span-2 rounded-xl border border-zinc-200 bg-white/70 p-4 backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/60">
                                <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Why we ask</p>
                                <p className="mt-1 text-sm text-zinc-700 dark:text-zinc-300">
                                    Your queue actions are routed based on branch context. Choosing correctly keeps the workflow clean.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Decorative shapes */}
                    <div className="pointer-events-none absolute -right-10 -top-10 h-56 w-56 rounded-full bg-amber-200/40 blur-2xl dark:bg-amber-500/10" />
                    <div className="pointer-events-none absolute -bottom-16 left-10 h-72 w-72 rounded-full bg-zinc-200/40 blur-2xl dark:bg-zinc-700/10" />

                    {/* Simple "graphic" */}
                    <div className="pointer-events-none absolute bottom-6 right-6 z-0">
                        <div className="grid grid-cols-3 gap-2 opacity-60">
                            {Array.from({ length: 9 }).map((_, i) => (
                                <div
                                    key={i}
                                    className="h-10 w-10 rounded-xl border border-zinc-200 bg-white/70 backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/60"
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SessionPage;
