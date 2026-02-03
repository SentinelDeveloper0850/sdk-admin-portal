"use client";

import { useEffect, useRef, useState } from "react";

import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import { Avatar, Badge, Chip } from "@nextui-org/react";
import { Drawer, List, Space, Tag, Typography } from "antd";
import { Users } from "lucide-react";

import { useAuth } from "@/context/auth-context";

const { Text } = Typography;

// Online user from presence API
interface OnlineUserFromServer {
  id: string;
  name: string;
  avatarUrl?: string;
  role?: string;
  roles?: string[];
  lastSeenAt?: string | Date;
}

export default function Presence({
  showBadge = true,
}: {
  showBadge?: boolean;
}) {
  const [online, setOnline] = useState<OnlineUserFromServer[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const { user } = useAuth();
  const heartbeatIntervalRef = useRef<number | null>(null);
  const fetchIntervalRef = useRef<number | null>(null);

  const currentUserId = user?._id?.toString?.();
  const otherOnline = currentUserId
    ? online.filter((u) => u.id !== currentUserId)
    : online;

  const logoutUser = async () => {
    try {
      const res = await fetch("/api/auth/logout", { method: "POST" });
      if (!res.ok) throw new Error(`Failed to logout (${res.status})`);
      window.location.href = "/login";
    } catch (error: any) {
      console.error("Logout failed:", error);
      window.location.href = "/login";
    }
    window.location.href = "/login";
  };

  // Heartbeat: POST to /api/presence to update user's lastSeenAt
  const sendHeartbeat = async () => {
    if (!user) return;
    try {
      const res = await fetch("/api/presence", { method: "POST" });
      if (!res.ok) throw new Error(`Failed to send heartbeat (${res.status})`);
      if (res.status === 401) {
        await logoutUser();
      }
      setLastError(null);
    } catch (error: any) {
      console.error("Heartbeat failed:", error);
      setLastError("Heartbeat failed");
    }
  };

  // Fetch online list
  const fetchOnline = async () => {
    setIsSyncing(true);
    try {
      const res = await fetch("/api/presence");
      if (!res.ok) throw new Error(`Failed to fetch presence (${res.status})`);
      const data = await res.json();
      setOnline(Array.isArray(data.online) ? data.online : []);
      setLastError(null);
    } catch (error: any) {
      console.error("Fetch online failed:", error);
      setLastError(error.message || "Failed to fetch online users");
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    // Start polling only when logged in
    if (!user) {
      setOnline([]);
      if (heartbeatIntervalRef.current)
        clearInterval(heartbeatIntervalRef.current);
      if (fetchIntervalRef.current) clearInterval(fetchIntervalRef.current);
      return;
    }

    // Initial ping and fetch
    sendHeartbeat();
    fetchOnline();

    // Heartbeat every 30s
    heartbeatIntervalRef.current = window.setInterval(sendHeartbeat, 30_000);
    // Refresh list every 15s
    fetchIntervalRef.current = window.setInterval(fetchOnline, 15_000);

    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        // Refresh quickly when tab becomes visible
        sendHeartbeat();
        fetchOnline();
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      if (heartbeatIntervalRef.current)
        clearInterval(heartbeatIntervalRef.current);
      if (fetchIntervalRef.current) clearInterval(fetchIntervalRef.current);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [user]);

  // Function to get user initials for avatar
  const getUserInitials = (name: string) => {
    return name
      .split(" ")
      .map((word) => word.charAt(0))
      .join("")
      .toUpperCase()
      .slice(0, 3);
  };

  // Determine sync status for display
  const getConnectionStatus = () => {
    if (!user) return "Not Logged In";
    if (isSyncing) return <ReloadOutlined className="animate-spin" />;
    if (lastError) return <CloseCircleOutlined className="text-red-500" />;
    return <CheckCircleOutlined className="text-green-500" />;
  };

  const getConnectionColor = () => {
    if (!user) return "danger";
    if (isSyncing) return "warning";
    if (lastError) return "danger";
    return "success";
  };

  // Handle chip click - open drawer
  const handleChipClick = () => {
    setIsDrawerOpen(true);
  };

  return (
    <>
      <div className="flex items-center gap-2">
        {showBadge ? (
          <Badge
            content={otherOnline.length}
            color={getConnectionColor()}
            isInvisible={otherOnline.length === 0}
          >
            <Chip
              variant="flat"
              color={getConnectionColor()}
              startContent={<Users size={16} />}
              className="cursor-pointer"
              onClick={handleChipClick}
            >
              {getConnectionStatus()}
            </Chip>
          </Badge>
        ) : (
          <Chip
            variant="flat"
            color={getConnectionColor()}
            startContent={<Users size={14} className="ml-2" />}
            className="cursor-pointer"
            onClick={handleChipClick}
          >
            {otherOnline.length} {getConnectionStatus()}
          </Chip>
        )}
      </div>

      {/* Ant Design Drawer */}
      <Drawer
        title={
          <Space>
            <span className="text-sm">Online Users ({otherOnline.length})</span>
            <Tag color={getConnectionColor()}>{getConnectionStatus()}</Tag>
          </Space>
        }
        placement="right"
        onClose={() => setIsDrawerOpen(false)}
        open={isDrawerOpen}
        styles={{
          body: { padding: 0 },
          header: { borderBottom: "1px solid #f0f0f0" },
        }}
      >
        <div className="flex h-full flex-col">
          {/* User List */}
          <div className="flex-1 overflow-y-auto">
            {lastError ? (
              <div className="flex h-full items-center justify-center p-4 text-red-500">
                <div className="text-center">
                  <p>Error: {lastError}</p>
                  <br />
                  <p className="text-sm">We will retry automatically</p>
                </div>
              </div>
            ) : otherOnline.length === 0 ? (
              <div className="flex h-full items-center justify-center p-4 text-gray-500 dark:text-gray-400">
                <p className="text-sm">
                  {isSyncing ? "Syncing..." : "No other users online"}
                </p>
              </div>
            ) : (
              <List
                dataSource={otherOnline}
                renderItem={(user) => (
                  <List.Item key={user.id} className="px-0">
                    <div className="mx-2 flex w-full items-center gap-3 rounded-lg bg-green-50 p-2 text-white dark:bg-green-900/20">
                      <Avatar
                        src={user.avatarUrl || ""}
                        size="sm"
                        name={user.name}
                        className="flex-shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-base font-normal text-gray-900 dark:text-white">
                          {user.name}
                        </p>
                      </div>
                    </div>
                  </List.Item>
                )}
              />
            )}
          </div>

          {/* Footer */}
          {/* <div className="border-t border-gray-200 dark:border-gray-700 p-4">
            <Space direction="vertical" size="small" className="w-full">
              <Space>
                <div className={`h-2 w-2 rounded-full ${(!user || lastError) ? 'bg-red-500' : isSyncing ? 'bg-yellow-500' : 'bg-green-500'}`}></div>
                <p className="text-sm">
                  Status: {getConnectionStatus()}
                </p>
              </Space>
              {user && (
                <div className="space-y-1">
                  <p className="text-xs">
                    User ID: {user._id?.toString()}
                  </p>
                </div>
              )}
            </Space>
          </div> */}
        </div>
      </Drawer>
    </>
  );
}
