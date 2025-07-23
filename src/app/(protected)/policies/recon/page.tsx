"use client";

import { DownloadOutlined, ReloadOutlined } from "@ant-design/icons";
import {
  Button,
  Col,
  Form,
  message,
  Row,
  Space,
  Spin,
  Statistic,
  Table,
  Tabs
} from "antd";
import Search from "antd/es/input/Search";
import { useEffect, useState } from "react";

import PageHeader from "@/app/components/page-header";
import { loadPolicyData, PolicyData, validatePolicyData } from "@/utils/policy-parser";

interface ComparisonData {
  fileData: { total: number; valid: number; invalid: number };
  databaseData: { total: number; withEasyPayNumber: number; withoutEasyPayNumber: number };
  matches: Array<{ policyNumber: string; easyPayNumber: string; status: string }>;
  fileOnly: Array<{ policyNumber: string; easyPayNumber: string; status: string }>;
  databaseOnly: Array<{ policyNumber: string; easyPayNumber: string; status: string }>;
  mismatches: Array<{ policyNumber: string; fileEasyPayNumber: string; dbEasyPayNumber: string; status: string }>;
  withoutEasyPay: Array<{ policyNumber: string; fullname: string; productName: string; memberID: string; status: string }>;
}

interface UnmatchedTransactionsData {
  unmatchedTransactions: {
    total: number;
    withFileMatch: number;
    withDatabaseMatch: number;
    withBothMatches: number;
    noMatch: number;
  };
  matches: Array<{
    transaction: {
      _id: string;
      uuid: string;
      date: string;
      amount: number;
      easypayNumber: string;
      description: string;
      additionalInformation: string;
    };
    matchStatus: string;
    matchedPolicy: {
      policyNumber: string;
      fullname: string | null;
      productName: string | null;
      memberID: string | null;
    } | null;
    matchSource: string | null;
  }>;
  noMatches: Array<{
    transaction: {
      _id: string;
      uuid: string;
      date: string;
      amount: number;
      easypayNumber: string;
      description: string;
      additionalInformation: string;
    };
    matchStatus: string;
    matchedPolicy: null;
    matchSource: null;
  }>;
  allResults: Array<any>;
  pagination?: {
    current: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export default function PolicyReconciliationPage() {
  const [policyData, setPolicyData] = useState<PolicyData[]>([]);
  const [filteredData, setFilteredData] = useState<PolicyData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<{
    total: number;
    valid: number;
    invalid: number
  }>({ total: 0, valid: 0, invalid: 0 });
  const [comparisonData, setComparisonData] = useState<ComparisonData | null>(null);
  const [comparisonLoading, setComparisonLoading] = useState<boolean>(false);
  const [unmatchedTransactionsData, setUnmatchedTransactionsData] = useState<UnmatchedTransactionsData | null>(null);
  const [unmatchedLoading, setUnmatchedLoading] = useState<boolean>(false);
  const [updatingTransactions, setUpdatingTransactions] = useState<boolean>(false);
  const [unmatchedPagination, setUnmatchedPagination] = useState({
    current: 1,
    pageSize: 50
  });

  const fetchPolicyData = async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await loadPolicyData();
      setPolicyData(data);
      setFilteredData(data);

      // Calculate statistics
      let valid = 0;
      let invalid = 0;

      data.forEach(item => {
        if (validatePolicyData(item)) {
          valid++;
        } else {
          invalid++;
        }
      });

      setStats({
        total: data.length,
        valid,
        invalid
      });
    } catch (err) {
      console.error('Error loading policy data:', err);
      setError("Failed to load policy data. Please try again.");
      message.error("Failed to load policy data");
    } finally {
      setLoading(false);
    }
  };

  const searchPolicyData = (value: string) => {
    if (!value.trim()) {
      setFilteredData(policyData);
      return;
    }

    const filtered = policyData.filter(item =>
      item.policyNumber.toLowerCase().includes(value.toLowerCase()) ||
      item.easyPayNumber.includes(value)
    );
    setFilteredData(filtered);
  };

  const fetchComparisonData = async () => {
    try {
      setComparisonLoading(true);
      const response = await fetch('/api/policies/reconciliation');

      if (!response.ok) {
        const errorData = await response.json();
        message.error(errorData.message || 'Failed to fetch comparison data');
        return;
      }

      const data = await response.json();
      if (data.success) {
        setComparisonData(data.data);
        message.success('Comparison data loaded successfully');
      } else {
        message.error('Failed to load comparison data');
      }
    } catch (err) {
      console.error('Error fetching comparison data:', err);
      message.error('Failed to fetch comparison data');
    } finally {
      setComparisonLoading(false);
    }
  };

