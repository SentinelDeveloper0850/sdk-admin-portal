import { Divider, Flex, Space } from "antd";

const PageHeader = ({
  title = "Page Title",
  subtitle = null,
  actions = [],
  noDivider = false,
}: {
  title: string;
  subtitle: string | null;
  actions?: React.ReactNode[];
  noDivider?: boolean;
}) => {
  return (
    <>
      <Flex className="mb-6" justify="space-between">
        <div>
          <h2 className="text-large font-semibold">{title}</h2>
          {subtitle && <p className="text-small">{subtitle}</p>}
        </div>
        <Space>{...actions}</Space>
      </Flex>
      {!noDivider && <Divider />}
    </>
  );
};

export default PageHeader;
