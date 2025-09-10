# Presence Feature

This feature displays real-time online users in the admin portal using Socket.IO with Ant Design components and JWT authentication.

## Overview

The presence feature shows who is currently online in the admin portal. It displays:

- A badge with the count of online users
- Connection status (online/offline)
- An Ant Design drawer with detailed user information including avatars, names, and email addresses

## Components

### Presence Component (`src/components/presence.tsx`)

The main presence component that:

- Connects to Socket.IO server with JWT authentication
- Displays online user count with a badge
- Shows connection status (online/offline)
- Opens an Ant Design drawer with user list when clicked
- Displays users with avatars, names, email addresses, and roles

### Integration

The presence component is integrated into the app bar (`src/app/components/app-bar-online.tsx`) and appears in the top navigation.

## Configuration

### Environment Variables

Add the following to your `.env.local` file:

```env
NEXT_PUBLIC_SOCKET_URL=http://localhost:3000
```

### Socket.IO Server

The socket server requires JWT authentication and provides the following API:

#### Authentication

- **POST /auth/login** - Login and get JWT token for WebSocket authentication

#### WebSocket Connection

Connect to the WebSocket server with JWT token:

```javascript
import { io } from "socket.io-client";

const socket = io("http://localhost:3000", {
  auth: {
    token: "your-jwt-token-here",
  },
});
```

#### Received Events

- **onlineUsers** - Emitted when users connect/disconnect or when requested

#### Emitted Events

- **getOnlineUsers** - Request current online users list

### User Data Structure

The socket server emits user objects with this structure:

```typescript
interface OnlineUser {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  role?: string;
  roles?: string[];
}
```

## Features

- **JWT Authentication**: Secure WebSocket connections using JWT tokens
- **Real-time Updates**: Automatically updates when users connect/disconnect
- **Connection Status**: Shows if the client is connected to the socket server
- **Ant Design Drawer**: Uses Ant Design's Drawer component (30% width)
- **User Avatars**: Displays user profile pictures or initials
- **User Information**: Shows name, email, and role for each online user
- **Responsive Design**: Works on desktop and mobile devices
- **Dark Mode Support**: Adapts to the current theme

## Usage

1. Click on the presence chip in the app bar to open the user list
2. The badge shows the current number of online users
3. Green indicator shows connection is active, red shows disconnected
4. Users are displayed with avatars, names, email addresses, and roles
5. Close the drawer by clicking the X button or clicking outside

## Authentication Flow

1. User logs in through the regular authentication system
2. JWT token is stored in cookies as `auth-token`
3. Presence component retrieves the token from cookies
4. Socket connection is established with JWT authentication
5. Server validates the token and associates the socket with the user
6. Online users list is updated in real-time

## Dependencies

- `socket.io-client`: For real-time communication
- `@nextui-org/react`: For UI components (Badge, Chip)
- `antd`: For Drawer, Avatar, List, Typography, Space, Tag components
- `lucide-react`: For icons (Users)
