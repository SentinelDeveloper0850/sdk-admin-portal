"use client";

import { useRouter } from "next/navigation";

import { Button, Card, Col, Row, Typography } from "antd";
import { ArrowLeft, Clock } from "lucide-react";

import { withRoleGuard } from "@/utils/utils/with-role-guard";

import PageHeader from "@/app/components/page-header";

import { ERoles } from "@/types/roles.enum";

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
          </Button>,
        ]}
      />

      <div className="mt-8">
        <Row justify="center">
          <Col xs={24} sm={20} md={16} lg={12} xl={10}>
            <Card className="text-center">
              <div className="py-12">
                <div className="mb-6">
                  <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                    <Clock size={32} className="text-green-600" />
                  </div>
                  <Title level={3} className="mb-4 dark:text-white">
                    Coming Soon
                  </Title>
                  <Paragraph className="text-md mb-6 dark:text-gray-400">
                    System configurations management is currently under
                    development. This feature will allow you to manage
                    system-wide settings, security policies, and application
                    configurations.
                  </Paragraph>
                </div>
              </div>
            </Card>
          </Col>
        </Row>
      </div>
    </div>
  );
};

export default withRoleGuard(SystemConfigurationsPage, [ERoles.Admin]);
