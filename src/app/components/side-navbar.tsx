"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";

import { useAuth } from "@/context/auth-context";

const SideNavBar = () => {
  const pathname = usePathname();

  const menuItems: {
    id: number;
    name: string;
    url: unknown;
  }[] = [
    { id: 1, name: "Dashboard", url: "/dashboard" },
    { id: 2, name: "EFT Transactions", url: "/transactions/eft" },
    // { id: 3, name: "EFT Analysis", url: "/transactions/eft/analyze" },
    { id: 4, name: "Easypay Transactions", url: "/transactions/easypay" },
    { id: 5, name: "Policies", url: "/policies" },
    { id: 6, name: "Daily Activity", url: "/daily-activity" },
    { id: 7, name: "Users", url: "/users" },
    // { id: 8, name: "Communication", url: "/communication" },
  ];

  const { user } = useAuth();

  useEffect(() => {
    if (user && user.role == "admin")
      menuItems.push({ id: 4, name: "Users", url: "/users" });
  }, [user]);

  return (
    <section className="h-full w-full overflow-auto bg-white dark:bg-zinc-900">
      <div className="grid gap-0">
        {menuItems.map((item) => {
          const url = item.url ?? "";

          if (pathname.includes(item.url as string))
            return (
              <Link key={item.id} href={url}>
                <div className="flex cursor-pointer items-center gap-4 border-l-large border-l-primary px-4 py-3 text-primary hover:bg-[#FFC107] hover:text-[#2B3E50]">
                  <p className="text-sm font-normal uppercase tracking-wider">
                    {item.name}
                  </p>
                </div>
              </Link>
            );

          return (
            <Link key={item.id} href={url}>
              <div className="flex cursor-pointer items-center gap-4 border-l-large border-l-transparent px-4 py-3 hover:bg-[#FFC107] hover:text-[#2B3E50]">
                <p className="text-sm font-normal uppercase tracking-wider">
                  {item.name}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
      {/* <div className="absolute bottom-3 left-3 animate-bounce rounded-full bg-slate-200 p-1">
        <IconHelp className="cursor-pointer text-[#0056b3]" />
      </div> */}
    </section>
  );
};

export default SideNavBar;
