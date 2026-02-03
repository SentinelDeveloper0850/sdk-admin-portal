"use client";

import { usePathname } from "next/navigation";
import React, { useMemo } from "react";

import { Analytics } from "@vercel/analytics/next";

import { withAuth } from "@/utils/utils/with-auth";

import AppBarOnline from "../components/app-bar-online";
import SideNavBar from "../components/side-navbar";

const pagesWithContextMenu = ["/calendar"];

const ProtectedLayout = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();

  const hasContextMenu = useMemo(() => {
    if (pagesWithContextMenu.includes(pathname)) {
      return true;
    }
    return false;
  }, [pathname]);

  return (
    <div className="flex h-screen w-full flex-col">
      <AppBarOnline />
      <div className="flex flex-1 overflow-hidden">
        <aside className="sticky top-0 hidden h-screen shrink-0 pb-10 transition-all duration-200 md:block">
          <SideNavBar />
        </aside>
        <main
          className={`flex-1 overflow-y-auto bg-zinc-100 p-4 dark:bg-zinc-800 ${hasContextMenu ? "pr-0 pt-0" : "pr-4 pt-4"}`}
        >
          {children}
        </main>
      </div>
      <Analytics />
    </div>
  );
};

export default withAuth(ProtectedLayout);
