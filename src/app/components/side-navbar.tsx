"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { IconCoffin, IconPigMoney, IconSteeringWheel } from "@tabler/icons-react";
import { Tooltip } from "antd";
import {
  Banknote,
  BarChart3,
  Boxes,
  Briefcase,
  Building2,
  Calendar,
  ChevronDown,
  ChevronsLeft,
  ChevronsRight,
  ClipboardList,
  FilePen,
  FileText,
  HardDrive,
  LayoutDashboard,
  ListOrdered,
  PlusCircle,
  Receipt,
  Server,
  Settings,
  Shield,
  UserPen,
  Users
} from "lucide-react";
import {
  HiBuildingOffice,
  HiClock,
  HiMapPin,
  HiOutlineDocumentCurrencyDollar,
  HiUserGroup
} from "react-icons/hi2";


import { FileTextOutlined, SafetyOutlined } from "@ant-design/icons";
import { ERoles } from "../../types/roles.enum";
import { useRole } from "../hooks/use-role";

type MenuItem = {
  id: string | number;
  name: string;
  url?: string;
  icon?: React.ReactNode;
  group?: string;
  allowedRoles?: ERoles[];
  children?: MenuItem[];
};

const filterMenuTree = (items: MenuItem[], hasRole: (roles: ERoles[]) => boolean): MenuItem[] => {
  return items
    .map((item) => {
      const children = item.children ? filterMenuTree(item.children, hasRole) : undefined;

      const allowed =
        !item.allowedRoles || hasRole(item.allowedRoles);

      // keep item if allowed AND (no children OR has children after filtering)
      if (!allowed) return null;

      if (children && children.length === 0 && item.children) {
        // parent had children but all got filtered out
        // keep parent only if it has a url (clickable leaf)
        return item.url ? { ...item, children: [] } : null;
      }

      return { ...item, children };
    })
    .filter(Boolean) as MenuItem[];
};

const ManagementRoles = [
  ERoles.Admin,
  ERoles.HRManager,
  ERoles.BranchManager,
  ERoles.RegionalManager,
];

