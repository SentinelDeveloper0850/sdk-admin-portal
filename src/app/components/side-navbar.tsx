"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { IconCoffin, IconPigMoney, IconSteeringWheel, IconUserShield } from "@tabler/icons-react";
import { Tooltip } from "antd";
import {
  Banknote,
  BarChart3,
  Briefcase,
  Calendar,
  ChevronDown,
  ChevronsLeft,
  ChevronsRight,
  ClipboardList,
  FilePen,
  FileText,
  LayoutDashboard,
  ListOrdered,
  Server,
  Settings,
  Shield,
  Users,
} from "lucide-react";
import {
  HiBuildingOffice,
  HiClock,
  HiMapPin,
  HiOutlineDocumentCurrencyDollar,
  HiUserGroup
} from "react-icons/hi2";

import { ERoles } from "../../types/roles.enum";
import { useRole } from "../hooks/use-role";

const SideNavBar = () => {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(true);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null); // track open submenu

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
      name: "Tasks",
      icon: <ClipboardList size={18} />,
      url: "/tasks",
      // No allowedRoles => visible to all logged in users
    },
    // {
    //   id: 9,
    //   name: "Communication",
    //   icon: <FileText size={18} />,
    //   url: "/communication",
    //   group: "Communication",
    //   children: [
    //     {
    //       id: "news",
    //       name: "News & Announcements",
    //       icon: <FileText size={18} />,
    //       url: "/news",
    //     },
    //     {
    //       id: "knowledge-hub",
    //       name: "Knowledge Hub",
    //       icon: <FileText size={18} />,
    //       url: "/knowledge-hub",
    //     },
    //   ],
    // },
    {
      id: 3,
      name: "Operations",
      icon: <Briefcase size={18} />,
      url: "/operations",
      group: "Operations",
      children: [
        {
          id: "funerals",
          name: "Funerals",
          icon: <IconCoffin size={18} />,
          url: "/funerals",
        },
        {
          id: "claims",
          name: "Claims",
          icon: <HiOutlineDocumentCurrencyDollar size={18} />,
          url: "/claims",
          allowedRoles: [ERoles.Admin, ERoles.ClaimsOfficer],
          group: "Risk",
        },
      ],
    },
    {
      id: 4,
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
      id: 5,
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
      id: 6,
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
      id: 7,
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
      id: 8,
      name: "Reporting",
      icon: <BarChart3 size={18} />,
      url: "/reports",
      group: "Reporting",
      children: [
        {
          id: "report-policies",
          name: "Policies Report",
          icon: <BarChart3 size={18} />,
          url: "/reports/policies",
          allowedRoles: [ERoles.Admin],
        },
        {
          id: "daily-activity",
          name: "Daily Activity",
          icon: <ListOrdered size={18} />,
          url: "/daily-activity",
          allowedRoles: [ERoles.Admin, ERoles.SchemeConsultant],
          group: "Risk",
        },
        {
          id: "cash-up-dashboard",
          name: "Cashup",
          icon: <IconPigMoney size={18} />,
          url: "/cash-up/dashboard",
          // All users can draft/submit Cashup
        },
        {
          id: "cash-up-review",
          name: "Cashup Review",
          icon: <FilePen size={18} />,
          url: "/cash-up/review",
          allowedRoles: [ERoles.CashupReviewer],
        },
        {
          id: "cash-up-audit-reports",
          name: "Audit Reports",
          icon: <FileText size={18} />,
          url: "/reports/audit-reports",
          allowedRoles: [ERoles.CashupReviewer],
        },
        {
          id: "compliance-reporting",
          name: "Compliance",
          icon: <Shield size={18} />,
          url: "/reports/compliance",
          allowedRoles: [ERoles.Admin, ERoles.ComplianceOfficer],
        },
      ],
    },
    {
      id: 14,
      name: "Configurations",
      icon: <Settings size={18} />,
      url: "/configurations",
      allowedRoles: [
        ERoles.Admin,
        ERoles.BranchManager,
        ERoles.RegionalManager,
      ],
      group: "Management",
      children: [
        {
          id: "staff-members",
          name: "Staff Members",
          url: "/configurations/staff-members",
          allowedRoles: [
            ERoles.Admin,
            ERoles.HRManager,
            ERoles.BranchManager,
            ERoles.RegionalManager,
          ],
          icon: <HiUserGroup size={18} />,
        },
        {
          id: "users-config",
          name: "Portal Users",
          icon: <IconUserShield size={18} />,
          url: "/configurations/users",
          allowedRoles: [ERoles.Admin, ERoles.HRManager],
          group: "Management",
        },
        {
          id: "drivers-config",
          name: "Drivers",
          url: "/configurations/drivers",
          allowedRoles: [ERoles.Admin],
          icon: <IconSteeringWheel size={18} />,
        },
        // {
        //   id: "system-config",
        //   name: "System",
        //   url: "/configurations/system",
        //   allowedRoles: [ERoles.Admin],
        //   icon: <HiCog6Tooth size={18} />,
        // },
        // {
        //   id: "scheme-config",
        //   name: "Scheme",
        //   url: "/configurations/scheme",
        //   allowedRoles: [ERoles.Admin],
        //   icon: <HiCog6Tooth size={18} />,
        // },
        {
          id: "regions-config",
          name: "Regions",
          url: "/configurations/regions",
          allowedRoles: [ERoles.Admin, ERoles.RegionalManager],
          icon: <HiMapPin size={18} />,
        },
        {
          id: "branches-config",
          name: "Branches",
          url: "/configurations/branches",
          allowedRoles: [
            ERoles.Admin,
            ERoles.BranchManager,
            ERoles.RegionalManager,
          ],
          icon: <HiBuildingOffice size={18} />,
        },
        // {
        //   id: "daily-activity-reminders-config",
        //   name: "Daily Activity Reminders",
        //   url: "/configurations/daily-activity-reminders",
        //   allowedRoles: [ERoles.Admin],
        //   icon: <HiBell size={18} />,
        // },
        {
          id: "duty-roster-config",
          name: "Duty Roster",
          url: "/configurations/roster",
          allowedRoles: [
            ERoles.Admin,
            ERoles.HRManager,
            ERoles.BranchManager,
            ERoles.RegionalManager,
          ],
          icon: <HiClock size={18} />,
        },
      ],
    },
    {
      id: 13,
      name: "Status",
      icon: <Server size={18} />,
      url: "/status",
      allowedRoles: [...Object.values(ERoles)],
      group: "Management",
    },
  ];

  const toggleSubmenu = (id: number) => {
    setOpenMenuId((prev) => (prev === id ? null : id));
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

  useEffect(() => {
    const parent = filteredMenuItems.find((item) =>
      item.children?.some((child) => pathname.startsWith(child.url || ""))
    );
    if (parent) setOpenMenuId(parent.id);
  }, [pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <section
      className={`h-full overflow-hidden pb-10 ${collapsed ? "w-16" : "w-64 overflow-y-scroll"} bg-white transition-all duration-200 dark:bg-zinc-900`}
    >
      <div
        className={`flex ${collapsed ? "!ml-[-4px] justify-center" : "justify-end"} p-2`}
      >
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="px-2 text-zinc-500 hover:text-black dark:hover:text-white"
        >
          {collapsed ? <ChevronsRight size={20} /> : <ChevronsLeft size={20} />}
        </button>
      </div>

      <div className="grid gap-0">
        {filteredMenuItems.map((item) => {
          const isChildActive = !!item.children?.some((child) =>
            pathname.startsWith(child.url || "")
          );
          const isActive = isChildActive || pathname.startsWith(item.url || "");
          const baseClass =
            "flex cursor-pointer items-center gap-3 px-4 py-3 hover:bg-[#FFC107] hover:text-[#2B3E50]";
          const borderClass = isActive
            ? "border-l-4 border-l-primary text-primary"
            : "border-l-4 border-l-transparent";

          if (item.children && item.children.length > 0) {
            const isOpen = openMenuId === item.id;

            return (
              <div key={item.id}>
                <div
                  className={`${baseClass} ${borderClass} justify-between`}
                  onClick={() => {
                    if (collapsed) {
                      setCollapsed(false);
                      setOpenMenuId((prev) =>
                        prev === item.id ? null : item.id
                      );
                      return;
                    }
                    toggleSubmenu(item.id);
                  }}
                >
                  <div className="flex items-center gap-3">
                    {item.icon}
                    {!collapsed && (
                      <p className="text-xs font-normal uppercase tracking-wider">
                        {item.name}
                      </p>
                    )}
                  </div>

                  {!collapsed && (
                    <ChevronDown
                      size={16}
                      className={`transition-transform duration-200 ${isOpen ? "rotate-180" : "rotate-0"}`}
                    />
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
                          <span className="inline-flex w-5 justify-center">
                            {child.icon ?? null}
                          </span>
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