  const fetchUnmatchedTransactions = async (page = 1, pageSize = 50) => {
    try {
      setUnmatchedLoading(true);
      const response = await fetch(`/api/policies/reconciliation/unmatched-transactions?page=${page}&pageSize=${pageSize}`);

      if (!response.ok) {
        const errorData = await response.json();
        message.error(errorData.message || 'Failed to fetch unmatched transactions');
        return;
      }

      const data = await response.json();
      if (data.success) {
        setUnmatchedTransactionsData(data.data);
        setUnmatchedPagination({
          current: page,
          pageSize: pageSize
        });
        message.success('Unmatched transactions loaded successfully');
      } else {
        message.error('Failed to load unmatched transactions');
      }
    } catch (err) {
      console.error('Error fetching unmatched transactions:', err);
      message.error('Failed to fetch unmatched transactions');
    } finally {
      setUnmatchedLoading(false);
    }
  };

  const updateMatchedTransactions = async () => {
    if (!unmatchedTransactionsData || unmatchedTransactionsData.matches.length === 0) {
      message.warning('No matched transactions to update');
      return;
    }

    try {
      setUpdatingTransactions(true);

      // Prepare the transactions to update
      const transactionsToUpdate = unmatchedTransactionsData.matches
        .filter(match => match.matchedPolicy) // Only update if we have a matched policy
        .map(match => ({
          transactionId: match.transaction._id,
          policyNumber: match.matchedPolicy!.policyNumber
        }));

      if (transactionsToUpdate.length === 0) {
        message.warning('No valid matches found to update');
        return;
      }

      const response = await fetch('/api/transactions/easypay/update-policy-numbers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ transactions: transactionsToUpdate }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        message.error(errorData.message || 'Failed to update transactions');
        return;
      }

      const data = await response.json();
      if (data.success) {
        message.success(data.message);
        // Refresh the unmatched transactions data
        await fetchUnmatchedTransactions();
      } else {
        message.error('Failed to update transactions');
      }
    } catch (err) {
      console.error('Error updating transactions:', err);
      message.error('Failed to update transactions');
    } finally {
      setUpdatingTransactions(false);
    }
  };

