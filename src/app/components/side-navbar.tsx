"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { Tooltip } from "antd";
import {
  Banknote,
  ChevronLeft,
  ChevronRight,
  FileText,
  LayoutDashboard,
  ListOrdered,
  Shield,
  Users,
} from "lucide-react";
import { HiOutlineDocumentCurrencyDollar } from "react-icons/hi2";

import { useAuth } from "@/context/auth-context";

const SideNavBar = () => {
  const pathname = usePathname();
  const { user } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  const menuItems = [
    {
      id: 1,
      name: "Dashboard",
      icon: <LayoutDashboard size={18} />,
      url: "/dashboard",
    },
    {
      id: 2,
      name: "EFT Transactions",
      icon: <Banknote size={18} />,
      url: "/transactions/eft",
    },
    {
      id: 3,
      name: "Easypay Transactions",
      icon: <Banknote size={18} />,
      url: "/transactions/easypay",
    },
    { id: 4, name: "Policies", icon: <FileText size={18} />, url: "/policies" },
    {
      id: 5,
      name: "Prepaid Societies",
      icon: <Users size={18} />,
      url: "/prepaid-societies",
    },
    {
      id: 6,
      name: "Daily Activity",
      icon: <ListOrdered size={18} />,
      url: "/daily-activity",
    },
    {
      id: 7,
      name: "Claims",
      icon: <HiOutlineDocumentCurrencyDollar size={18} />,
      url: "/claims",
    },
    // {
    //   id: 7,
    //   name: "Shifts",
    //   icon: <Calendar size={18} />,
    //   url: "/shifts",
    // },
    { id: 8, name: "Users", icon: <Shield size={18} />, url: "/users" },
  ];

  return (
    <section
      className={`h-full ${collapsed ? "w-16" : "w-64"} overflow-hidden bg-white transition-all duration-200 dark:bg-zinc-900`}
    >
      <div
        className={`flex ${collapsed ? "justify-center" : "justify-end"} p-2`}
      >
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="text-zinc-500 hover:text-black dark:hover:text-white"
        >
          {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </button>
      </div>
      <div className="grid gap-0">
        {menuItems.map((item) => {
          const isActive = pathname.includes(item.url);
          const baseClass =
            "flex cursor-pointer items-center gap-3 px-4 py-3 hover:bg-[#FFC107] hover:text-[#2B3E50]";
          const borderClass = isActive
            ? "border-l-4 border-l-primary text-primary"
            : "border-l-4 border-l-transparent";

          const content = (
            <div className={`${baseClass} ${borderClass}`}>
              {item.icon}
              {!collapsed && (
                <p className="text-sm font-normal uppercase tracking-wider">
                  {item.name}
                </p>
              )}
            </div>
          );

          return (
            <Link key={item.id} href={item.url}>
              {collapsed ? (
                <Tooltip title={item.name} placement="right">
                  {content}
                </Tooltip>
              ) : (
                content
              )}
            </Link>
          );
        })}
      </div>
    </section>
  );
};

export default SideNavBar;
