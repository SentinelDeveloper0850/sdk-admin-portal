import React from "react";

import AppBarOnline from "../components/app-bar-online";
import SideNavBar from "../components/side-navbar";

const ProtectedLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="flex h-screen w-full flex-col">
      <AppBarOnline />
      <div className="flex flex-1 overflow-hidden">
        <aside className="sticky top-0 h-screen w-64 shrink-0">
          <SideNavBar />
        </aside>
        <main className="flex-1 overflow-y-auto bg-zinc-100 p-4 dark:bg-zinc-800">
          {children}
        </main>
      </div>
    </div>
  );
};

export default ProtectedLayout;
