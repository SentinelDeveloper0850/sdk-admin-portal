"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */

import { Button, Input, Space, Table, Tag, Typography } from "antd";
import axios from "axios";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { useEffect, useMemo, useState } from "react";
import sweetAlert from "sweetalert";

import PageHeader from "@/app/components/page-header";
import { useAuth } from "@/context/auth-context";

dayjs.extend(relativeTime);

const { Title, Text } = Typography;

type SessionRow = {
    id: string;
    user: {
        id: string;
        name: string;
        email: string;
        avatarUrl?: string;
        role?: string;
        roles?: string[];
    } | null;
    platform: "WEB" | "STAFF_APP" | string;
    mode: "ONSITE" | "REMOTE" | string;
    regionId: string | null;
    branchId: string | null;
    regionName: string | null;
    branchName: string | null;
    lastSeenAt: string;
    expiresAt: string;
    createdAt: string;
};

export default function ActiveSessionsPage() {
    const { isManagement } = useAuth();

    const [loading, setLoading] = useState(false);
    const [rows, setRows] = useState<SessionRow[]>([]);
    const [q, setQ] = useState("");
    const [revokingId, setRevokingId] = useState<string | null>(null);

    const fetchSessions = async () => {
        try {
            setLoading(true);
            const res = await axios.get("/api/management/sessions");
            const data = res.data?.data ?? [];
            setRows(data);
        } catch (e: any) {
            console.error(e);
            const msg = e?.response?.data?.message ?? "Failed to load sessions";
            sweetAlert({ title: "Error", text: msg, icon: "error" });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isManagement) fetchSessions();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isManagement]);

    const filtered = useMemo(() => {
        const term = q.trim().toLowerCase();
        if (!term) return rows;

        return rows.filter((r) => {
            const name = (r.user?.name ?? "").toLowerCase();
            const email = (r.user?.email ?? "").toLowerCase();
            const mode = String(r.mode ?? "").toLowerCase();
            const platform = String(r.platform ?? "").toLowerCase();
            const region = (r.regionName ?? "").toLowerCase();
            const branch = (r.branchName ?? "").toLowerCase();
            return (
                name.includes(term) ||
                email.includes(term) ||
                mode.includes(term) ||
                platform.includes(term) ||
                region.includes(term) ||
                branch.includes(term)
            );
        });
    }, [rows, q]);

    const revokeSession = async (sessionId: string) => {
        const ok = await sweetAlert({
            title: "End this session?",
            text: "This will remove the user's active session and they may be forced to re-select context or sign in again.",
            icon: "warning",
            buttons: ["Cancel", "End session"],
            dangerMode: true,
        });

        if (!ok) return;

        try {
            setRevokingId(sessionId);
            await axios.post("/api/management/sessions/revoke", {
                sessionId,
                reason: "Ended by management",
            });

            sweetAlert({ title: "Done", text: "Session ended.", icon: "success" });
            await fetchSessions();
        } catch (e: any) {
            console.error(e);
            const msg = e?.response?.data?.message ?? e?.response?.data?.error ?? "Failed to end session";
            sweetAlert({ title: "Error", text: msg, icon: "error" });
        } finally {
            setRevokingId(null);
        }
    };

    useEffect(() => {
        const interval = setInterval(fetchSessions, 60000);
        return () => clearInterval(interval);
    }, []);

    if (!isManagement) {
        return (
            <div className="p-6">
                <Title level={4} style={{ marginBottom: 8 }}>
                    Active Sessions
                </Title>
                <Text type="secondary">You don’t have permission to view this page.</Text>
            </div>
        );
    }

    return (
        <div className="p-6">
            <PageHeader title="Active Sessions" subtitle="Live view of who is currently active (web + staff app)" actions={[<Button onClick={fetchSessions} loading={loading}>
                Refresh
            </Button>]} />
            <div className="flex items-center justify-between gap-3 flex-wrap">
                <Space>
                    <Input.Search
                        allowClear
                        placeholder="Search name, email, region, branch..."
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                        style={{ width: 320 }}
                    />
                </Space>
            </div>

            <div className="mt-4">
                <Table
                    rowKey="id"
                    loading={loading}
                    dataSource={filtered}
                    pagination={{ pageSize: 25 }}
                    scroll={{ x: 1000 }}
                    size="small"
                    columns={[
                        {
                            title: "User",
                            dataIndex: "user",
                            key: "user",
                            render: (u: SessionRow["user"]) => (
                                <div className="flex flex-col">
                                    <span className="font-medium">{u?.name ?? "—"}</span>
                                    <span className="text-xs text-zinc-500">{u?.email ?? ""}</span>
                                </div>
                            ),
                        },
                        {
                            title: "Platform",
                            dataIndex: "platform",
                            key: "platform",
                            render: (v: string) => <Tag>{v}</Tag>,
                        },
                        {
                            title: "Mode",
                            dataIndex: "mode",
                            key: "mode",
                            render: (v: string) => (
                                <Tag color={v === "REMOTE" ? "blue" : "green"}>{v}</Tag>
                            ),
                        },
                        {
                            title: "Region",
                            dataIndex: "regionName",
                            key: "regionName",
                            render: (v: string | null, row: SessionRow) =>
                                row.mode === "REMOTE" ? "—" : v ?? "—",
                        },
                        {
                            title: "Branch",
                            dataIndex: "branchName",
                            key: "branchName",
                            render: (v: string | null, row: SessionRow) =>
                                row.mode === "REMOTE" ? "—" : v ?? "—",
                        },
                        {
                            title: "Last seen",
                            dataIndex: "lastSeenAt",
                            key: "lastSeenAt",
                            render: (v: string) => (
                                <span title={dayjs(v).format("YYYY-MM-DD HH:mm:ss")}>
                                    {dayjs(v).fromNow()}
                                </span>
                            ),
                        },
                        {
                            title: "Expires",
                            dataIndex: "expiresAt",
                            key: "expiresAt",
                            render: (v: string) => (
                                <span title={dayjs(v).format("YYYY-MM-DD HH:mm:ss")}>
                                    {dayjs(v).fromNow()}
                                </span>
                            ),
                        },
                        {
                            title: "Action",
                            key: "action",
                            fixed: "right",
                            width: 140,
                            render: (_: any, row: SessionRow) => (
                                <Button
                                    danger
                                    size="small"
                                    loading={revokingId === row.id}
                                    onClick={() => revokeSession(row.id)}
                                >
                                    End session
                                </Button>
                            ),
                        },
                    ]}
                />
            </div>
        </div>
    );
}
