/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import type { IUser } from "@/app/models/hr/user.schema";
import axios from "axios";
import { usePathname, useRouter } from "next/navigation";
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

export type SessionMode = "ONSITE" | "REMOTE";

export interface ISession {
  userId: string;
  createdAt: string; // ISO
  expiresAt: string; // ISO
  mode: SessionMode;
  branch?: string;
  region?: string;
  branchName?: string;
  regionName?: string;
}

interface AuthContextType {
  user: IUser | null;
  setUser: React.Dispatch<React.SetStateAction<IUser | null>>;
  session: ISession | null;
  setSession: React.Dispatch<React.SetStateAction<ISession | null>>;
  startSession: (input: Omit<ISession, "createdAt" | "expiresAt">) => void;
  clearSession: () => void;
  userId?: string;
  loading: boolean;
  isAdmin: boolean;
  isManagement: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

const SESSION_STORAGE_KEY = "sdk_session";
const SESSION_TTL_MS = 1000 * 60 * 60 * 12; // 12 hours

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<IUser | null>(null);
  const [session, setSession] = useState<ISession | null>(null);
  const [loading, setLoading] = useState(true);

  const router = useRouter();
  const pathname = usePathname();

  const isAuthRoute = useMemo(() => pathname.startsWith("/auth"), [pathname]);
  const isSessionRoute = useMemo(() => pathname.startsWith("/session"), [pathname]);

  const buildSession = (input: Omit<ISession, "createdAt" | "expiresAt">): ISession => {
    const now = new Date();
    const expires = new Date(now.getTime() + SESSION_TTL_MS);

    return {
      ...input,
      createdAt: now.toISOString(),
      expiresAt: expires.toISOString(),
    };
  };

  const isExpired = (s: ISession) => new Date(s.expiresAt).getTime() <= Date.now();

  const clearSession = () => {
    router.push("/session");
    setSession(null);
    if (typeof window !== "undefined") localStorage.removeItem(SESSION_STORAGE_KEY);
  };

  const hydrateSessionForUser = (u: IUser | null) => {
    if (typeof window === "undefined") return;

    if (!u?._id) {
      clearSession();
      return;
    }

    const raw = localStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) {
      setSession(null);
      return;
    }

    try {
      const s = JSON.parse(raw) as ISession;

      // must belong to this user
      if (String(s.userId) !== String(u._id)) {
        localStorage.removeItem(SESSION_STORAGE_KEY);
        setSession(null);
        return;
      }

      // expiry check
      if (isExpired(s)) {
        localStorage.removeItem(SESSION_STORAGE_KEY);
        setSession(null);
        return;
      }

      setSession(s);
    } catch {
      localStorage.removeItem(SESSION_STORAGE_KEY);
      setSession(null);
    }
  };

  const fetchUser = async () => {
    try {
      const userRes = await axios.get("/api/auth/user");
      const u = userRes.data.user ?? null;
      setUser(u);
      hydrateSessionForUser(u);
    } catch (error: any) {
      console.error("Error fetching user:", error);
      if (error.response?.status === 401) {
        setUser(null);
        clearSession();
        router.push("/auth/signin");
      }
    } finally {
      setLoading(false);
    }
  };

  // Initial bootstrap
  useEffect(() => {
    if (loading) fetchUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist session automatically
  useEffect(() => {
    if (typeof window === "undefined") return;

    if (!session) {
      localStorage.removeItem(SESSION_STORAGE_KEY);
      return;
    }

    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
  }, [session]);

  // Auto-expire
  useEffect(() => {
    if (!session) return;

    const timer = setInterval(() => {
      if (isExpired(session)) {
        clearSession();
      }
    }, 30_000);

    return () => clearInterval(timer);
  }, [session]);

  const startSession = (input: Omit<ISession, "createdAt" | "expiresAt">) => {
    setSession(buildSession(input));
  };

  // Enforce: logged-in user must have a session (except auth/session pages)
  useEffect(() => {
    if (loading) return;
    if (!user) return;

    if (isAuthRoute || isSessionRoute) return;

    if (!session) router.push("/session");
  }, [user, session, loading, isAuthRoute, isSessionRoute, router]);

  const userRoles = user?.roles ?? [];
  const roles = [user?.role!, ...userRoles];

  const isAdmin = user?.role === "admin";
  const isManagement = roles.includes("admin") || roles.includes("manager");

  if (loading) return <div>Loading...</div>;

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        session,
        setSession,
        startSession,
        clearSession,
        userId: user?._id?.toString(),
        loading,
        isAdmin,
        isManagement
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};
