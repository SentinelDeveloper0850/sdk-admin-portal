"use client";

import { Avatar, Badge, Chip } from '@nextui-org/react';
import { Drawer, List, Space, Tag, Typography } from 'antd';
import { Users } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

import { useAuth } from '@/context/auth-context';

const { Text } = Typography;

// Interface for online user data from server (simplified)
interface OnlineUserFromServer {
  id: string;        // userId from token
  role?: string;     // role from token
  roles?: string[];  // roles from token
}

// Interface for cached user data (simplified)
interface CachedUser {
  id: string;
  name: string;
  avatarUrl?: string;
}

// Interface for display user data (enriched with cached user info)
interface OnlineUserDisplay {
  id: string;
  name: string;
  avatarUrl?: string;
  role?: string;
  roles?: string[];
}

export default function Presence() {
  const [online, setOnline] = useState<OnlineUserDisplay[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const { user } = useAuth();
  const socketRef = useRef<Socket | null>(null);
  const connectionAttemptRef = useRef<boolean>(false);
  const userCacheRef = useRef<Map<string, CachedUser>>(new Map());
  const usersFetchedRef = useRef<boolean>(false);

  // Function to fetch all users at once
  const fetchAllUsers = async (): Promise<void> => {
    if (usersFetchedRef.current) {
      console.log('Users already fetched, using cache');
      return;
    }

    try {
      console.log('Fetching all users...');
      const response = await fetch('/api/users/badges');

      if (!response.ok) {
        console.warn('Failed to fetch users:', response.status);
        return;
      }

      const users = await response.json();

      // Populate cache with all users
      users.forEach((userData: any) => {
        userCacheRef.current.set(userData._id, {
          id: userData._id,
          name: userData.name,
          avatarUrl: userData.avatarUrl,
        });
      });

      console.log(`Cached ${users.length} users`);
      usersFetchedRef.current = true;
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  // Function to get user details from cache
  const getUserDetails = (userId: string): CachedUser => {
    // Check cache first
    if (userCacheRef.current.has(userId)) {
      return userCacheRef.current.get(userId)!;
    }

    // Return fallback data if not in cache
    const fallbackUser: CachedUser = {
      id: userId,
      name: `User ${userId.slice(-4)}`,
      avatarUrl: undefined,
    };

    userCacheRef.current.set(userId, fallbackUser);
    return fallbackUser;
  };

  // Function to convert server users to display format
  const convertToDisplayUsers = (serverUsers: OnlineUserFromServer[]): OnlineUserDisplay[] => {
    return serverUsers.map(serverUser => {
      const cachedUser = getUserDetails(serverUser.id);

      return {
        id: serverUser.id,
        name: cachedUser.name,
        avatarUrl: cachedUser.avatarUrl,
        role: serverUser.role,
        roles: serverUser.roles,
      };
    });
  };

  const connectToSocket = () => {
    // Prevent multiple simultaneous connection attempts
    if (connectionAttemptRef.current || isConnecting) {
      console.log('Connection attempt already in progress, skipping...');
      return;
    }

    // Get JWT token from cookies
    const getAuthToken = () => {
      return document.cookie
        .split("; ")
        .find((row) => row.startsWith("auth-token="))
        ?.split("=")[1];
    };

    const token = getAuthToken();

    if (!token) {
      console.warn('No auth token found for socket connection');
      setConnectionError('No authentication token');
      return;
    }

    if (!user) {
      // User is not logged in, don't attempt connection
      setIsConnected(false);
      setConnectionError(null);
      return;
    }

    // If already connected, don't reconnect
    if (socketRef.current?.connected) {
      console.log('Socket already connected, skipping reconnection');
      return;
    }

    connectionAttemptRef.current = true;

    // Disconnect existing socket if any
    if (socketRef.current) {
      console.log('Disconnecting existing socket...');
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    // User is logged in, attempt to connect
    setIsConnecting(true);
    setConnectionError(null);

    console.log('Attempting to connect to socket server...');

    // Connect to socket server with JWT authentication and enhanced configuration
    const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3000', {
      auth: {
        token: token,
      },
      // Enhanced WebSocket configuration for better stability
      transports: ['websocket', 'polling'], // Support both WebSocket and polling
      timeout: 10000, // 10 second connection timeout
      forceNew: false, // Reuse existing connection if possible
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    socketRef.current = socket;

    socket.on('connect', async () => {
      console.log('Connected to socket server with ID:', socket.id);
      console.log('User ID:', user._id, 'connected via socket:', socket.id);
      setIsConnected(true);
      setIsConnecting(false);
      setConnectionError(null);
      connectionAttemptRef.current = false;

      // Fetch all users when first connecting
      await fetchAllUsers();

      // Request current online users
      socket.emit('getOnlineUsers');
    });

    socket.on('disconnect', (reason) => {
      console.log('Disconnected from socket server. Reason:', reason);
      console.log('User ID:', user._id, 'disconnected from socket:', socket.id);
      console.log('Disconnect details:', {
        reason,
        socketId: socket.id,
        userId: user._id,
        timestamp: new Date().toISOString()
      });
      setIsConnected(false);
      setIsConnecting(false);
      connectionAttemptRef.current = false;
    });

    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      console.error('Connection error details:', {
        message: error.message,
        name: error.name,
        stack: error.stack,
        timestamp: new Date().toISOString()
      });
      setIsConnected(false);
      setIsConnecting(false);
      setConnectionError(error.message || 'Connection failed');
      connectionAttemptRef.current = false;
    });

    socket.on('reconnect', async (attemptNumber) => {
      console.log('Reconnected to socket server after', attemptNumber, 'attempts');
      console.log('User ID:', user._id, 'reconnected via socket:', socket.id);
      setIsConnected(true);
      setIsConnecting(false);
      setConnectionError(null);

      // Fetch users again if cache is empty
      await fetchAllUsers();

      // Request updated online users after reconnection
      socket.emit('getOnlineUsers');
    });

    socket.on('reconnect_error', (error) => {
      console.error('Socket reconnection error:', error);
      setConnectionError('Reconnection failed');
    });

    socket.on('reconnect_attempt', (attemptNumber) => {
      console.log('Attempting to reconnect... (attempt', attemptNumber, ')');
    });

    socket.on('onlineUsers', (users: OnlineUserFromServer[]) => {
      console.log('Received online users from server:', users);
      console.log('Total online users:', users.length);

      // Convert server data to display format with caching
      const displayUsers = convertToDisplayUsers(users);
      setOnline(displayUsers);
    });

    // Log transport changes
    socket.on('upgrade', () => {
      console.log('Transport upgraded to:', socket.io.engine.transport.name);
    });

    socket.on('upgradeError', (error) => {
      console.error('Transport upgrade error:', error);
    });
  };

  useEffect(() => {
    connectToSocket();

    return () => {
      console.log('Cleaning up socket connection...');
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      connectionAttemptRef.current = false;
    };
  }, [user]); // Reconnect when user changes

  // Function to get user initials for avatar
  const getUserInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 3);
  };

  // Determine connection status for display
  const getConnectionStatus = () => {
    if (isConnecting) return 'Connecting...';
    if (connectionError) return 'Connection Error';
    if (isConnected) return 'Connected';
    if (!user) return 'Not Logged In';
    return 'Disconnected';
  };

  const getConnectionColor = () => {
    if (isConnecting) return 'warning';
    if (connectionError || !user) return 'danger';
    if (isConnected) return 'success';
    return 'danger';
  };

  // Handle chip click - reconnect if disconnected
  const handleChipClick = () => {
    if (!isConnected && !isConnecting && user) {
      // Attempt to reconnect
      console.log('Manual reconnection attempt...');
      connectToSocket();
    } else {
      // Open drawer
      setIsDrawerOpen(true);
    }
  };

  return (
    <>
      <div className="flex items-center gap-2">
        <Badge
          content={online.length}
          color={getConnectionColor()}
          isInvisible={online.length === 0}
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
            <span>Online Users ({online.length})</span>
            <Tag color={getConnectionColor()}>
              {getConnectionStatus()}
            </Tag>
          </Space>
        }
        placement="right"
        width="30%"
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
            {connectionError ? (
              <div className="flex h-full items-center justify-center text-red-500 p-4">
                <div className="text-center">
                  <Text type="danger">Connection Error: {connectionError}</Text>
                  <br />
                  <Text type="secondary" className="text-sm">
                    Click the button above to retry connection
                  </Text>
                </div>
              </div>
            ) : online.length === 0 ? (
              <div className="flex h-full items-center justify-center text-gray-500 dark:text-gray-400 p-4">
                <Text type="secondary">
                  {isConnecting ? 'Connecting...' : 'No users currently online'}
                </Text>
              </div>
            ) : (
              <List
                dataSource={online}
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
                        <p className="text-base font-medium text-foreground truncate">
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
          <div className="border-t border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-800">
            <Space direction="vertical" size="small" className="w-full">
              <Space>
                <div className={`h-2 w-2 rounded-full ${isConnected ? 'bg-green-500' :
                  isConnecting ? 'bg-yellow-500' :
                    'bg-red-500'
                  }`}></div>
                <Text type="secondary" className="text-sm">
                  Status: {getConnectionStatus()}
                </Text>
              </Space>
              {socketRef.current && (
                <div className="space-y-1">
                  <Text type="secondary" className="text-xs">
                    Socket ID: {socketRef.current.id}
                  </Text>
                  <Text type="secondary" className="text-xs">
                    Transport: {socketRef.current.io.engine.transport.name}
                  </Text>
                  {user && (
                    <Text type="secondary" className="text-xs">
                      User ID: {user._id?.toString()}
                    </Text>
                  )}
                  <Text type="secondary" className="text-xs">
                    Cached Users: {userCacheRef.current.size}
                  </Text>
                </div>
              )}
            </Space>
          </div>
        </div>
      </Drawer>
    </>
  );
} 