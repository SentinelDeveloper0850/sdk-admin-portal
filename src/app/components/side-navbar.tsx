"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { Tooltip } from "antd";
import {
  Banknote,
  BarChart3,
  Calendar,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  FileText,
  LayoutDashboard,
  ListOrdered,
  Settings,
  Shield,
  Users,
} from "lucide-react";
import { HiOutlineDocumentCurrencyDollar } from "react-icons/hi2";

import { ERoles } from "../../../types/roles.enum";
import { useRole } from "../hooks/use-role";
import { IconPigMoney } from "@tabler/icons-react";

const SideNavBar = () => {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [openMenus, setOpenMenus] = useState<number[]>([]); // track open submenu items

  const menuItems = [
    {
      id: 0,
      name: "Dashboard",
      icon: <LayoutDashboard size={18} />,
      url: "/dashboard",
    },
    {
      id: 1,
      name: "Calendar",
      icon: <Calendar size={18} />,
      url: "/calendar",
    },
    {
      id: 2,
      name: "EFT Transactions",
      icon: <Banknote size={18} />,
      url: "/transactions/eft",
      group: "Finance",
      children: [
        {
          id: "view-eft-transactions",
          name: "View",
          icon: <Banknote size={18} />,
          url: "/transactions/eft",
        },
        {
          id: "import-eft-transactions-via-transaction-history",
          name: "Importer",
          icon: <Banknote size={18} />,
          url: "/transactions/eft-importer",
          allowedRoles: [ERoles.Admin],
        },
        {
          id: "eft-allocation-requests",
          name: "Allocation Requests",
          icon: <Banknote size={18} />,
          url: "/transactions/eft/allocation-requests",
          allowedRoles: [ERoles.EFTReviewer, ERoles.EFTAllocator],
        },
      ],
    },
    {
      id: 3,
      name: "Easypay Transactions",
      icon: <Banknote size={18} />,
      url: "/transactions/easypay",
      group: "Finance",
      children: [
        {
          id: "view-easypay-transactions",
          name: "View",
          icon: <Banknote size={18} />,
          url: "/transactions/easypay",
        },
        {
          id: "easypay-allocation-requests",
          name: "Allocation Requests",
          icon: <Banknote size={18} />,
          url: "/transactions/easypay/allocation-requests",
          allowedRoles: [ERoles.EasypayReviewer, ERoles.EasypayAllocator],
        },
      ],
    },
    {
      id: 4,
      name: "Policies",
      icon: <FileText size={18} />,
      url: "/policies",
      group: "Scheme",
      children: [
        {
          id: "view-policies",
          name: "View Policies",
          icon: <Banknote size={18} />,
          url: "/policies/view",
          allowedRoles: [ERoles.Admin, ERoles.SchemeConsultant],
        },
        {
          id: "policy-reconciliation",
          name: "Reconciliation",
          icon: <FileText size={18} />,
          url: "/policies/recon",
          allowedRoles: [ERoles.Admin],
        },
        {
          id: "signup-requests",
          name: "Signup Requests",
          icon: <Banknote size={18} />,
          url: "/policies/signup-requests",
          allowedRoles: [ERoles.Admin, ERoles.SchemeConsultantOnline],
        },
        {
          id: "cancellation-requests",
          name: "Cancellation Requests",
          icon: <FileText size={18} />,
          url: "/policies/cancellation-requests",
          allowedRoles: [ERoles.Admin],
        },
      ],
    },
    {
      id: 5,
      name: "Societies",
      icon: <Users size={18} />,
      url: "/societies",
      group: "Scheme",
      allowedRoles: [ERoles.Admin, ERoles.SocietyConsultant],
      children: [
        {
          id: "prepaid-societies",
          name: "Prepaid",
          icon: <Users size={18} />,
          url: "/societies/prepaid",
          allowedRoles: [ERoles.Admin, ERoles.SocietyConsultant],
        },
        {
          id: "scheme-societies",
          name: "Scheme",
          icon: <Users size={18} />,
          url: "/societies/scheme",
          allowedRoles: [ERoles.Admin, ERoles.SchemeConsultant],
        },
      ],
    },
    {
      id: 6,
      name: "Reports",
      icon: <BarChart3 size={18} />,
      url: "/reports",
      allowedRoles: [ERoles.Admin],
      group: "Management",
      children: [
        {
          id: "report-policies",
          name: "Policies Report",
          icon: <Banknote size={18} />,
          url: "/reports/policies",
          allowedRoles: [ERoles.Admin],
        },
      ],
    },
    {
      id: 7,
      name: "Daily Activity",
      icon: <ListOrdered size={18} />,
      url: "/daily-activity",
      allowedRoles: [ERoles.Admin, ERoles.SchemeConsultant],
      group: "Risk",
    },
    {
      id: 8,
      name: "Cash-Up",
      icon: <IconPigMoney size={18} />,
      url: "/cash-up",
      allowedRoles: [ERoles.Admin, ERoles.SchemeConsultant],
      group: "Risk",
      children: [
        {
          id: "cash-up-dashboard",
          name: "Dashboard",
          icon: <LayoutDashboard size={18} />,
          url: "/cash-up/dashboard",
          allowedRoles: [ERoles.Admin, ERoles.SchemeConsultant],
        },
        {
          id: "cash-up-review",
          name: "Review",
          icon: <FileText size={18} />,
          url: "/cash-up/review",
          allowedRoles: [ERoles.Admin],
        },
      ],
    },
    {
      id: 9,
      name: "Claims",
      icon: <HiOutlineDocumentCurrencyDollar size={18} />,
      url: "/claims",
      allowedRoles: [ERoles.Admin, ERoles.ClaimsOfficer],
      group: "Risk",
    },
    {
      id: 10,
      name: "Users",
      icon: <Shield size={18} />,
      url: "/users",
      allowedRoles: [ERoles.Admin, ERoles.HRManager],
      group: "Management",
    },
    {
      id: 12,
      name: "Configurations",
      icon: <Settings size={18} />,
      url: "/configurations",
      allowedRoles: [ERoles.Admin],
      group: "Management",
      children: [
        {
          id: "staff-members",
          name: "Staff Members",
          url: "/configurations/staff-members",
          allowedRoles: [ERoles.Admin, ERoles.HRManager],
          icon: undefined,
        },
        {
          id: "system-config",
          name: "System",
          url: "/configurations/system",
          allowedRoles: [ERoles.Admin],
          icon: undefined,
        },
        {
          id: "scheme-config",
          name: "Scheme",
          url: "/configurations/scheme",
          allowedRoles: [ERoles.Admin],
          icon: undefined,
        },
        {
          id: "branches-config",
          name: "Branches",
          url: "/configurations/branches",
          allowedRoles: [ERoles.Admin],
          icon: undefined,
        },
        {
          id: "daily-activity-reminders-config",
          name: "Daily Activity Reminders",
          url: "/configurations/daily-activity-reminders",
          allowedRoles: [ERoles.Admin],
          icon: undefined,
        },
      ],
    },
  ];

  const toggleSubmenu = (id: number) => {
    setOpenMenus((prev) =>
      prev.includes(id) ? prev.filter((mid) => mid !== id) : [...prev, id]
    );
  };

  const { hasRole } = useRole();

  const filteredMenuItems = menuItems
    .map((item) => {
      // Filter children if any
      const children = item.children?.filter(
        (child) => !child.allowedRoles || hasRole(child.allowedRoles)
      );

      return {
        ...item,
        children,
      };
    })
    .filter(
      (item) =>
        (!item.allowedRoles || hasRole(item.allowedRoles)) &&
        (item.children === undefined || item.children.length > 0)
    );

  return (
    <section
      className={`h-full ${collapsed ? "w-16" : "w-64"} overflow-hidden overflow-y-scroll bg-white transition-all duration-200 dark:bg-zinc-900`}
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
        {filteredMenuItems.map((item) => {
          const isActive = pathname.startsWith(item.url || "");
          const baseClass =
            "flex cursor-pointer items-center gap-3 px-4 py-3 hover:bg-[#FFC107] hover:text-[#2B3E50]";
          const borderClass = isActive
            ? "border-l-4 border-l-primary text-primary"
            : "border-l-4 border-l-transparent";

          if (item.children && item.children.length > 0) {
            const isOpen = openMenus.includes(item.id);

            return (
              <div key={item.id}>
                <div
                  className={`${baseClass} ${borderClass}`}
                  onClick={() => toggleSubmenu(item.id)}
                >
                  {item.icon}
                  {!collapsed && (
                    <p className="text-xs font-normal uppercase tracking-wider">
                      {item.name}
                    </p>
                  )}
                </div>

                {isOpen &&
                  !collapsed &&
                  item.children.map((child) => {
                    const childActive = pathname.startsWith(child.url || "");
                    return (
                      <Link key={child.id} href={child.url!}>
                        <div
                          className={`ml-6 flex items-center gap-2 px-4 py-2 text-sm hover:bg-[#ffe082] ${childActive
                            ? "font-semibold text-primary"
                            : "text-gray-600"
                            }`}
                        >
                          {child.icon ?? <></>}
                          <span>{child.name}</span>
                        </div>
                      </Link>
                    );
                  })}
              </div>
            );
          }

          const content = (
            <div className={`${baseClass} ${borderClass}`}>
              {item.icon}
              {!collapsed && (
                <p className="text-xs font-normal uppercase tracking-wider">
                  {item.name}
                </p>
              )}
            </div>
          );

          return item.url ? (
            <Link key={item.id} href={item.url}>
              {collapsed ? (
                <Tooltip title={item.name} placement="right">
                  {content}
                </Tooltip>
              ) : (
                content
              )}
            </Link>
          ) : (
            <div key={item.id}>{content}</div>
          );
        })}
      </div>
    </section>
  );
};

export default SideNavBar;
