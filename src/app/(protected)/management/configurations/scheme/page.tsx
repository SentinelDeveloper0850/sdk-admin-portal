"use client";

import { useRouter } from "next/navigation";

import { Button, Card, Col, Row, Typography } from "antd";
import { ArrowLeft, Clock } from "lucide-react";

import { withRoleGuard } from "@/utils/utils/with-role-guard";

import PageHeader from "@/app/components/page-header";

import { ERoles } from "@/types/roles.enum";

const { Title, Paragraph, Text } = Typography;

const SchemeConfigurationsPage = () => {
  const router = useRouter();

  return (
    <div style={{ padding: "20px" }}>
      <PageHeader
        title="Scheme Configurations"
        subtitle="Manage scheme settings and policies"
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
                    Scheme configurations management is currently under
                    development. This feature will allow you to manage insurance
                    schemes, policies, and benefit configurations.
                  </Paragraph>
                </div>

                {/* <div className="space-y-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <Title level={4} className="mb-2 flex items-center gap-2">
                      <Building2 size={20} className="text-green-600" />
                      Planned Features
                    </Title>
                    <ul className="text-left space-y-2 text-gray-600">
                      <li>• Insurance scheme management</li>
                      <li>• Policy configuration and rules</li>
                      <li>• Benefit structure management</li>
                      <li>• Premium calculation settings</li>
                      <li>• Coverage limits and exclusions</li>
                      <li>• Scheme-specific policies</li>
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

export default withRoleGuard(SchemeConfigurationsPage, [ERoles.Admin]);
