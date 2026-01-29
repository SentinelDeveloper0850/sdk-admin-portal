/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useRouter } from "next/navigation";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

import { Button, Modal, Typography } from "antd";
import axios from "axios";

import type { IUser } from "@/app/models/hr/user.schema";

/* eslint-disable @typescript-eslint/no-explicit-any */

// Define the shape of the context
interface AuthContextType {
  user: IUser | null;
  setUser: React.Dispatch<React.SetStateAction<IUser | null>>;
  userId?: string;
  loading: boolean;
  isAdmin: boolean;
  sessionExpiresAt: number | null;
  setSessionExpiresAt: React.Dispatch<React.SetStateAction<number | null>>;
  logout: () => Promise<void>;
}

// Create the AuthContext
const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<IUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessionExpiresAt, setSessionExpiresAt] = useState<number | null>(null);
  const [showSessionWarning, setShowSessionWarning] = useState(false);
  const [sessionRemainingSeconds, setSessionRemainingSeconds] = useState(0);
  const [isRefreshingSession, setIsRefreshingSession] = useState(false);

  const router = useRouter();

  const handleLogout = useCallback(async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (error) {
      console.error("Logout request failed:", error);
    }
    setUser(null);
    setSessionExpiresAt(null);
    setShowSessionWarning(false);
    setLoading(false);
    router.push("/auth/signin");
  }, [router]);

  const fetchUserDetails = useCallback(async () => {
    try {
      const response = await axios.get("/api/auth/user");
      setUser(response.data.user);
      const expiresAt =
        typeof response.data.session?.expiresAt === "number"
          ? response.data.session.expiresAt
          : null;
      setSessionExpiresAt(expiresAt);
    } catch (error: any) {
      console.error("Error fetching user details:", error);
      if (error.response?.status === 401) {
        await handleLogout();
        return;
      }
    } finally {
      setLoading(false);
    }
  }, [handleLogout]);

  const refreshSession = useCallback(async () => {
    setIsRefreshingSession(true);
    try {
      const response = await fetch("/api/auth/refresh", { method: "POST" });
      if (!response.ok) {
        throw new Error("Session refresh failed");
      }
      const data = await response.json();
      const expiresAt =
        typeof data.session?.expiresAt === "number"
          ? data.session.expiresAt
          : null;
      setSessionExpiresAt(expiresAt);
      setShowSessionWarning(false);
    } catch (error) {
      console.error("Failed to refresh session:", error);
      await handleLogout();
    } finally {
      setIsRefreshingSession(false);
    }
  }, [handleLogout]);

  useEffect(() => {
    if (!user && loading) {
      fetchUserDetails();
    }
  }, [fetchUserDetails, loading, user]);

  useEffect(() => {
    if (!user || !sessionExpiresAt) {
      return;
    }

    const warningThresholdMs = 5 * 60 * 1000;
    const now = Date.now();
    const warningDelay = sessionExpiresAt - warningThresholdMs - now;
    const expiryDelay = sessionExpiresAt - now;

    let warningTimeout: ReturnType<typeof setTimeout> | undefined;
    let expiryTimeout: ReturnType<typeof setTimeout> | undefined;

    if (warningDelay <= 0) {
      setShowSessionWarning(true);
    } else {
      warningTimeout = setTimeout(() => {
        setShowSessionWarning(true);
      }, warningDelay);
    }

    if (expiryDelay <= 0) {
      handleLogout();
    } else {
      expiryTimeout = setTimeout(() => {
        handleLogout();
      }, expiryDelay);
    }

    return () => {
      if (warningTimeout) {
        clearTimeout(warningTimeout);
      }
      if (expiryTimeout) {
        clearTimeout(expiryTimeout);
      }
    };
  }, [handleLogout, sessionExpiresAt, user]);

  useEffect(() => {
    if (!showSessionWarning || !sessionExpiresAt) {
      return;
    }

    const updateRemainingTime = () => {
      const remainingSeconds = Math.max(
        0,
        Math.floor((sessionExpiresAt - Date.now()) / 1000)
      );
      setSessionRemainingSeconds(remainingSeconds);
    };

    updateRemainingTime();
    const intervalId = setInterval(updateRemainingTime, 1000);

    return () => clearInterval(intervalId);
  }, [sessionExpiresAt, showSessionWarning]);

  const isAdmin = user?.role === "admin";
  const shouldShowSessionWarning = Boolean(
    user && sessionExpiresAt && showSessionWarning
  );
  const formattedRemainingTime = (() => {
    const minutes = Math.floor(sessionRemainingSeconds / 60);
    const seconds = sessionRemainingSeconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`;
  })();

  // Show loading spinner until user details are fetched
  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        setUser,
        userId: user?._id?.toString(),
        isAdmin,
        sessionExpiresAt,
        setSessionExpiresAt,
        logout: handleLogout,
      }}
    >
      {children}
      <Modal
        title="Session expiring soon"
        open={shouldShowSessionWarning}
        closable={false}
        maskClosable={false}
        footer={[
          <Button key="logout" danger onClick={handleLogout}>
            Logout
          </Button>,
          <Button
            key="refresh"
            type="primary"
            loading={isRefreshingSession}
            onClick={refreshSession}
          >
            Refresh Session
          </Button>,
        ]}
      >
        <Typography.Paragraph>
          Your session is about to expire. Refresh to stay signed in or logout
          now.
        </Typography.Paragraph>
        <Typography.Text type="secondary">
          Time remaining: {formattedRemainingTime}
        </Typography.Text>
      </Modal>
    </AuthContext.Provider>
  );
};

// Custom hook to access the AuthContext
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
