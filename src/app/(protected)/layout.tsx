"use client";

import React from "react";

import { withAuth } from "@/utils/utils/with-auth";
import { Analytics } from "@vercel/analytics/next";

import AppBarOnline from "../components/app-bar-online";
import SideNavBar from "../components/side-navbar";

const ProtectedLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="flex h-screen w-full flex-col">
      <AppBarOnline />
      <div className="flex flex-1 overflow-hidden">
        <aside className="sticky top-0 h-screen shrink-0 transition-all duration-200 hidden md:block">
          <SideNavBar />
        </aside>
        <main className="flex-1 overflow-y-auto bg-zinc-100 p-4 dark:bg-zinc-800">
          {children}
        </main>
      </div>
      <Analytics />
    </div>
  );
};

export default withAuth(ProtectedLayout);
