"use client";

import { Avatar, Badge, Chip } from '@nextui-org/react';
import { Drawer, List, Space, Tabs, Tag, Typography } from 'antd';
import { MessageCircle, Users, Wifi, WifiOff } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { io, type Socket } from 'socket.io-client';

import { useAuth } from '@/context/auth-context';
import { CheckCircleOutlined, CloseCircleOutlined, ReloadOutlined } from '@ant-design/icons';

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

type ConnectivityStatus = {
  browserOnline: boolean;
  reachable: boolean;
  checking: boolean;
  lastCheckedAt?: number;
  lastOkAt?: number;
  lastError?: string;
  latencyMs?: number;
};

type ChatMessage = {
  id: string;
  fromUserId: string;
  toUserId: string;
  text: string;
  ts: number;
};

export default function Presence({ showBadge = true }: { showBadge?: boolean }) {
  const [online, setOnline] = useState<OnlineUserFromServer[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastPresenceError, setLastPresenceError] = useState<string | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'online' | 'chat'>('online');
  const [chatUser, setChatUser] = useState<OnlineUserFromServer | null>(null);
  const [chatDraft, setChatDraft] = useState('');
  const [chatError, setChatError] = useState<string | null>(null);
  const [chatConnected, setChatConnected] = useState(false);
  const [chatHistoryLoading, setChatHistoryLoading] = useState(false);
  const [messagesByUserId, setMessagesByUserId] = useState<Record<string, ChatMessage[]>>({});
  const [connectivity, setConnectivity] = useState<ConnectivityStatus>({
    browserOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    reachable: true,
    checking: false,
  });
  const { user } = useAuth();
  const heartbeatIntervalRef = useRef<number | null>(null);
  const fetchIntervalRef = useRef<number | null>(null);
  const connectivityIntervalRef = useRef<number | null>(null);
  const socketRef = useRef<Socket | null>(null);

  const currentUserId = user?._id?.toString?.();
  const otherOnline = currentUserId ? online.filter(u => u.id !== currentUserId) : online;

  const logoutUser = async () => {
    try {
      const res = await fetch('/api/auth/logout', { method: 'POST' });
      if (!res.ok) throw new Error(`Failed to logout (${res.status})`);
    } catch (error: any) {
      console.error('Logout failed:', error);
    }
    window.location.href = '/login';
  };

  // Heartbeat: POST to /api/presence to update user's lastSeenAt
  const sendHeartbeat = async () => {
    if (!user) return;
    try {
      const res = await fetch('/api/presence', { method: 'POST' });
      if (res.status === 401) {
        await logoutUser();
        return;
      }
      if (!res.ok) throw new Error(`Failed to send heartbeat (${res.status})`);
      setLastPresenceError(null);
    } catch (error: any) {
      console.error('Heartbeat failed:', error);
      setLastPresenceError('Heartbeat failed');
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
      setLastPresenceError(null);
    } catch (error: any) {
      console.error('Fetch online failed:', error);
      setLastPresenceError(error.message || 'Failed to fetch online users');
    } finally {
      setIsSyncing(false);
    }
  };

  const checkReachability = async () => {
    // If the browser reports offline, treat as not reachable without doing a fetch.
    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      setConnectivity((prev) => ({
        ...prev,
        browserOnline: false,
        reachable: false,
        checking: false,
        lastCheckedAt: Date.now(),
        lastError: 'Browser offline',
      }));
      return;
    }

    const startedAt = Date.now();
    setConnectivity((prev) => ({
      ...prev,
      browserOnline: true,
      checking: true,
      lastCheckedAt: startedAt,
    }));

    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 3500);
    try {
      const res = await fetch('/api/health', {
        method: 'GET',
        cache: 'no-store',
        signal: controller.signal,
      });
      const latencyMs = Date.now() - startedAt;
      if (!res.ok) throw new Error(`Health check failed (${res.status})`);
      setConnectivity((prev) => ({
        ...prev,
        browserOnline: true,
        reachable: true,
        checking: false,
        lastOkAt: Date.now(),
        lastError: undefined,
        latencyMs,
      }));
    } catch (error: any) {
      const latencyMs = Date.now() - startedAt;
      setConnectivity((prev) => ({
        ...prev,
        browserOnline: true,
        reachable: false,
        checking: false,
        lastError: error?.name === 'AbortError' ? 'Health check timed out' : (error?.message || 'Health check failed'),
        latencyMs,
      }));
    } finally {
      window.clearTimeout(timeout);
    }
  };

  useEffect(() => {
    // Start polling only when logged in
    if (!user) {
      setOnline([]);
      if (heartbeatIntervalRef.current) clearInterval(heartbeatIntervalRef.current);
      if (fetchIntervalRef.current) clearInterval(fetchIntervalRef.current);
      if (connectivityIntervalRef.current) clearInterval(connectivityIntervalRef.current);

      // Chat cleanup
      socketRef.current?.disconnect();
      socketRef.current = null;
      setChatConnected(false);
      setChatError(null);
      setChatUser(null);
      setChatDraft('');
      setMessagesByUserId({});
      return;
    }

    // Initial ping and fetch
    sendHeartbeat();
    fetchOnline();
    checkReachability();

    // Heartbeat every 30s
    heartbeatIntervalRef.current = window.setInterval(sendHeartbeat, 30_000);
    // Refresh list every 15s
    fetchIntervalRef.current = window.setInterval(fetchOnline, 15_000);
    // Connectivity check every 10s (lightweight /api/health)
    connectivityIntervalRef.current = window.setInterval(checkReachability, 10_000);

    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        // Refresh quickly when tab becomes visible
        sendHeartbeat();
        fetchOnline();
        checkReachability();
      }
    };
    document.addEventListener('visibilitychange', onVisibility);

    const onOnline = () => {
      setConnectivity((prev) => ({ ...prev, browserOnline: true }));
      checkReachability();
    };
    const onOffline = () => {
      setConnectivity((prev) => ({
        ...prev,
        browserOnline: false,
        reachable: false,
        checking: false,
        lastCheckedAt: Date.now(),
        lastError: 'Browser offline',
      }));
    };
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);

    return () => {
      if (heartbeatIntervalRef.current) clearInterval(heartbeatIntervalRef.current);
      if (fetchIntervalRef.current) clearInterval(fetchIntervalRef.current);
      if (connectivityIntervalRef.current) clearInterval(connectivityIntervalRef.current);
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, [user]);

  // Real-time chat socket connection (auth via cookies).
  useEffect(() => {
    if (!user) return;
    if (socketRef.current) return;

    const s = io({
      path: '/api/socket',
      withCredentials: true,
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelayMax: 5000,
    });

    socketRef.current = s;

    const onConnect = () => {
      setChatConnected(true);
      setChatError(null);
    };
    const onDisconnect = () => {
      setChatConnected(false);
    };
    const onConnectError = (err: any) => {
      setChatConnected(false);
      setChatError(err?.message || 'Chat connection failed');
    };

    const onMessage = (msg: ChatMessage) => {
      const me = currentUserId;
      if (!me) return;
      const otherId = msg.fromUserId === me ? msg.toUserId : msg.fromUserId;
      setMessagesByUserId((prev) => {
        const existing = prev[otherId] ?? [];
        // De-dupe by id
        if (existing.some((m) => m.id === msg.id)) return prev;
        return { ...prev, [otherId]: [...existing, msg] };
      });
    };

    s.on('connect', onConnect);
    s.on('disconnect', onDisconnect);
    s.on('connect_error', onConnectError);
    s.on('chat:message', onMessage);

    return () => {
      s.off('connect', onConnect);
      s.off('disconnect', onDisconnect);
      s.off('connect_error', onConnectError);
      s.off('chat:message', onMessage);
      s.disconnect();
      socketRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const loadChatHistory = async (withUserId: string) => {
    const s = socketRef.current;
    if (!s || !chatConnected) return;
    setChatHistoryLoading(true);
    setChatError(null);
    try {
      const messages: ChatMessage[] = await new Promise((resolve) => {
        s.emit('chat:history', { withUserId, limit: 50 }, (msgs: ChatMessage[]) => resolve(msgs ?? []));
      });
      setMessagesByUserId((prev) => ({ ...prev, [withUserId]: messages }));
    } finally {
      setChatHistoryLoading(false);
    }
  };

  // Determine sync status for display
  const getConnectionStatus = () => {
    if (!user) return 'Not Logged In';
    if (isSyncing) return <ReloadOutlined className="animate-spin" />;
    if (lastPresenceError) return <CloseCircleOutlined className="text-red-500" />;
    return <CheckCircleOutlined className="text-green-500" />;
  };

  const getConnectionColor = () => {
    if (!user) return 'danger';
    if (isSyncing) return 'warning';
    if (lastPresenceError) return 'danger';
    return 'success';
  };

  const getInternetTag = () => {
    if (!connectivity.browserOnline) {
      return (
        <Tag color="red">
          <Space size={6}>
            <WifiOff size={14} />
            <span>Offline</span>
          </Space>
        </Tag>
      );
    }
    if (connectivity.checking) {
      return (
        <Tag color="orange">
          <Space size={6}>
            <Wifi size={14} />
            <span>Checking…</span>
          </Space>
        </Tag>
      );
    }
    if (!connectivity.reachable) {
      return (
        <Tag color="red" title={connectivity.lastError || 'Connectivity issue'}>
          <Space size={6}>
            <WifiOff size={14} />
            <span>Connectivity issue</span>
          </Space>
        </Tag>
      );
    }
    return (
      <Tag color="green" title={typeof connectivity.latencyMs === 'number' ? `Latency: ${connectivity.latencyMs}ms` : undefined}>
        <Space size={6}>
          <Wifi size={14} />
          <span>Online</span>
        </Space>
      </Tag>
    );
  };

  const handleStartChat = (u: OnlineUserFromServer) => {
    setChatUser(u);
    setActiveTab('chat');
    setChatDraft('');
    if (socketRef.current) {
      loadChatHistory(u.id);
    }
  };

  const sendChatMessage = async () => {
    if (!currentUserId) return;
    const s = socketRef.current;
    if (!s || !chatConnected) {
      setChatError('Chat is not connected');
      return;
    }
    if (!chatUser) {
      setChatError('Select a user to chat');
      return;
    }
    const text = chatDraft.trim();
    if (!text) return;

    setChatError(null);
    const result = await new Promise<{ ok: true; message: ChatMessage } | { ok: false; error: string }>((resolve) => {
      s.emit('chat:message', { toUserId: chatUser.id, text }, (r: any) => resolve(r));
    });

    if (!result.ok) {
      setChatError(result.error || 'Failed to send message');
      return;
    }

    // Message is also broadcast back, but append immediately for snappy UX.
    const msg = result.message;
    setMessagesByUserId((prev) => {
      const existing = prev[chatUser.id] ?? [];
      if (existing.some((m) => m.id === msg.id)) return prev;
      return { ...prev, [chatUser.id]: [...existing, msg] };
    });
    setChatDraft('');
  };

  // Handle chip click - open drawer
  const handleChipClick = () => {
    setIsDrawerOpen(true);
  };

  return (
    <>
      <div className="flex items-center gap-2">
        {showBadge ? (<Badge
          content={otherOnline.length}
          color={getConnectionColor()}
          isInvisible={otherOnline.length === 0}
        >
          <Chip
            variant="flat"
            color={getConnectionColor()}
            startContent={
              <div className="flex items-center gap-1">
                <Users size={16} />
                {connectivity.reachable && connectivity.browserOnline ? (
                  <Wifi size={14} className="opacity-80" />
                ) : (
                  <WifiOff size={14} className="opacity-80" />
                )}
              </div>
            }
            className="cursor-pointer"
            onClick={handleChipClick}
          >
            {getConnectionStatus()}
          </Chip>
        </Badge>) : (<Chip
          variant="flat"
          color={getConnectionColor()}
          startContent={
            <div className="ml-2 flex items-center gap-1">
              <Users size={14} />
              {connectivity.reachable && connectivity.browserOnline ? (
                <Wifi size={13} className="opacity-80" />
              ) : (
                <WifiOff size={13} className="opacity-80" />
              )}
            </div>
          }
          className="cursor-pointer"
          onClick={handleChipClick}
        >
          {otherOnline.length} {getConnectionStatus()}
        </Chip>)}
      </div>

      {/* Ant Design Drawer */}
      <Drawer
        title={
          <Space>
            <span className="text-sm">Online Users ({otherOnline.length})</span>
            <Tag color={getConnectionColor()}>
              {getConnectionStatus()}
            </Tag>
            {getInternetTag()}
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
          <Tabs
            activeKey={activeTab}
            onChange={(k) => setActiveTab(k as 'online' | 'chat')}
            items={[
              {
                key: 'online',
                label: 'Online',
                children: (
                  <div className="flex-1 overflow-y-auto">
                    {lastPresenceError ? (
                      <div className="flex h-full items-center justify-center text-red-500 p-4">
                        <div className="text-center">
                          <p>Error: {lastPresenceError}</p>
                          <br />
                          <p className="text-sm">
                            We will retry automatically
                          </p>
                          {!connectivity.reachable && (
                            <p className="mt-2 text-xs text-red-400">
                              Tip: you may have an internet connectivity issue.
                            </p>
                          )}
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
                        renderItem={(u) => (
                          <List.Item key={u.id} className="px-0">
                            <button
                              type="button"
                              className="mx-2 w-full flex items-center gap-3 p-2 bg-green-50 dark:bg-green-900/20 rounded-lg hover:opacity-90 text-left"
                              onClick={() => handleStartChat(u)}
                              title="Open chat"
                            >
                              <Avatar
                                src={u.avatarUrl || ""}
                                size="sm"
                                name={u.name}
                                className="flex-shrink-0"
                              />
                              <div className="flex-1 min-w-0">
                                <p className="text-base font-normal text-gray-900 dark:text-white truncate">
                                  {u.name}
                                </p>
                              </div>
                              <MessageCircle size={16} className="opacity-70" />
                            </button>
                          </List.Item>
                        )}
                      />
                    )}
                  </div>
                )
              },
              {
                key: 'chat',
                label: 'Chat',
                children: (
                  <div className="h-full flex flex-col">
                    <div className="border-b border-gray-200 dark:border-gray-700 p-3">
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {chatUser ? `Chat with ${chatUser.name}` : 'Chat'}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {chatConnected ? 'Connected' : 'Connecting…'}
                          </p>
                        </div>
                        {getInternetTag()}
                      </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4">
                      {!chatUser ? (
                        <div className="text-sm text-gray-600 dark:text-gray-300">
                          Select a user from the Online tab to start a chat.
                        </div>
                      ) : chatHistoryLoading ? (
                        <div className="text-sm text-gray-600 dark:text-gray-300">
                          Loading messages…
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {(messagesByUserId[chatUser.id] ?? []).map((m) => {
                            const mine = m.fromUserId === currentUserId;
                            return (
                              <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                                <div
                                  className={[
                                    'max-w-[85%] rounded-lg px-3 py-2 text-sm',
                                    mine
                                      ? 'bg-blue-600 text-white'
                                      : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100',
                                  ].join(' ')}
                                  title={new Date(m.ts).toLocaleString()}
                                >
                                  <div className="whitespace-pre-wrap break-words">{m.text}</div>
                                </div>
                              </div>
                            );
                          })}
                          {(messagesByUserId[chatUser.id] ?? []).length === 0 && (
                            <div className="text-sm text-gray-600 dark:text-gray-300">
                              No messages yet — say hi.
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="border-t border-gray-200 dark:border-gray-700 p-3">
                      <div className="flex gap-2">
                        <input
                          className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-transparent px-3 py-2 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 disabled:opacity-60"
                          placeholder={chatUser ? "Type a message…" : "Select a user to chat"}
                          value={chatDraft}
                          onChange={(e) => setChatDraft(e.target.value)}
                          disabled={!chatUser || !chatConnected || !connectivity.reachable || !connectivity.browserOnline}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              sendChatMessage();
                            }
                          }}
                        />
                        <button
                          type="button"
                          className="rounded-md bg-blue-600 text-white px-3 py-2 text-sm disabled:opacity-60"
                          onClick={sendChatMessage}
                          disabled={!chatUser || !chatConnected || !chatDraft.trim() || !connectivity.reachable || !connectivity.browserOnline}
                        >
                          Send
                        </button>
                      </div>
                      {chatError && (
                        <div className="mt-2 text-xs text-red-500">
                          {chatError}
                        </div>
                      )}
                      {!connectivity.reachable && (
                        <div className="mt-2 text-xs text-red-500">
                          Connectivity issue detected — chat and presence updates may be delayed.
                        </div>
                      )}
                    </div>
                  </div>
                )
              }
            ]}
          />

          {/* Footer */}
          {/* <div className="border-t border-gray-200 dark:border-gray-700 p-4">
            <Space direction="vertical" size="small" className="w-full">
              <Space>
                <div className={`h-2 w-2 rounded-full ${(!user || lastPresenceError) ? 'bg-red-500' : isSyncing ? 'bg-yellow-500' : 'bg-green-500'}`}></div>
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