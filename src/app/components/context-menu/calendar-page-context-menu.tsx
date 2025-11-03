"use client";

import { useState } from "react";

import {
  Building2,
  Building,
  User2,
  ChevronsRight,
  ChevronsLeft,
} from "lucide-react";
import { Tooltip } from "antd";


const CalendarPageContextMenu = ({ selectedCalendar, setSelectedCalendar }: { selectedCalendar: string, setSelectedCalendar: (calendar: string) => void }) => {
  const [collapsed, setCollapsed] = useState(true);

  const menuItems = [
    {
      id: 0,
      name: "Company Calendar",
      value: "company",
      icon: <Building2 size={18} />,
      onClick: () => setSelectedCalendar("company"),
    },
    {
      id: 1,
      name: "Branch Calendar",
      value: "branch",
      icon: <Building size={18} />,
      onClick: () => setSelectedCalendar("branch"),
    },
    {
      id: 2,
      name: "Personal Calendar",
      value: "personal",
      icon: <User2 size={18} />,
      onClick: () => setSelectedCalendar("personal"),
    },
  ];

  return (
    <section className={`h-full ${collapsed ? "w-14" : "w-64"} overflow-hidden bg-white transition-all duration-200 dark:bg-zinc-900`}>
      <div className={`flex ${collapsed ? "justify-center" : "justify-start ml-3"} p-2`}>
        <Tooltip title={collapsed ? "Expand Context Menu" : "Collapse Context Menu"} placement="left">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="text-zinc-500 hover:text-black dark:hover:text-white">
            {collapsed ? <ChevronsLeft size={20} /> : <ChevronsRight size={20} />}
          </button>
        </Tooltip>
      </div>

      <div className="grid gap-0">
        {menuItems.map((item) => {
          // Items should be rendered flipped 90% so that they read vertically instead of horizontally
          const isActive = selectedCalendar === item.value;
          const baseClass = "flex cursor-pointer items-center gap-3 px-4 py-3 hover:bg-[#FFC107] hover:text-[#2B3E50]";
          const borderClass = isActive ? "border-l-4 border-l-primary text-primary" : "border-l-4 border-l-transparent";

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

          if (collapsed) {
            return <Tooltip title={item.name} placement="left"><div key={item.id} onClick={item.onClick}>{content}</div></Tooltip>
          } else {
            return <div key={item.id} onClick={item.onClick}>{content}</div>
          }
        })}
      </div>
    </section>
  );
};

export default CalendarPageContextMenu;
