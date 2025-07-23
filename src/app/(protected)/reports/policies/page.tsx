"use client";

import { DownloadOutlined, FilePdfOutlined, ReloadOutlined } from "@ant-design/icons";
import {
  Alert,
  Button,
  Card,
  Col,
  Divider,
  List,
  Row,
  Spin,
  Statistic,
  Tag,
  Typography
} from "antd";
import jsPDF from 'jspdf';
import { useEffect, useState } from "react";

import PageHeader from "@/app/components/page-header";

const { Title, Text, Paragraph } = Typography;

interface PolicyReconciliationStats {
  fileData: {
    total: number;
    valid: number;
    invalid: number;
  };
  databaseData: {
    total: number;
    withEasyPayNumber: number;
    withoutEasyPayNumber: number;
  };
  matches: Array<{ policyNumber: string; easyPayNumber: string; status: string }>;
  fileOnly: Array<{ policyNumber: string; easyPayNumber: string; status: string }>;
  databaseOnly: Array<{ policyNumber: string; easyPayNumber: string; status: string }>;
  mismatches: Array<{ policyNumber: string; fileEasyPayNumber: string; dbEasyPayNumber: string; status: string }>;
  withoutEasyPay: Array<{ policyNumber: string; fullname: string; productName: string; memberID: string; status: string }>;
}

interface EasyPayStats {
  count: number;
  toSync: number;
  withoutPolicy: number;
  uniqueEasyPayWithoutPolicy: number;
}

interface ReportData {
  policyReconciliation: PolicyReconciliationStats | null;
  easyPayStats: EasyPayStats | null;
  lastUpdated: string;
}