  const exportToCSV = () => {
    try {
      const csvContent = [
        'Policy Number,EasyPay Number,Status',
        ...filteredData.map(item => {
          const status = validatePolicyData(item) ? 'Valid' : 'Invalid';
          return `${item.policyNumber},${item.easyPayNumber},${status}`;
        })
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `policy-reconciliation-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);

      message.success('CSV exported successfully');
    } catch (err) {
      console.error('Error exporting CSV:', err);
      message.error('Failed to export CSV');
    }
  };

  useEffect(() => {
    fetchPolicyData();
  }, []);

  if (loading) {
    return (
      <div
        className="h-[80vh]"
        style={{ padding: "20px", textAlign: "center" }}
      >
        <Spin size="large" />
        <p style={{ marginTop: "16px" }}>Loading policy reconciliation data...</p>
      </div>
    );
  }

  const renderFileDataTab = () => (
    <div>
      {error && (
        <div style={{ color: "red", marginBottom: "20px", padding: "12px", backgroundColor: "#fff2f0", border: "1px solid #ffccc7", borderRadius: "6px" }}>
          {error}
        </div>
      )}

      <Form layout="vertical" style={{ width: "100%" }}>
        <Form.Item>
          <p>Search Policy Data</p>
          <Search
            allowClear
            placeholder="Search by Policy Number or EasyPay Number..."
            onSearch={searchPolicyData}
            onChange={(e) => {
              if (!e.target.value) {
                setFilteredData(policyData);
              }
            }}
          />
        </Form.Item>
      </Form>

      <Table
        rowKey={(record) => `${record.policyNumber}-${record.easyPayNumber}`}
        bordered
        dataSource={filteredData}
        pagination={{
          pageSize: 20,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total, range) =>
            `${range[0]}-${range[1]} of ${total} items`,
        }}
        columns={[
          {
            title: "Policy Number",
            dataIndex: "policyNumber",
            key: "policyNumber",
            width: 150,
            render: (text) => (
              <span style={{ fontFamily: 'monospace', fontWeight: 'bold' }}>
                {text}
              </span>
            ),
          },
          {
            title: "EasyPay Number",
            dataIndex: "easyPayNumber",
            key: "easyPayNumber",
            width: 200,
            render: (text) => (
              <span style={{ fontFamily: 'monospace' }}>
                {text}
              </span>
            ),
          },
          {
            title: "Status",
            key: "status",
            width: 100,
            render: (_, record) => {
              const isValid = validatePolicyData(record);
              return (
                <span
                  style={{
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    backgroundColor: isValid ? '#f6ffed' : '#fff2f0',
                    color: isValid ? '#52c41a' : '#ff4d4f',
                    border: `1px solid ${isValid ? '#b7eb8f' : '#ffccc7'}`,
                  }}
                >
                  {isValid ? '✅ Valid' : '❌ Invalid'}
                </span>
              );
            },
          },
          {
            title: "Validation Details",
            key: "validationDetails",
            render: (_, record) => {
              const isValid = validatePolicyData(record);
              if (isValid) {
                return (
                  <span style={{ color: '#52c41a', fontSize: '12px' }}>
                    ✓ All checks passed
                  </span>
                );
              }

              const issues = [];
              if (!record.easyPayNumber.startsWith('9225')) {
                issues.push('Does not start with 9225');
              }
              if (record.easyPayNumber.length !== 18) {
                issues.push('Not 18 digits');
              }
              if (!/^\d{18}$/.test(record.easyPayNumber)) {
                issues.push('Contains non-numeric characters');
              }

              return (
                <span style={{ color: '#ff4d4f', fontSize: '12px' }}>
                  {issues.join(', ')}
                </span>
              );
            },
          },
        ]}
      />
    </div>
  );

  const renderComparisonTab = () => (
    <div>
      <div style={{ marginBottom: "20px" }}>
        <Button
          type="primary"
          onClick={fetchComparisonData}
          loading={comparisonLoading}
          icon={<ReloadOutlined />}
        >
          {comparisonData ? 'Refresh Comparison' : 'Load Comparison'}
        </Button>
      </div>

      {comparisonLoading && (
        <div style={{ textAlign: "center", padding: "40px" }}>
          <Spin size="large" />
          <p style={{ marginTop: "16px" }}>Comparing file data with database...</p>
        </div>
      )}

      {comparisonData && (
        <div>
          {/* Summary Statistics */}
          <Row gutter={16} style={{ marginBottom: "24px" }}>
            <Col span={6}>
              <Statistic
                title="File Records"
                value={comparisonData.fileData.total}
                valueStyle={{ color: '#1890ff' }}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="Database Records"
                value={comparisonData.databaseData.total}
                valueStyle={{ color: '#52c41a' }}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="Matches"
                value={comparisonData.matches.length}
                valueStyle={{ color: '#52c41a' }}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="Mismatches"
                value={comparisonData.mismatches.length}
                valueStyle={{ color: '#ff4d4f' }}
              />
            </Col>
          </Row>

          <Row gutter={16} style={{ marginBottom: "24px" }}>
            <Col span={8}>
              <Statistic
                title="File Only"
                value={comparisonData.fileOnly.length}
                valueStyle={{ color: '#faad14' }}
              />
            </Col>
            <Col span={8}>
              <Statistic
                title="Database Only"
                value={comparisonData.databaseOnly.length}
                valueStyle={{ color: '#722ed1' }}
              />
            </Col>
            <Col span={8}>
              <Statistic
                title="Database with EasyPay"
                value={comparisonData.databaseData.withEasyPayNumber}
                valueStyle={{ color: '#13c2c2' }}
              />
            </Col>
          </Row>

          {/* Tabs for different comparison results */}
          <Tabs
            items={[
              {
                key: 'matches',
                label: `Matches (${comparisonData.matches.length})`,
                children: (
                  <Table
                    dataSource={comparisonData.matches}
                    columns={[
                      { title: 'Policy Number', dataIndex: 'policyNumber', key: 'policyNumber' },
                      { title: 'EasyPay Number', dataIndex: 'easyPayNumber', key: 'easyPayNumber' },
                    ]}
                    pagination={{ pageSize: 10 }}
                  />
                )
              },
              {
                key: 'mismatches',
                label: `Mismatches (${comparisonData.mismatches.length})`,
                children: (
                  <Table
                    dataSource={comparisonData.mismatches}
                    columns={[
                      { title: 'Policy Number', dataIndex: 'policyNumber', key: 'policyNumber' },
                      { title: 'File EasyPay', dataIndex: 'fileEasyPayNumber', key: 'fileEasyPayNumber' },
                      { title: 'Database EasyPay', dataIndex: 'dbEasyPayNumber', key: 'dbEasyPayNumber' },
                    ]}
                    pagination={{ pageSize: 10 }}
                  />
                )
              },
              {
                key: 'fileOnly',
                label: `File Only (${comparisonData.fileOnly.length})`,
                children: (
                  <Table
                    dataSource={comparisonData.fileOnly}
                    columns={[
                      { title: 'Policy Number', dataIndex: 'policyNumber', key: 'policyNumber' },
                      { title: 'EasyPay Number', dataIndex: 'easyPayNumber', key: 'easyPayNumber' },
                    ]}
                    pagination={{ pageSize: 10 }}
                  />
                )
              },
              {
                key: 'databaseOnly',
                label: `Database Only (${comparisonData.databaseOnly.length})`,
                children: (
                  <Table
                    dataSource={comparisonData.databaseOnly}
                    columns={[
                      { title: 'Policy Number', dataIndex: 'policyNumber', key: 'policyNumber' },
                      { title: 'EasyPay Number', dataIndex: 'easyPayNumber', key: 'easyPayNumber' },
                    ]}
                    pagination={{ pageSize: 10 }}
                  />
                )
              },
              {
                key: 'withoutEasyPay',
                label: `Without EasyPay (${comparisonData.withoutEasyPay.length})`,
                children: (
                  <Table
                    dataSource={comparisonData.withoutEasyPay}
                    columns={[
                      { title: 'Policy Number', dataIndex: 'policyNumber', key: 'policyNumber' },
                      { title: 'Member ID', dataIndex: 'memberId', key: 'memberId' },
                      { title: 'Full Name', dataIndex: 'fullname', key: 'fullname' },
                      { title: 'Product Name', dataIndex: 'productName', key: 'productName' },
                    ]}
                    pagination={{ pageSize: 10 }}
                  />
                )
              }
            ]}
          />
        </div>
      )}
    </div>
  );

  const renderUnmatchedTransactionsTab = () => (
    <div>
      <div style={{ marginBottom: "20px" }}>
        <Space>
          <Button
            type="primary"
            onClick={() => fetchUnmatchedTransactions()}
            loading={unmatchedLoading}
            icon={<ReloadOutlined />}
          >
            {unmatchedTransactionsData ? 'Refresh Unmatched' : 'Load Unmatched Transactions'}
          </Button>
          {unmatchedTransactionsData && unmatchedTransactionsData.matches.length > 0 && (
            <Button
              type="default"
              onClick={updateMatchedTransactions}
              loading={updatingTransactions}
              style={{ backgroundColor: '#52c41a', color: 'white', borderColor: '#52c41a' }}
            >
              {updatingTransactions ? 'Updating...' : `Update ${unmatchedTransactionsData.matches.length} Matched Transactions`}
            </Button>
          )}
        </Space>
      </div>

      {unmatchedLoading && (
        <div style={{ textAlign: "center", padding: "40px" }}>
          <Spin size="large" />
          <p style={{ marginTop: "16px" }}>Finding unmatched transactions...</p>
        </div>
      )}

      {unmatchedTransactionsData && (
        <div>
          {/* Summary Statistics */}
          <Row gutter={16} style={{ marginBottom: "24px" }}>
            <Col span={6}>
              <Statistic
                title="Transactions to Match"
                value={unmatchedTransactionsData.unmatchedTransactions.total}
                valueStyle={{ color: '#1890ff' }}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="File Matches"
                value={unmatchedTransactionsData.unmatchedTransactions.withFileMatch}
                valueStyle={{ color: '#52c41a' }}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="Database Matches"
                value={unmatchedTransactionsData.unmatchedTransactions.withDatabaseMatch}
                valueStyle={{ color: '#13c2c2' }}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="No Matches"
                value={unmatchedTransactionsData.unmatchedTransactions.noMatch}
                valueStyle={{ color: '#ff4d4f' }}
              />
            </Col>
          </Row>

          <Row gutter={16} style={{ marginBottom: "24px" }}>
            <Col span={12}>
              <Statistic
                title="Both Matches"
                value={unmatchedTransactionsData.unmatchedTransactions.withBothMatches}
                valueStyle={{ color: '#722ed1' }}
              />
            </Col>
            <Col span={12}>
              <Statistic
                title="Total Matches"
                value={unmatchedTransactionsData.matches.length}
                valueStyle={{ color: '#52c41a' }}
              />
            </Col>
          </Row>

          {/* Tabs for different match results */}
          <Tabs
            items={[
              {
                key: 'allMatches',
                label: `All Matches (${unmatchedTransactionsData.matches.length})`,
                children: (
                  <Table
                    dataSource={unmatchedTransactionsData.matches}
                    columns={[
                      {
                        title: 'Transaction Date',
                        dataIndex: ['transaction', 'date'],
                        key: 'date'
                      },
                      {
                        title: 'EasyPay Number',
                        dataIndex: ['transaction', 'easypayNumber'],
                        key: 'easypayNumber'
                      },
                      {
                        title: 'Amount',
                        dataIndex: ['transaction', 'amount'],
                        key: 'amount',
                        render: (value: number) => `R${value.toFixed(2)}`
                      },
                      {
                        title: 'Matched Policy',
                        dataIndex: ['matchedPolicy', 'policyNumber'],
                        key: 'matchedPolicyNumber'
                      },
                      {
                        title: 'Member Name',
                        dataIndex: ['matchedPolicy', 'fullname'],
                        key: 'matchedPolicyName'
                      },
                      {
                        title: 'Match Source',
                        dataIndex: 'matchSource',
                        key: 'matchSource',
                        render: (source: string) => {
                          const colors = {
                            'file_only': '#faad14',
                            'database_only': '#13c2c2',
                            'file_and_database': '#722ed1'
                          };
                          return (
                            <span style={{
                              color: colors[source as keyof typeof colors] || '#666',
                              fontWeight: 'bold'
                            }}>
                              {source?.replace('_', ' ').toUpperCase()}
                            </span>
                          );
                        }
                      }
                    ]}
                    pagination={{
                      current: unmatchedPagination.current,
                      pageSize: unmatchedPagination.pageSize,
                      total: unmatchedTransactionsData.pagination?.total || 0,
                      showSizeChanger: true,
                      showQuickJumper: true,
                      showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`,
                      onChange: (page, pageSize) => {
                        fetchUnmatchedTransactions(page, pageSize);
                      }
                    }}
                  />
                )
              },
              {
                key: 'noMatches',
                label: `No Matches (${unmatchedTransactionsData.noMatches.length})`,
                children: (
                  <Table
                    dataSource={unmatchedTransactionsData.noMatches}
                    columns={[
                      {
                        title: 'Transaction Date',
                        dataIndex: ['transaction', 'date'],
                        key: 'date'
                      },
                      {
                        title: 'EasyPay Number',
                        dataIndex: ['transaction', 'easypayNumber'],
                        key: 'easypayNumber'
                      },
                      {
                        title: 'Amount',
                        dataIndex: ['transaction', 'amount'],
                        key: 'amount',
                        render: (value: number) => `R${value.toFixed(2)}`
                      },
                      {
                        title: 'Description',
                        dataIndex: ['transaction', 'description'],
                        key: 'description'
                      },
                      {
                        title: 'File ID',
                        dataIndex: ['transaction', 'uuid'],
                        key: 'uuid'
                      }
                    ]}
                    pagination={{
                      current: unmatchedPagination.current,
                      pageSize: unmatchedPagination.pageSize,
                      total: unmatchedTransactionsData.pagination?.total || 0,
                      showSizeChanger: true,
                      showQuickJumper: true,
                      showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`,
                      onChange: (page, pageSize) => {
                        fetchUnmatchedTransactions(page, pageSize);
                      }
                    }}
                  />
                )
              }
            ]}
          />
        </div>
      )}
    </div>
  );

  return (
    <div style={{ padding: "20px" }}>
      <PageHeader
        title="Policy Reconciliation"
        subtitle="Review and validate policy numbers with their corresponding EasyPay numbers"
        actions={[
          <Button
            key="refresh"
            icon={<ReloadOutlined />}
            onClick={fetchPolicyData}
            loading={loading}
          >
            Refresh
          </Button>,
          <Button
            key="export"
            type="primary"
            icon={<DownloadOutlined />}
            onClick={exportToCSV}
            disabled={filteredData.length === 0}
          >
            Export CSV
          </Button>
        ]}
      >
        <Row gutter={16}>
          <Col span={8}>
            <Statistic
              title="Total Records"
              value={stats.total}
              valueStyle={{ color: '#1890ff' }}
            />
          </Col>
          <Col span={8}>
            <Statistic
              title="Valid Records"
              value={stats.valid}
              valueStyle={{ color: '#52c41a' }}
            />
          </Col>
          <Col span={8}>
            <Statistic
              title="Invalid Records"
              value={stats.invalid}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Col>
        </Row>
      </PageHeader>

      <Tabs
        defaultActiveKey="file"
        items={[
          {
            key: 'file',
            label: 'File Data',
            children: renderFileDataTab()
          },
          {
            key: 'comparison',
            label: 'Database Comparison',
            children: renderComparisonTab()
          },
          {
            key: 'unmatched',
            label: 'Unmatched Transactions',
            children: renderUnmatchedTransactionsTab()
          }
        ]}
      />
    </div>
  );
}
