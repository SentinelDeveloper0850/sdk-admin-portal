/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import type { IUser } from "@/app/models/auth/user.schema";
import axios from "axios";
import { usePathname, useRouter } from "next/navigation";
import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import sweetAlert from "sweetalert";

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
  startSession: (input: Omit<ISession, "createdAt" | "expiresAt">) => Promise<void>;
  clearSession: () => void;
  refreshSession: () => Promise<void>;
  userId?: string;
  loading: boolean;
  isAdmin: boolean;
  isManagement: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

const SESSION_TTL_MS = 1000 * 60 * 60 * 12; // 12 hours (fallback only)

type SessionContextResponse = {
  success: boolean;
  hasSession?: boolean;
  hasContext?: boolean;
  mode?: SessionMode;
  regionId?: string | null;
  branchId?: string | null;
  regionName?: string | null;
  branchName?: string | null;
  expiresAt?: string | Date | null;
  code?: string;
  message?: string;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<IUser | null>(null);
  const [session, setSession] = useState<ISession | null>(null);
  const [loading, setLoading] = useState(true);

  const [sessionHydrating, setSessionHydrating] = useState(true);

  const router = useRouter();
  const pathname = usePathname();

  const isAuthRoute = useMemo(() => pathname.startsWith("/auth"), [pathname]);
  const isSessionRoute = useMemo(() => pathname.startsWith("/session"), [pathname]);

  const settingContextRef = useRef(false);

  const alertLockRef = useRef(false);
  const lastAlertRef = useRef<{ code?: string; at: number }>({ code: undefined, at: 0 });

  const shouldShowAlert = (code?: string) => {
    // already showing one
    if (alertLockRef.current) return false;

    // prevent repeated same-code alerts within a cooldown window
    const COOLDOWN_MS = 10_000;
    const now = Date.now();

    if (lastAlertRef.current.code === code && now - lastAlertRef.current.at < COOLDOWN_MS) {
      return false;
    }

    lastAlertRef.current = { code, at: now };
    return true;
  };

  const buildSession = (
    input: Omit<ISession, "createdAt" | "expiresAt">,
    expiresAtFromServer?: string | Date | null
  ): ISession => {
    const now = new Date();

    const expires =
      expiresAtFromServer != null
        ? new Date(expiresAtFromServer)
        : new Date(now.getTime() + SESSION_TTL_MS);

    return {
      ...input,
      createdAt: now.toISOString(),
      expiresAt: expires.toISOString(),
    };
  };

  const clearSession = () => {
    setSession(null);
    // Keep them logged in, just force context selection
    router.push("/session");
  };

  const hydrateFromDbContext = async (u: IUser) => {
    const ctxRes = await axios.get<SessionContextResponse>("/api/session/context");
    const ctx = ctxRes.data;
    console.log("🚀 ~ hydrateFromDbContext ~ ctx:", ctx)

    if (!ctx?.success) {
      setSession(null);
      return;
    }

    // Auth is valid, but no DB session record (or it's expired/revoked)
    if (!ctx.hasSession) {
      setSession(null);
      return;
    }

    // DB session exists, but no working context set yet
    if (!ctx.hasContext) {
      setSession(null);
      if (!isSessionRoute) router.push("/session");
      return;
    }

    // Build local snapshot from DB
    setSession(
      buildSession(
        {
          userId: String(u._id),
          mode: (ctx.mode ?? "ONSITE") as SessionMode,
          region: ctx.regionId ?? undefined,
          branch: ctx.branchId ?? undefined,
          regionName: ctx.regionName ?? undefined,
          branchName: ctx.branchName ?? undefined,
        },
        ctx.expiresAt ?? null
      )
    );
  };

  const safeAlert = async (opts: any, code?: string) => {
    if (!shouldShowAlert(code)) return;

    try {
      alertLockRef.current = true;
      await sweetAlert(opts);
    } finally {
      alertLockRef.current = false;
    }
  };

  const handleLifecycle = async (code?: string) => {
    // Avoid popping alerts on the page you're about to redirect to
    const onSignin = pathname.startsWith("/auth/signin");
    const onSession = pathname.startsWith("/session");

    switch (code) {
      case "AUTH_EXPIRED":
        if (!onSignin) {
          await safeAlert(
            {
              title: "Session expired",
              text: "Your login session has expired. Please sign in again to continue.",
              icon: "warning",
            },
            code
          );
        }
        router.push("/auth/signin");
        return;

      case "AUTH_INVALID":
        if (!onSignin) {
          await safeAlert(
            {
              title: "Authentication error",
              text: "Your session is no longer valid. Please sign in again.",
              icon: "warning",
            },
            code
          );
        }
        router.push("/auth/signin");
        return;

      case "USER_NOT_FOUND":
        if (!onSignin) {
          await safeAlert(
            {
              title: "Account unavailable",
              text: "Your account could not be found. Please contact your administrator.",
              icon: "error",
            },
            code
          );
        }
        router.push("/auth/signin");
        return;

      case "SESSION_CONTEXT_REQUIRED":
      case "SESSION_CONTEXT_EXPIRED":
        if (!onSession) {
          await safeAlert(
            {
              title: "Select working location",
              text: "Please confirm where you're working from today to continue.",
              icon: "info",
            },
            code
          );
        }
        router.push("/session");
        return;

      default:
        router.push("/auth/signin");
        return;
    }
  };

  const fetchUser = async () => {
    try {
      setSessionHydrating(true);

      const userRes = await axios.get("/api/auth/user");
      const u = userRes.data.user ?? null;

      if (!u?._id) {
        setUser(null);
        setSession(null);
        router.push("/auth/signin");
        return;
      }

      setUser(u);

      // DB-backed working session context
      await hydrateFromDbContext(u);
    } catch (error: any) {
      if (error.response?.status === 401) {
        const code = error.response?.data?.code;

        await handleLifecycle(code);

        setUser(null);
        setSession(null);
        router.push("/auth/signin");
        return;
      }

      console.error("Error fetching user/session:", error);
      setUser(null);
      setSession(null);
      router.push("/auth/signin");
    } finally {
      setSessionHydrating(false);
      setLoading(false);
    }
  };

  const refreshSession = async () => {
    if (!user?._id) return;
    await hydrateFromDbContext(user);
  };

  // Initial bootstrap
  useEffect(() => {
    if (loading) fetchUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startSession = async (input: Omit<ISession, "createdAt" | "expiresAt">) => {
    settingContextRef.current = true;
    try {
      await axios.post("/api/session/context", {
        mode: input.mode,
        regionId: input.mode === "ONSITE" ? input.region : null,
        branchId: input.mode === "ONSITE" ? input.branch : null,
      });

      // ✅ Immediately set local session so guard doesn't bounce you back
      setSession(
        buildSession(
          {
            userId: input.userId,
            mode: input.mode,
            region: input.region,
            branch: input.branch,
            regionName: input.regionName,
            branchName: input.branchName,
          },
          null
        )
      );

      // ✅ Then refresh from DB to sync expiresAt + names (optional but nice)
      await refreshSession();
    } finally {
      settingContextRef.current = false;
    }
  };


  // Enforce: logged-in user must have a working context (except auth/session pages)
  useEffect(() => {
    if (loading || sessionHydrating) return;
    if (settingContextRef.current) return; // ✅ don't fight the session page
    if (!user) return;

    if (isAuthRoute || isSessionRoute) return;

    if (!session) router.push("/session");
  }, [user, session, loading, sessionHydrating, isAuthRoute, isSessionRoute, router]);

  const userRoles = user?.roles ?? [];
  const roles = [user?.role!, ...userRoles].filter(Boolean);

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
        refreshSession,
        userId: user?._id?.toString(),
        loading,
        isAdmin,
        isManagement,
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