export default function ReportsPage() {
  const [reportData, setReportData] = useState<ReportData>({
    policyReconciliation: null,
    easyPayStats: null,
    lastUpdated: new Date().toISOString(),
  });
  const [loading, setLoading] = useState(false);

  const fetchReportData = async () => {
    try {
      setLoading(true);

      // Fetch policy reconciliation data
      const policyResponse = await fetch('/api/policies/reconciliation');
      const policyData = policyResponse.ok ? await policyResponse.json() : null;

      // Fetch EasyPay statistics
      const easyPayResponse = await fetch('/api/transactions/easypay');
      const easyPayData = easyPayResponse.ok ? await easyPayResponse.json() : null;

      setReportData({
        policyReconciliation: policyData?.data || null,
        easyPayStats: easyPayData || null,
        lastUpdated: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error fetching report data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportData();
  }, []);

  const exportReport = () => {
    if (!reportData.policyReconciliation || !reportData.easyPayStats) {
      return;
    }

    const report = `
RECONCILIATION REPORT
Generated: ${new Date(reportData.lastUpdated).toLocaleString()}

POLICY INFORMATION:
==================

File Records: ${reportData.policyReconciliation.fileData.total}
- Total policy records loaded from the policy file
- Valid records: ${reportData.policyReconciliation.fileData.valid}
- Invalid records: ${reportData.policyReconciliation.fileData.invalid}

Database Records: ${reportData.policyReconciliation.databaseData.total}
- Total policy records in the database
- With EasyPay numbers: ${reportData.policyReconciliation.databaseData.withEasyPayNumber}
- Without EasyPay numbers: ${reportData.policyReconciliation.databaseData.withoutEasyPayNumber}

Matches: ${reportData.policyReconciliation.matches.length}
- Policy numbers that exist in both file and database with matching EasyPay numbers

File Only: ${reportData.policyReconciliation.fileOnly.length}
- Policy numbers that exist in the file but not in the database

Database Only: ${reportData.policyReconciliation.databaseOnly.length}
- Policy numbers that exist in the database but not in the file

Mismatches: ${reportData.policyReconciliation.mismatches.length}
- Policy numbers that exist in both file and database but have different EasyPay numbers

Without EasyPay: ${reportData.policyReconciliation.withoutEasyPay.length}
- Database policies that don't have EasyPay numbers assigned

EASYPAY TRANSACTION INFORMATION:
===============================

Total Transactions: ${reportData.easyPayStats.count}
- Total number of EasyPay transactions in the system

Unique EasyPay Numbers without Policy Numbers: ${reportData.easyPayStats.uniqueEasyPayWithoutPolicy}
- Number of unique EasyPay numbers that don't have corresponding policy numbers

Transactions without Policy Numbers: ${reportData.easyPayStats.withoutPolicy}
- Total number of individual transactions that don't have policy numbers assigned

RECOMMENDED NEXT STEPS:
======================

1. Review and fix invalid file records (${reportData.policyReconciliation.fileData.invalid} records)
2. Investigate file-only policies (${reportData.policyReconciliation.fileOnly.length} records) - consider adding to database
3. Investigate database-only policies (${reportData.policyReconciliation.databaseOnly.length} records) - consider adding to file
4. Resolve mismatched EasyPay numbers (${reportData.policyReconciliation.mismatches.length} records)
5. Assign EasyPay numbers to policies without them (${reportData.policyReconciliation.withoutEasyPay.length} records)
6. Match policy numbers to transactions (${reportData.easyPayStats.uniqueEasyPayWithoutPolicy} unique EasyPay numbers need matching)
7. Sync policy numbers for transactions (${reportData.easyPayStats.toSync} transactions ready for sync)

Priority Actions:
- High: Fix mismatches and assign missing EasyPay numbers
- Medium: Sync policy numbers for transactions
- Low: Review file-only and database-only policies
    `;

    const blob = new Blob([report], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reconciliation-report-${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const exportToPDF = () => {
    if (!reportData.policyReconciliation || !reportData.easyPayStats) {
      return;
    }

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    const lineHeight = 7;
    let yPosition = 20;

    // Store data in local variables to avoid null checks
    const policyData = reportData.policyReconciliation;
    const easyPayData = reportData.easyPayStats;

    // Function to generate the PDF content
    const generatePDFContent = (startY: number) => {
      let currentY = startY;
      let pageNumber = 1;

      // Function to add footer to current page
      const addFooter = () => {
        const footerY = doc.internal.pageSize.getHeight() - 20;
        const footerText = `Somdaka Funeral Services - Administration Portal`;
        const pageText = `Page ${pageNumber}`;

        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 100, 100); // Gray color for footer

        // Add footer text (left-aligned)
        doc.text(footerText, margin, footerY);

        // Add page number (right-aligned)
        const pageTextWidth = doc.getTextWidth(pageText);
        doc.text(pageText, pageWidth - margin - pageTextWidth, footerY);

        // Reset text color
        doc.setTextColor(0, 0, 0);
      };

      // Title
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('RECONCILIATION REPORT', pageWidth / 2, currentY, { align: 'center' });
      currentY += 15;

      // Date
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Generated: ${new Date(reportData.lastUpdated).toLocaleString()}`, pageWidth / 2, currentY, { align: 'center' });
      currentY += 20;

      // Policy Information Section
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('POLICY INFORMATION', margin, currentY);
      currentY += 10;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');

      doc.text(`File Records: ${policyData.fileData.total}`, margin, currentY);
      currentY += lineHeight;
      doc.text(`- Valid records: ${policyData.fileData.valid}`, margin + 5, currentY);
      currentY += lineHeight;
      doc.text(`- Invalid records: ${policyData.fileData.invalid}`, margin + 5, currentY);
      currentY += lineHeight + 5;

      doc.text(`Database Records: ${policyData.databaseData.total}`, margin, currentY);
      currentY += lineHeight;
      doc.text(`- With EasyPay numbers: ${policyData.databaseData.withEasyPayNumber}`, margin + 5, currentY);
      currentY += lineHeight;
      doc.text(`- Without EasyPay numbers: ${policyData.databaseData.withoutEasyPayNumber}`, margin + 5, currentY);
      currentY += lineHeight + 5;

      // Check if we need a new page
      if (currentY > 250) {
        addFooter(); // Add footer to current page
        doc.addPage();
        pageNumber++;
        currentY = 20;
      }

      doc.text(`Matches: ${policyData.matches.length}`, margin, currentY);
      currentY += lineHeight;
      doc.text(`File Only: ${policyData.fileOnly.length}`, margin, currentY);
      currentY += lineHeight;
      doc.text(`Database Only: ${policyData.databaseOnly.length}`, margin, currentY);
      currentY += lineHeight;
      doc.text(`Mismatches: ${policyData.mismatches.length}`, margin, currentY);
      currentY += lineHeight;
      doc.text(`Without EasyPay: ${policyData.withoutEasyPay.length}`, margin, currentY);
      currentY += lineHeight + 10;

      // EasyPay Information Section
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('EASYPAY TRANSACTION INFORMATION', margin, currentY);
      currentY += 10;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');

      doc.text(`Total Transactions: ${easyPayData.count}`, margin, currentY);
      currentY += lineHeight;
      doc.text(`Unique EasyPay Numbers without Policy Numbers: ${easyPayData.uniqueEasyPayWithoutPolicy}`, margin, currentY);
      currentY += lineHeight;
      doc.text(`Transactions without Policy Numbers: ${easyPayData.withoutPolicy}`, margin, currentY);
      currentY += lineHeight + 10;

      // Calculate space needed for Recommended Next Steps section
      const steps = [
        `1. Review and fix invalid file records (${policyData.fileData.invalid} records)`,
        `2. Investigate file-only policies (${policyData.fileOnly.length} records) - consider adding to database`,
        `3. Investigate database-only policies (${policyData.databaseOnly.length} records) - consider adding to file`,
        `4. Resolve mismatched EasyPay numbers (${policyData.mismatches.length} records)`,
        `5. Assign EasyPay numbers to policies without them (${policyData.withoutEasyPay.length} records)`,
        `6. Match policy numbers to transactions (${easyPayData.uniqueEasyPayWithoutPolicy} unique EasyPay numbers need matching)`,
        `7. Sync policy numbers for transactions (${easyPayData.toSync} transactions ready for sync)`
      ];

      const headerHeight = 10; // Height for section header
      const stepsHeight = steps.length * lineHeight; // Height for all steps
      const priorityHeight = 4 * lineHeight; // Height for priority actions (3 lines + spacing)
      const totalSectionHeight = headerHeight + stepsHeight + priorityHeight + 20; // +20 for spacing

      // Check if we need a new page for the entire section
      if (currentY + totalSectionHeight > 250) {
        addFooter(); // Add footer to current page
        doc.addPage();
        pageNumber++;
        currentY = 20;
      }

      // Recommended Next Steps Section
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('RECOMMENDED NEXT STEPS', margin, currentY);
      currentY += 10;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');

      steps.forEach((step) => {
        if (currentY > 250) {
          addFooter(); // Add footer to current page
          doc.addPage();
          pageNumber++;
          currentY = 20;
        }
        doc.text(step, margin, currentY);
        currentY += lineHeight;
      });

      currentY += 10;

      // Priority Actions
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Priority Actions:', margin, currentY);
      currentY += lineHeight;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text('- High: Fix mismatches and assign missing EasyPay numbers', margin, currentY);
      currentY += lineHeight;
      doc.text('- Medium: Sync policy numbers for transactions', margin, currentY);
      currentY += lineHeight;
      doc.text('- Low: Review file-only and database-only policies', margin, currentY);

      // Add footer to the last page
      addFooter();
    };

    // Add logo
    const logoUrl = '/logo.png';
    const maxLogoWidth = 60; // Maximum width we want to allow
    const maxLogoHeight = 30; // Maximum height we want to allow
    const logoX = (pageWidth - maxLogoWidth) / 2; // Center position

    // Load and add the logo
    const img = new Image();
    img.crossOrigin = 'anonymous'; // Handle CORS issues
    img.src = logoUrl;

    img.onload = () => {
      try {
        // Calculate dimensions maintaining aspect ratio
        const aspectRatio = img.naturalWidth / img.naturalHeight;
        let logoWidth = maxLogoWidth;
        let logoHeight = logoWidth / aspectRatio;

        // If height exceeds max, scale down proportionally
        if (logoHeight > maxLogoHeight) {
          logoHeight = maxLogoHeight;
          logoWidth = logoHeight * aspectRatio;
        }

        // Recalculate center position with actual width
        const actualLogoX = (pageWidth - logoWidth) / 2;

        doc.addImage(img, 'PNG', actualLogoX, yPosition, logoWidth, logoHeight);
        yPosition += logoHeight + 10;
        generatePDFContent(yPosition);
      } catch (error) {
        console.warn('Failed to add logo to PDF:', error);
        generatePDFContent(yPosition);
      }

      // Save the PDF
      const fileName = `reconciliation-report-${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);
    };

    // Handle logo loading error
    img.onerror = () => {
      console.warn('Logo failed to load, generating PDF without logo');
      generatePDFContent(yPosition);

      // Save the PDF
      const fileName = `reconciliation-report-${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);
    };
  };

  const getPriorityLevel = (count: number) => {
    if (count === 0) return 'success';
    if (count <= 10) return 'warning';
    return 'error';
  };

  const getPriorityText = (count: number) => {
    if (count === 0) return 'No Action Required';
    if (count <= 10) return 'Low Priority';
    if (count <= 50) return 'Medium Priority';
    return 'High Priority';
  };

  if (loading) {
    return (
      <div style={{ padding: "20px", textAlign: "center" }}>
        <Spin size="large" />
        <p style={{ marginTop: "16px" }}>Generating reconciliation report...</p>
      </div>
    );
  }

  return (
    <div className="dark:bg-zinc-800 dark:text-white" style={{ padding: "20px" }}>
      <PageHeader
        title="Reconciliation Reports"
        subtitle="Comprehensive overview of policy and transaction reconciliation status"
        actions={[
          <Button
            key="refresh"
            icon={<ReloadOutlined />}
            onClick={fetchReportData}
            loading={loading}
          >
            Refresh Report
          </Button>,
          <Button
            key="export"
            icon={<DownloadOutlined />}
            onClick={exportReport}
            disabled={!reportData.policyReconciliation || !reportData.easyPayStats}
          >
            Export TXT
          </Button>,
          <Button
            key="export-pdf"
            icon={<FilePdfOutlined />}
            onClick={exportToPDF}
            disabled={!reportData.policyReconciliation || !reportData.easyPayStats}
            type="primary"
          >
            Export PDF
          </Button>,
        ]}
      >
        <Row gutter={16}>
          <Col span={24}>
            <Text className="dark:text-gray-300" type="secondary">
              Last updated: {new Date(reportData.lastUpdated).toLocaleString()}
            </Text>
          </Col>
        </Row>
      </PageHeader>

      {reportData.policyReconciliation && reportData.easyPayStats && (
        <>
          {/* Policy Information Section */}
          <Card
            title="Policy Information"
            className="dark:bg-zinc-700 dark:border-zinc-600 dark:text-white"
            style={{ marginBottom: "24px" }}
          >
            <Row gutter={[16, 16]}>
              <Col span={8}>
                <Statistic
                  title={<span className="dark:text-gray-300">File Records</span>}
                  value={reportData.policyReconciliation.fileData.total}
                  valueStyle={{ color: '#1890ff' }}
                />
                <Text className="dark:text-gray-400" type="secondary">
                  Total policy records loaded from the policy file
                </Text>
                <div style={{ marginTop: "8px" }}>
                  <Tag color="success">Valid: {reportData.policyReconciliation.fileData.valid}</Tag>
                  <Tag color="error">Invalid: {reportData.policyReconciliation.fileData.invalid}</Tag>
                </div>
              </Col>
              <Col span={8}>
                <Statistic
                  title={<span className="dark:text-gray-300">Database Records</span>}
                  value={reportData.policyReconciliation.databaseData.total}
                  valueStyle={{ color: '#52c41a' }}
                />
                <Text className="dark:text-gray-400" type="secondary">
                  Total policy records in the database
                </Text>
                <div style={{ marginTop: "8px" }}>
                  <Tag color="success">With EasyPay: {reportData.policyReconciliation.databaseData.withEasyPayNumber}</Tag>
                  <Tag color="warning">Without EasyPay: {reportData.policyReconciliation.databaseData.withoutEasyPayNumber}</Tag>
                </div>
              </Col>
              <Col span={8}>
                <Statistic
                  title={<span className="dark:text-gray-300">Matches</span>}
                  value={reportData.policyReconciliation.matches.length}
                  valueStyle={{ color: '#52c41a' }}
                />
                <Text className="dark:text-gray-400" type="secondary">
                  Policy numbers that exist in both file and database with matching EasyPay numbers
                </Text>
              </Col>
            </Row>

            <Divider className="dark:border-zinc-600" />

            <Row gutter={[16, 16]}>
              <Col span={6}>
                <Statistic
                  title={<span className="dark:text-gray-300">File Only</span>}
                  value={reportData.policyReconciliation.fileOnly.length}
                  valueStyle={{ color: getPriorityLevel(reportData.policyReconciliation.fileOnly.length) === 'error' ? '#ff4d4f' : '#faad14' }}
                />
                <Text className="dark:text-gray-400" type="secondary">
                  Policy numbers in file but not in database
                </Text>
                <Tag color={getPriorityLevel(reportData.policyReconciliation.fileOnly.length)} style={{ marginTop: "8px" }}>
                  {getPriorityText(reportData.policyReconciliation.fileOnly.length)}
                </Tag>
              </Col>
              <Col span={6}>
                <Statistic
                  title={<span className="dark:text-gray-300">Database Only</span>}
                  value={reportData.policyReconciliation.databaseOnly.length}
                  valueStyle={{ color: getPriorityLevel(reportData.policyReconciliation.databaseOnly.length) === 'error' ? '#ff4d4f' : '#faad14' }}
                />
                <Text className="dark:text-gray-400" type="secondary">
                  Policy numbers in database but not in file
                </Text>
                <Tag color={getPriorityLevel(reportData.policyReconciliation.databaseOnly.length)} style={{ marginTop: "8px" }}>
                  {getPriorityText(reportData.policyReconciliation.databaseOnly.length)}
                </Tag>
              </Col>
              <Col span={6}>
                <Statistic
                  title={<span className="dark:text-gray-300">Mismatches</span>}
                  value={reportData.policyReconciliation.mismatches.length}
                  valueStyle={{ color: getPriorityLevel(reportData.policyReconciliation.mismatches.length) === 'error' ? '#ff4d4f' : '#faad14' }}
                />
                <Text className="dark:text-gray-400" type="secondary">
                  Policy numbers with different EasyPay numbers in file vs database
                </Text>
                <Tag color={getPriorityLevel(reportData.policyReconciliation.mismatches.length)} style={{ marginTop: "8px" }}>
                  {getPriorityText(reportData.policyReconciliation.mismatches.length)}
                </Tag>
              </Col>
              <Col span={6}>
                <Statistic
                  title={<span className="dark:text-gray-300">Without EasyPay</span>}
                  value={reportData.policyReconciliation.withoutEasyPay.length}
                  valueStyle={{ color: getPriorityLevel(reportData.policyReconciliation.withoutEasyPay.length) === 'error' ? '#ff4d4f' : '#faad14' }}
                />
                <Text className="dark:text-gray-400" type="secondary">
                  Database policies without EasyPay numbers
                </Text>
                <Tag color={getPriorityLevel(reportData.policyReconciliation.withoutEasyPay.length)} style={{ marginTop: "8px" }}>
                  {getPriorityText(reportData.policyReconciliation.withoutEasyPay.length)}
                </Tag>
              </Col>
            </Row>
          </Card>

          {/* EasyPay Transaction Information Section */}
          <Card
            title="EasyPay Transaction Information"
            className="dark:bg-zinc-700 dark:border-zinc-600 dark:text-white"
            style={{ marginBottom: "24px" }}
          >
            <Row gutter={[16, 16]}>
              <Col span={8}>
                <Statistic
                  title={<span className="dark:text-gray-300">Total Transactions</span>}
                  value={reportData.easyPayStats.count}
                  valueStyle={{ color: '#1890ff' }}
                />
                <Text className="dark:text-gray-400" type="secondary">
                  Total number of EasyPay transactions in the system
                </Text>
              </Col>
              <Col span={8}>
                <Statistic
                  title={<span className="dark:text-gray-300">Unique EasyPay Numbers without Policy Numbers</span>}
                  value={reportData.easyPayStats.uniqueEasyPayWithoutPolicy}
                  valueStyle={{ color: getPriorityLevel(reportData.easyPayStats.uniqueEasyPayWithoutPolicy) === 'error' ? '#ff4d4f' : '#faad14' }}
                />
                <Text className="dark:text-gray-400" type="secondary">
                  Number of unique EasyPay numbers that don't have corresponding policy numbers
                </Text>
                <Tag color={getPriorityLevel(reportData.easyPayStats.uniqueEasyPayWithoutPolicy)} style={{ marginTop: "8px" }}>
                  {getPriorityText(reportData.easyPayStats.uniqueEasyPayWithoutPolicy)}
                </Tag>
              </Col>
              <Col span={8}>
                <Statistic
                  title={<span className="dark:text-gray-300">Transactions without Policy Numbers</span>}
                  value={reportData.easyPayStats.withoutPolicy}
                  valueStyle={{ color: getPriorityLevel(reportData.easyPayStats.withoutPolicy) === 'error' ? '#ff4d4f' : '#faad14' }}
                />
                <Text className="dark:text-gray-400" type="secondary">
                  Total number of individual transactions that don't have policy numbers assigned
                </Text>
                <Tag color={getPriorityLevel(reportData.easyPayStats.withoutPolicy)} style={{ marginTop: "8px" }}>
                  {getPriorityText(reportData.easyPayStats.withoutPolicy)}
                </Tag>
              </Col>
            </Row>
          </Card>

          {/* Recommended Next Steps Section */}
          <Card
            title="Recommended Next Steps"
            className="dark:bg-zinc-700 dark:border-zinc-600 dark:text-white"
          >
            <Alert
              message="Priority Actions"
              description="Based on the current reconciliation status, here are the recommended actions in order of priority:"
              type="info"
              showIcon
              className="dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-200"
              style={{ marginBottom: "16px" }}
            />

            <List
              size="small"
              className="dark:bg-transparent"
              dataSource={[
                {
                  priority: 'High',
                  color: '#ff4d4f',
                  items: [
                    `Fix mismatched EasyPay numbers (${reportData.policyReconciliation.mismatches.length} records)`,
                    `Assign EasyPay numbers to policies without them (${reportData.policyReconciliation.withoutEasyPay.length} records)`,
                    `Match policy numbers to transactions (${reportData.easyPayStats.uniqueEasyPayWithoutPolicy} unique EasyPay numbers need matching)`
                  ]
                },
                {
                  priority: 'Medium',
                  color: '#faad14',
                  items: [
                    `Sync policy numbers for transactions (${reportData.easyPayStats.toSync} transactions ready for sync)`,
                    `Review and fix invalid file records (${reportData.policyReconciliation.fileData.invalid} records)`
                  ]
                },
                {
                  priority: 'Low',
                  color: '#52c41a',
                  items: [
                    `Review file-only policies (${reportData.policyReconciliation.fileOnly.length} records) - consider adding to database`,
                    `Review database-only policies (${reportData.policyReconciliation.databaseOnly.length} records) - consider adding to file`
                  ]
                }
              ]}
              renderItem={(priorityGroup) => (
                <List.Item className="dark:border-zinc-600">
                  <div style={{ width: '100%' }}>
                    <Title level={5} style={{ color: priorityGroup.color, marginBottom: '8px' }}>
                      {priorityGroup.priority} Priority
                    </Title>
                    <List
                      size="small"
                      className="dark:bg-transparent"
                      dataSource={priorityGroup.items}
                      renderItem={(item) => (
                        <List.Item className="dark:border-transparent" style={{ padding: '4px 0' }}>
                          <Text className="dark:text-gray-300">• {item}</Text>
                        </List.Item>
                      )}
                    />
                  </div>
                </List.Item>
              )}
            />
          </Card>
        </>
      )}
    </div>
  );
} 