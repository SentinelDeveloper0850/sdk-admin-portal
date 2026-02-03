"use client";

import { useEffect, useRef, useState } from "react";

export type NotificationSeverity = "INFO" | "SUCCESS" | "WARNING" | "ERROR";

export interface Notification {
  _id: string;
  recipientUserId: string;
  type: string;
  title: string;
  message: string;
  link?: string;
  severity: NotificationSeverity;
  data?: Record<string, any>;
  readAt?: string | null;
  createdAt: string;
}

interface UseNotificationsOptions {
  unreadOnly?: boolean;
  limit?: number;
  pollIntervalMs?: number;
}

export function useNotifications(options?: UseNotificationsOptions) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  const pollInterval = options?.pollIntervalMs ?? 15_000;
  const unreadOnly = options?.unreadOnly ?? false;
  const limit = options?.limit ?? 20;

  const controllerRef = useRef<AbortController | null>(null);

  const fetchNotifications = async () => {
    try {
      setIsError(false);
      const qs = new URLSearchParams();
      if (unreadOnly) qs.set("unreadOnly", "true");
      qs.set("limit", String(limit));

      if (controllerRef.current) {
        controllerRef.current.abort();
      }
      controllerRef.current = new AbortController();

      const res = await fetch(`/api/notifications?${qs.toString()}`, {
        method: "GET",
        credentials: "include",
        signal: controllerRef.current.signal,
      });

      if (!res.ok) {
        throw new Error("Failed to fetch notifications");
      }

      const json = await res.json();
      setNotifications(json.notifications ?? []);
      setIsLoading(false);
    } catch (error: any) {
      if (error?.name === "AbortError") return;
      console.error("Error fetching notifications", error);
      setIsError(true);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setIsLoading(true);
    fetchNotifications();

    const id = setInterval(() => {
      fetchNotifications();
    }, pollInterval);

    return () => {
      clearInterval(id);
      if (controllerRef.current) {
        controllerRef.current.abort();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unreadOnly, limit, pollInterval]);

  const unreadCount = notifications.filter((n) => !n.readAt).length;

  const markAsReadLocal = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) =>
        n._id === id ? { ...n, readAt: new Date().toISOString() } : n
      )
    );
  };

  const markAllAsReadLocal = () => {
    const now = new Date().toISOString();
    setNotifications((prev) =>
      prev.map((n) => ({ ...n, readAt: n.readAt ?? now }))
    );
  };

  return {
    notifications,
    unreadCount,
    isLoading,
    isError,
    refetch: fetchNotifications,
    markAsReadLocal,
    markAllAsReadLocal,
  };
}