const SideNavBar = () => {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(true);

  const [openKeys, setOpenKeys] = useState<Set<string>>(new Set());
  const keyOf = (id: string | number) => String(id);

  const toggleKey = (id: string | number) => {
    const k = keyOf(id);
    setOpenKeys((prev) => {
      const next = new Set(prev);
      if (next.has(k)) next.delete(k);
      else next.add(k);
      return next;
    });
  };

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
    },
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
      id: 9,
      name: "Resources",
      icon: <FileTextOutlined style={{ fontSize: 18 }} />,
      url: "/resources",
      children: [
        {
          id: "official-documents",
          name: "Official Documents",
          icon: <FileTextOutlined />,
          url: "/resources/documents",
        },
        {
          id: "knowledge-hub",
          name: "Knowledge Hub",
          icon: <FileTextOutlined />,
          url: "/resources/knowledge-hub",
        },
      ],
    },
    {
      id: 10,
      name: "Management",
      icon: <SafetyOutlined size={18} />,
      url: "/management",
      allowedRoles: ManagementRoles,
      children: [
        {
          id: "system-status",
          name: "System Status",
          icon: <Server size={18} />,
          url: "/management/system-status",
          allowedRoles: ManagementRoles,
          group: "Management",
        },
        {
          id: "active-sessions",
          name: "Active Sessions",
          icon: <SafetyOutlined size={18} />,
          url: "/management/active-sessions",
          allowedRoles: ManagementRoles,
          group: "Management",
        },
        {
          id: "asset-management",
          name: "Asset Management",
          icon: <Boxes size={18} />, // or Database / HardDrive / Boxes
          url: "/management/asset-management",
          allowedRoles: ManagementRoles,
          group: "Management",
          children: [
            {
              id: "ams-assets",
              name: "Assets",
              icon: <HardDrive size={18} />,
              url: "/management/asset-management/assets",
              allowedRoles: ManagementRoles,
              group: "Asset Management",
            },
            {
              id: "ams-invoices",
              name: "Purchase Invoices",
              icon: <Receipt size={18} />,
              url: "/management/asset-management/invoices",
              allowedRoles: ManagementRoles,
              group: "Asset Management",
            },
            {
              id: "ams-suppliers",
              name: "Suppliers",
              icon: <Building2 size={18} />,
              url: "/management/asset-management/suppliers",
              allowedRoles: ManagementRoles,
              group: "Asset Management",
            },
            // Optional shortcut (only if you want it)
            {
              id: "ams-new-intake",
              name: "New Intake",
              icon: <PlusCircle size={18} />,
              url: "/management/asset-management/invoices/new",
              allowedRoles: ManagementRoles,
              group: "Asset Management",
            },
          ],
        },
        {
          id: "system-configurations",
          name: "System Configurations",
          icon: <Settings size={18} />,
          url: "/management/configurations",
          allowedRoles: ManagementRoles,
          group: "Management",
          children: [
            {
              id: "staff-members",
              name: "Staff Members",
              url: "/configurations/staff-members",
              allowedRoles: ManagementRoles,
              icon: <HiUserGroup size={18} />,
            },
            {
              id: "users",
              name: "Portal Users",
              icon: <UserPen size={18} />,
              url: "/users",
              allowedRoles: ManagementRoles,
              group: "Management",
            },
            {
              id: "drivers-config",
              name: "Drivers",
              url: "/configurations/drivers",
              allowedRoles: ManagementRoles,
              icon: <IconSteeringWheel size={18} />,
            },
            {
              id: "regions-config",
              name: "Regions",
              url: "/configurations/regions",
              allowedRoles: ManagementRoles,
              icon: <HiMapPin size={18} />,
            },
            {
              id: "branches-config",
              name: "Branches",
              url: "/configurations/branches",
              allowedRoles: ManagementRoles,
              icon: <HiBuildingOffice size={18} />,
            },
            {
              id: "duty-roster-config",
              name: "Duty Roster",
              url: "/configurations/roster",
              allowedRoles: ManagementRoles,
              icon: <HiClock size={18} />,
            },
          ],
        },
      ],
    },
  ];

  const { hasRole } = useRole();

  const filteredMenuItems = useMemo(
    () => filterMenuTree(menuItems as MenuItem[], hasRole),
    [hasRole]
  );

  const collectOpenKeysForPath = (
    items: MenuItem[],
    path: string,
    parents: string[] = []
  ): string[] => {
    const pathnameOnly = (path.split("?")[0] || "").replace(/\/+$/, "");

    for (const item of items) {
      const k = String(item.id);
      const nextParents = [...parents, k];
      const hasChildren = !!item.children?.length;

      // 1) Try deeper first (best match wins)
      if (hasChildren) {
        const match = collectOpenKeysForPath(item.children!, pathnameOnly, nextParents);
        if (match.length) return match;
      }

      // 2) Match this item (exact OR leaf prefix)
      if (item.url) {
        const itemUrl = item.url.replace(/\/+$/, "");

        const isExact = pathnameOnly === itemUrl;

        // prefix match only if it's a real segment boundary
        const isLeafPrefix =
          !hasChildren &&
          (pathnameOnly === itemUrl || pathnameOnly.startsWith(itemUrl + "/"));

        if (isExact || isLeafPrefix) {
          return parents; // open ancestors, not the leaf itself
        }
      }
    }

    return [];
  };


  useEffect(() => {
    const keys = collectOpenKeysForPath(filteredMenuItems as MenuItem[], pathname);
    setOpenKeys(new Set(keys));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  const SideNavItem = ({
    item,
    level,
    collapsed,
    pathname,
    openKeys,
    toggleKey,
  }: {
    item: MenuItem;
    level: number;
    collapsed: boolean;
    pathname: string;
    openKeys: Set<string>;
    toggleKey: (id: string | number) => void;
  }) => {
    const hasChildren = !!item.children?.length;
    const isOpen = openKeys.has(String(item.id));

    const isActive = item.url ? pathname.startsWith(item.url) : false;
    const isDescActive = hasChildren
      ? item.children!.some((c) => (c.url ? pathname.startsWith(c.url) : false))
      : false;

    const active = isActive || isDescActive;

    const opened = hasChildren && isOpen;
    const highlighted = active || opened;

    const baseClass = "flex cursor-pointer items-center gap-3 px-4 py-3 hover:bg-[#FFC107] hover:text-[#2B3E50]";

    const borderClass = highlighted
      ? "border-l-4 border-l-primary text-primary"
      : "border-l-4 border-l-transparent";

    const bgClass = highlighted
      ? "bg-amber-50 dark:bg-zinc-800/40"
      : "";

    const indentPx = Math.min(level * 14, 42); // tweak if you want more/less indentation

    if (hasChildren) {
      return (
        <div>
          <div
            className={`${baseClass} ${borderClass} ${bgClass} justify-between`}
            style={{ paddingLeft: 16 + indentPx }}
            onClick={() => {
              if (collapsed) return; // in collapsed mode we won't expand nested menus
              toggleKey(item.id);
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

          {!collapsed && isOpen && (
            <div>
              {item.children!.map((child) => (
                <SideNavItem
                  key={String(child.id)}
                  item={child}
                  level={level + 1}
                  collapsed={collapsed}
                  pathname={pathname}
                  openKeys={openKeys}
                  toggleKey={toggleKey}
                />
              ))}
            </div>
          )}
        </div>
      );
    }

    const content = (
      <div className={`${baseClass} ${borderClass}`} style={{ paddingLeft: 16 + indentPx }}>
        {item.icon}
        {!collapsed && (
          <p className="text-xs font-normal uppercase tracking-wider">
            {item.name}
          </p>
        )}
      </div>
    );

    if (!item.url) return <div>{content}</div>;

    return (
      <Link href={item.url}>
        {collapsed ? (
          <Tooltip title={item.name} placement="right">
            {content}
          </Tooltip>
        ) : (
          content
        )}
      </Link>
    );
  };

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
        {(filteredMenuItems as MenuItem[]).map((item) => (
          <SideNavItem
            key={String(item.id)}
            item={item}
            level={0}
            collapsed={collapsed}
            pathname={pathname}
            openKeys={openKeys}
            toggleKey={toggleKey}
          />
        ))}
      </div>

    </section>
  );
};

export default SideNavBar;
