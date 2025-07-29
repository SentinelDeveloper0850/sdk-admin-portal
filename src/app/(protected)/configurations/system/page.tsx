"use client";

import { Button, Card, Col, Row, Space, Typography } from "antd";
import { ArrowLeft, Clock, Settings } from "lucide-react";
import { useRouter } from "next/navigation";

import PageHeader from "@/app/components/page-header";
import { withRoleGuard } from "@/utils/utils/with-role-guard";
import { ERoles } from "../../../../../types/roles.enum";

const { Title, Paragraph, Text } = Typography;

const SystemConfigurationsPage = () => {
  const router = useRouter();

  return (
    <div style={{ padding: "20px" }}>
      <PageHeader
        title="System Configurations"
        subtitle="Manage system settings and configurations"
        actions={[
          <Button
            key="back"
            icon={<ArrowLeft size={16} />}
            onClick={() => router.back()}
          >
            Go Back
          </Button>
        ]}
      />

      <div className="mt-8">
        <Row justify="center">
          <Col xs={24} sm={20} md={16} lg={12} xl={10}>
            <Card className="text-center">
              <div className="py-12">
                <div className="mb-6">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                    <Clock size={32} className="text-green-600" />
                  </div>
                  <Title level={3} className="mb-4 dark:text-white">
                    Coming Soon
                  </Title>
                  <Paragraph className="text-md dark:text-gray-400 mb-6">
                    System configurations management is currently under development.
                    This feature will allow you to manage system-wide settings,
                    security policies, and application configurations.
                  </Paragraph>
                </div>

                {/* <div className="space-y-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <Title level={4} className="mb-2 flex items-center gap-2">
                      <Settings size={20} className="text-blue-600" />
                      Planned Features
                    </Title>
                    <ul className="text-left space-y-2 text-gray-600">
                      <li>• General system settings management</li>
                      <li>• Security and authentication configurations</li>
                      <li>• Email and notification settings</li>
                      <li>• Policy management and enforcement</li>
                      <li>• System health monitoring</li>
                      <li>• Audit logging and compliance</li>
                    </ul>
                  </div>

                  <Space direction="vertical" size="large" className="w-full">
                    <Button
                      type="primary"
                      size="large"
                      onClick={() => router.push('/configurations/branches')}
                    >
                      Manage Branch Configurations
                    </Button>
                    <Button
                      size="large"
                      onClick={() => router.push('/dashboard')}
                    >
                      Return to Dashboard
                    </Button>
                  </Space>
                </div> */}
              </div>
            </Card>
          </Col>
        </Row>
      </div>
    </div>
  );
};

export default withRoleGuard(SystemConfigurationsPage, [ERoles.Admin]);