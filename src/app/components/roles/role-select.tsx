"use client";

import { FC } from "react";

import { Select } from "antd";
import {
  Briefcase,
  ClipboardList,
  DollarSign,
  FileCheck,
  HardDrive,
  Map,
  Truck,
  Users,
} from "lucide-react";
import { useTheme } from "next-themes";

const { OptGroup, Option } = Select;

const groupedRoles = [
  {
    category: "Claims & Compliance",
    roles: [
      {
        key: "claims_officer",
        label: "Claims Officer",
        description: "Manages policyholder claims",
        icon: <ClipboardList size={16} />,
      },
      {
        key: "compliance_auditor",
        label: "Compliance Auditor",
        description: "Audits system and policy compliance",
        icon: <FileCheck size={16} />,
      },
    ],
  },
  {
    category: "HR & Finance",
    roles: [
      {
        key: "hr_manager",
        label: "HR Manager",
        description: "Manages employees and leave",
        icon: <Users size={16} />,
      },
      {
        key: "finance_officer",
        label: "Finance Officer",
        description: "Handles finances and reporting",
        icon: <DollarSign size={16} />,
      },
      {
        key: "cashier",
        label: "Cashier",
        description: "Processes payments and receipts",
        icon: <DollarSign size={16} />,
      },
    ],
  },
  {
    category: "Funeral Operations",
    roles: [
      {
        key: "funeral_coordinator",
        label: "Funeral Coordinator",
        description: "Oversees funeral logistics",
        icon: <Briefcase size={16} />,
      },
    ],
  },
  {
    category: "Sales & Client Relations",
    roles: [
      {
        key: "society_consultant",
        label: "Society Consultant",
        description: "Supports social group leaders",
        icon: <Users size={16} />,
      },
      {
        key: "scheme_consultant",
        label: "Scheme Consultant",
        description:
          "Handles walk-in client signups and in-person scheme consultations",
        icon: <Users size={16} />,
      },
      {
        key: "scheme_consultant_online",
        label: "Scheme Consultant (Online)",
        description:
          "Manages online policy signups and client support from the website",
        icon: <Users size={16} />,
      },
    ],
  },
  {
    category: "Fleet & Logistics",
    roles: [
      {
        key: "driver",
        label: "Driver",
        description: "Operates vehicles for transport",
        icon: <Truck size={16} />,
      },
      {
        key: "fleet_manager",
        label: "Fleet Manager",
        description: "Manages vehicles and drivers",
        icon: <HardDrive size={16} />,
      },
      {
        key: "logistics_coordinator",
        label: "Logistics Coordinator",
        description: "Plans transport and routing",
        icon: <Map size={16} />,
      },
    ],
  },
];

interface RoleSelectProps {
  value?: string[];
  onChange?: (value: string[]) => void;
}

const RoleSelect: FC<RoleSelectProps> = ({ value, onChange }) => {
  const { resolvedTheme } = useTheme();

  const isDark = resolvedTheme === "dark";

  return (
    <Select
      mode="tags"
      placeholder="Select additional roles"
      value={value}
      onChange={onChange}
      style={{ width: "100%" }}
      tagRender={({ label, value, closable, onClose }) => {
        const role = groupedRoles
          .flatMap((group) => group.roles)
          .find((r) => r.key === value);

        return (
          <div
            className={`mb-1 mr-1 flex items-center gap-2 rounded-md px-2 py-1 ${
              isDark ? "bg-gray-800 text-white" : "bg-gray-100 text-gray-900"
            }`}
            style={{ display: "inline-flex" }}
          >
            {role?.icon}
            <span className="text-sm font-medium">{role?.label || label}</span>
            {closable && (
              <span
                onClick={onClose}
                className="ml-1 cursor-pointer hover:text-red-500"
              >
                ✕
              </span>
            )}
          </div>
        );
      }}
    >
      {groupedRoles.map((group) => (
        <OptGroup key={group.category} label={group.category}>
          {group.roles.map((role) => (
            <Option key={role.key} value={role.key} label={role.label}>
              <div className="flex flex-col">
                <div className="flex items-center gap-2 font-semibold">
                  {role.icon}
                  {role.label}
                </div>
                <div
                  className={`text-xs ${
                    isDark ? "text-gray-400" : "text-gray-500"
                  }`}
                >
                  {role.description}
                </div>
              </div>
            </Option>
          ))}
        </OptGroup>
      ))}
    </Select>
  );
};

export default RoleSelect;
