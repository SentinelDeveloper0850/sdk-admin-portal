"use client";

import { Button, Col, Row, Space, Statistic } from "antd";

import PageHeader from "@/app/components/page-header";

const EftPdfAnalysis = () => {
  return (
    <div className="p-5">
      <PageHeader
        title="PDF Analyzer"
        actions={[
          <Space>
            <Button>Import History</Button>
          </Space>,
        ]}
      >
        <Row gutter={16}>
          <Col
            span={12}
            style={{ display: "flex", justifyContent: "flex-start" }}
          >
            <Space size={32}>
              <Statistic title="Total Transactions" value={0} />
              <Statistic title="Selected Transactions" value={0} />
            </Space>
          </Col>
        </Row>
      </PageHeader>
    </div>
  );
};

export default EftPdfAnalysis;
