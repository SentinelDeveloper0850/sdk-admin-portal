"use client";

import { FC } from "react";

import { Select } from "antd";
import { ShieldCheck, User } from "lucide-react";
import { useTheme } from "next-themes";

const { Option } = Select;

const coreRoles = [
  {
    key: "admin",
    label: "Admin",
    description: "Full system access and configuration",
    icon: <ShieldCheck size={16} />,
  },
  {
    key: "member",
    label: "Member",
    description: "Standard access with limited permissions",
    icon: <User size={16} />,
  },
];

interface CoreRoleSelectProps {
  value?: string;
  onChange?: (value: string) => void;
}

const CoreRoleSelect: FC<CoreRoleSelectProps> = ({ value, onChange }) => {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  return (
    <Select
      placeholder="Select a core role"
      value={value}
      onChange={onChange}
      style={{ width: "100%" }}
      className={isDark ? "text-white" : ""}
      optionLabelProp="label" // 👈 This prevents rendering the full JSX inside the selected view
    >
      {coreRoles.map((role) => (
        <Option key={role.key} value={role.key}>
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
    </Select>
  );
};

export default CoreRoleSelect;
