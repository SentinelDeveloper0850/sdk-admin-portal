"use client";

import { ArrowLeftOutlined } from "@ant-design/icons";
import { Divider, Flex, Space } from "antd";
import { useRouter } from "next/navigation";

export default function PageHeader({
  title = "Page Title",
  subtitle = null,
  actions = [],
  noDivider = false,
  children,
  isChild = false,
}: {
  title: string;
  subtitle?: string | null;
  actions?: React.ReactNode[];
  noDivider?: boolean;
  children?: React.ReactNode;
  isChild?: boolean;
}) {
  const navigate = useRouter()
  return (
    <div className={isChild ? "border-b border-stone-400/30 mb-6" : ""}>
      <Flex className="mb-6" justify="space-between">
        <div className="flex gap-4 items-center">
          {isChild && <ArrowLeftOutlined onClick={() => navigate.back()} />}
          <div>
            <h2 className="text-large font-semibold">{title}</h2>
            {subtitle && <p className="text-small dark:text-gray-400">{subtitle}</p>}
          </div>
        </div>
        <Space>{...actions}</Space>
      </Flex>
      {children}
      {!noDivider && <Divider />}
    </div>
  );
}
