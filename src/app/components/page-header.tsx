import { Divider, Flex, Space } from "antd";

export default function PageHeader({
  title = "Page Title",
  subtitle = null,
  actions = [],
  noDivider = false,
  children,
}: {
  title: string;
  subtitle?: string | null;
  actions?: React.ReactNode[];
  noDivider?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <>
      <Flex className="mb-6" justify="space-between">
        <div>
          <h2 className="text-large font-semibold">{title}</h2>
          {subtitle && <p className="text-small dark:text-gray-400">{subtitle}</p>}
        </div>
        <Space>{...actions}</Space>
      </Flex>
      {children}
      {!noDivider && <Divider />}
    </>
  );
}
