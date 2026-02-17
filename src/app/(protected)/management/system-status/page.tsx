"use client";

import { useEffect, useState } from "react";

import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  DatabaseOutlined,
  InfoCircleOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import {
  Alert,
  Button,
  Col,
  Row,
  Space,
  Statistic,
  Switch,
  Table,
  Tag,
  Typography,
} from "antd";

import PageHeader from "@/app/components/page-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";

const { Text } = Typography;

const StatusPage = () => {
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(false);

  const fetchStatus = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/status");
      const data = await response.json();
      if (data.success && data.data) {
        setStatus(data.data);
        setLastUpdated(new Date());
      } else {
        setError(data.message || "Failed to fetch status");
      }
    } catch (err) {
      setError("An error occurred while fetching status");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        fetchStatus();
      }, 30000); // Refresh every 30 seconds

      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat().format(num);
  };

  const getTotalRecords = () => {
    if (!status?.models) return 0;
    return Object.values(status.models).reduce(
      (sum: number, model: any) => sum + (model.count || 0),
      0
    );
  };

  const getModelCount = () => {
    return status?.models ? Object.keys(status.models).length : 0;
  };

  const modelsArray = status?.models ? Object.values(status.models) : [];

  return (
    <div className="min-h-screen p-4 dark:bg-[#11181C]">
      <PageHeader
        title="System Status"
        noDivider
        subtitle="Monitor the health and status of your system"
        actions={[
          <Space key="actions" size="middle">
            <Space>
              <Text type="secondary" className="dark:text-gray-400">
                Auto-refresh
              </Text>
              <Switch
                checked={autoRefresh}
                onChange={setAutoRefresh}
                size="small"
              />
            </Space>
            <Button
              key="refresh"
              type="primary"
              icon={<ReloadOutlined />}
              onClick={() => fetchStatus()}
              loading={loading}
            >
              Refresh
            </Button>
          </Space>,
        ]}
      />

      {error && (
        <Alert
          message="Error"
          description={error}
          type="error"
          showIcon
          closable
          className="mb-6"
          onClose={() => setError(null)}
        />
      )}

      {status && (
        <>
          {/* Summary Statistics */}
          <Row gutter={[16, 16]} className="mb-6">
            <Col xs={24} sm={12} md={6}>
              <Card className="p-6 dark:border-[#2e2e2e] dark:bg-[#212121] dark:text-white">
                <Statistic
                  title="Database Status"
                  value={status.database ? "Connected" : "Disconnected"}
                  prefix={
                    status.database ? (
                      <CheckCircleOutlined style={{ color: "#52c41a" }} />
                    ) : (
                      <CloseCircleOutlined style={{ color: "#ff4d4f" }} />
                    )
                  }
                  valueStyle={{
                    color: status.database ? "#52c41a" : "#ff4d4f",
                    fontSize: "16px",
                  }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card className="p-6 dark:border-[#2e2e2e] dark:bg-[#212121] dark:text-white">
                <Statistic
                  title="Total Models"
                  value={getModelCount()}
                  prefix={<DatabaseOutlined className="dark:text-[#ffac00]" />}
                  valueStyle={{ fontSize: "16px" }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card className="p-6 dark:border-[#2e2e2e] dark:bg-[#212121] dark:text-white">
                <Statistic
                  title="Total Records"
                  value={formatNumber(getTotalRecords())}
                  valueStyle={{ fontSize: "16px" }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card className="p-6 dark:border-[#2e2e2e] dark:bg-[#212121] dark:text-white">
                <Statistic
                  title="Last Updated"
                  value={
                    lastUpdated ? lastUpdated.toLocaleTimeString() : "Never"
                  }
                  prefix={
                    <InfoCircleOutlined className="dark:text-[#ffac00]" />
                  }
                  valueStyle={{ fontSize: "16px" }}
                />
              </Card>
            </Col>
          </Row>

          {/* System Information */}
          <Card className="mb-6 dark:border-[#2e2e2e] dark:bg-[#212121]">
            <CardHeader>
              <CardTitle className="dark:text-white">
                System Information
              </CardTitle>
              <CardDescription className="dark:text-gray-400">
                Build and version details
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Row gutter={[24, 16]}>
                <Col xs={24} sm={12} md={6}>
                  <div>
                    <Text type="secondary" className="dark:text-gray-400">
                      Version
                    </Text>
                    <div className="text-lg font-semibold dark:text-white">
                      {status.system?.version || "N/A"}
                    </div>
                  </div>
                </Col>
                <Col xs={24} sm={12} md={6}>
                  <div>
                    <Text type="secondary" className="dark:text-gray-400">
                      Commit
                    </Text>
                    <div className="font-mono text-lg font-semibold dark:text-white">
                      {status.system?.commit || "N/A"}
                    </div>
                  </div>
                </Col>
                <Col xs={24} sm={12} md={6}>
                  <div>
                    <Text type="secondary" className="dark:text-gray-400">
                      Build Time
                    </Text>
                    <div className="text-lg font-semibold dark:text-white">
                      {status.system?.buildTime || "N/A"}
                    </div>
                  </div>
                </Col>
                <Col xs={24} sm={12} md={6}>
                  <div>
                    <Text type="secondary" className="dark:text-gray-400">
                      Build Number
                    </Text>
                    <div className="text-lg font-semibold dark:text-white">
                      {status.system?.buildNumber || "N/A"}
                    </div>
                  </div>
                </Col>
              </Row>
            </CardContent>
          </Card>

          {/* Database Models Table */}
          <Card className="dark:border-[#2e2e2e] dark:bg-[#212121]">
            <CardHeader>
              <CardTitle className="dark:text-white">Database Models</CardTitle>
              <CardDescription className="dark:text-gray-400">
                Collection counts for all database models
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table
                dataSource={modelsArray}
                columns={[
                  {
                    title: "Model Name",
                    dataIndex: "name",
                    key: "name",
                    sorter: (a: any, b: any) => a.name.localeCompare(b.name),
                    render: (text: string) => (
                      <Text strong className="dark:text-white">
                        {text}
                      </Text>
                    ),
                  },
                  {
                    title: "Record Count",
                    dataIndex: "count",
                    key: "count",
                    sorter: (a: any, b: any) => a.count - b.count,
                    defaultSortOrder: "descend",
                    render: (count: number) => (
                      <Tag
                        color="blue"
                        style={{ fontSize: "14px", padding: "4px 12px" }}
                      >
                        {formatNumber(count)}
                      </Tag>
                    ),
                    align: "right",
                  },
                  {
                    title: "Status",
                    key: "status",
                    render: (_: any, record: any) => (
                      <Tag color={record.count > 0 ? "success" : "default"}>
                        {record.count > 0 ? "Active" : "Empty"}
                      </Tag>
                    ),
                    align: "center",
                  },
                ]}
                rowKey={(record: any) => record.name}
                loading={loading}
                pagination={{
                  pageSize: 20,
                  showSizeChanger: true,
                  showTotal: (total) => `Total ${total} models`,
                }}
              />
            </CardContent>
          </Card>
        </>
      )}

      {!status && !loading && !error && (
        <Card className="dark:border-[#2e2e2e] dark:bg-[#212121]">
          <CardContent className="py-8 text-center">
            <Text type="secondary" className="dark:text-gray-400">
              No status data available
            </Text>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default StatusPage;
