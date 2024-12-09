import React from "react";

import OnlineAppNavbar from "../components/app-bar";
import SideNavBar from "../components/side-navbar";

const ProtectedLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="h-full w-full">
      <OnlineAppNavbar />
      <div className="flex h-full w-full">
        <SideNavBar />
        <section className="w-full">
          <div className="h-full bg-zinc-100 p-4 dark:bg-zinc-800">
            {children}
          </div>
        </section>
      </div>
    </div>
  );
};

export default ProtectedLayout;