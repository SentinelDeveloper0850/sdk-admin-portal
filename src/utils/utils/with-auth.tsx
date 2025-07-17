"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { Spin } from "antd";

import { useAuth } from "@/context/auth-context";

export function withAuth<P extends object>(
  Component: React.ComponentType<P>
): React.FC<P> {
  const AuthGuard: React.FC<P> = (props: P) => {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
      if (!loading && !user) {
        router.replace("/login");
      }
    }, [user, loading, router]);

    if (loading || !user) {
      return (
        <div className="flex h-screen w-full items-center justify-center">
          <Spin size="large" />
        </div>
      );
    }

    return <Component {...props} />;
  };

  return AuthGuard;
}
