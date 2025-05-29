"use client";

import { Button, Col, Row, Space, Statistic } from "antd";

import PDFBankStatementAnalyzer from "@/app/components/import-tools/pdf/statement-analyzer";
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
          {/* <Col
            span={12}
            style={{ display: "flex", justifyContent: "flex-end" }}
          >
            {user?.role == "admin" && (
              <Space>
                <BankStatementExcelImporter />
                <TransactionHistoryCsvImporter
                  handleChange={fileChangeHandler}
                  allowMultiple
                  label="Import Transaction History (CSV)"
                />
              </Space>
            )}
          </Col> */}
        </Row>
      </PageHeader>

      <PDFBankStatementAnalyzer />
    </div>
  );
};

export default EftPdfAnalysis;
