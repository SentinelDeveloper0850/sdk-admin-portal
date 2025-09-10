"use client";

import { Avatar, Badge, Chip } from '@nextui-org/react';
import { Drawer, List, Space, Tag, Typography } from 'antd';
import { Users } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { useAuth } from '@/context/auth-context';

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

export default function Presence() {
  const [online, setOnline] = useState<OnlineUserFromServer[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const { user } = useAuth();
  const heartbeatIntervalRef = useRef<number | null>(null);
  const fetchIntervalRef = useRef<number | null>(null);

  const currentUserId = user?._id?.toString?.();
  const otherOnline = currentUserId ? online.filter(u => u.id !== currentUserId) : online;

  // Heartbeat: POST to /api/presence to update user's lastSeenAt
  const sendHeartbeat = async () => {
    if (!user) return;
    try {
      await fetch('/api/presence', { method: 'POST' });
      setLastError(null);
    } catch (error: any) {
      console.error('Heartbeat failed:', error);
      setLastError('Heartbeat failed');
    }
  };

  // Fetch online list
  const fetchOnline = async () => {
    setIsSyncing(true);
    try {
      const res = await fetch('/api/presence');
      if (!res.ok) throw new Error(`Failed to fetch presence (${res.status})`);
      const data = await res.json();
      setOnline(Array.isArray(data.online) ? data.online : []);
      setLastError(null);
    } catch (error: any) {
      console.error('Fetch online failed:', error);
      setLastError(error.message || 'Failed to fetch online users');
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    // Start polling only when logged in
    if (!user) {
      setOnline([]);
      if (heartbeatIntervalRef.current) clearInterval(heartbeatIntervalRef.current);
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
      if (document.visibilityState === 'visible') {
        // Refresh quickly when tab becomes visible
        sendHeartbeat();
        fetchOnline();
      }
    };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      if (heartbeatIntervalRef.current) clearInterval(heartbeatIntervalRef.current);
      if (fetchIntervalRef.current) clearInterval(fetchIntervalRef.current);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [user]);

  // Function to get user initials for avatar
  const getUserInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 3);
  };

  // Determine sync status for display
  const getConnectionStatus = () => {
    if (!user) return 'Not Logged In';
    if (isSyncing) return 'Syncing...';
    if (lastError) return 'Error';
    return 'Online';
  };

  const getConnectionColor = () => {
    if (!user) return 'danger';
    if (isSyncing) return 'warning';
    if (lastError) return 'danger';
    return 'success';
  };

  // Handle chip click - open drawer
  const handleChipClick = () => {
    setIsDrawerOpen(true);
  };

  return (
    <>
      <div className="flex items-center gap-2">
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
      </div>

      {/* Ant Design Drawer */}
      <Drawer
        title={
          <Space>
            <span>Online Users ({otherOnline.length})</span>
            <Tag color={getConnectionColor()}>
              {getConnectionStatus()}
            </Tag>
          </Space>
        }
        placement="right"
        onClose={() => setIsDrawerOpen(false)}
        open={isDrawerOpen}
        styles={{
          body: { padding: 0 },
          header: { borderBottom: '1px solid #f0f0f0' }
        }}
      >
        <div className="h-full flex flex-col">
          {/* User List */}
          <div className="flex-1 overflow-y-auto">
            {lastError ? (
              <div className="flex h-full items-center justify-center text-red-500 p-4">
                <div className="text-center">
                  <p>Error: {lastError}</p>
                  <br />
                  <p className="text-sm">
                    We will retry automatically
                  </p>
                </div>
              </div>
            ) : otherOnline.length === 0 ? (
              <div className="flex h-full items-center justify-center text-gray-500 dark:text-gray-400 p-4">
                <p className="text-sm">
                  {isSyncing ? 'Syncing...' : 'No other users online'}
                </p>
              </div>
            ) : (
              <List
                dataSource={otherOnline}
                renderItem={(user) => (
                  <List.Item key={user.id} className="px-0">
                    <div className="mx-2 w-full flex items-center gap-3 p-2 text-white bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <Avatar
                        src={user.avatarUrl || ""}
                        size="sm"
                        name={user.name}
                        className="flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-base font-normal text-gray-900 dark:text-white truncate">
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
          <div className="border-t border-gray-200 dark:border-gray-700 p-4">
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
          </div>
        </div>
      </Drawer>
    </>
  );
} 