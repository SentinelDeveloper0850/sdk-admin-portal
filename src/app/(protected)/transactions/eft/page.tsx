"use client";

import { useEffect, useState } from "react";

import {
  Button,
  Col,
  Drawer,
  Form,
  List,
  Row,
  Select,
  Space,
  Spin,
  Statistic,
  Table,
  notification,
} from "antd";
import Search from "antd/es/input/Search";

import { formatToMoneyWithCurrency, formatUCTtoISO } from "@/utils/formatters";

import { ExcelImportTool } from "@/app/components/excel-import-tool";
import PageHeader from "@/app/components/page-header";
import { useAuth } from "@/context/auth-context";

interface IEftTransaction {
  _id: string;
  uuid: string;
  name: string;
  description: string;
  additionalInformation: string;
  amount: number;
  date: string;
  created_at: string;
}

interface IEftImportData {
  _id: string;
  uuid: string;
  date: string;
  numberOfTransactions: number;
  createdBy: string;
  created_at: Date;
}

export default function EftTransactionsPage() {
  const [transactions, setTransactions] = useState<IEftTransaction[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [stats, setStats] = useState<{ count: number }>({ count: 0 });

  const [imports, setImports] = useState<IEftImportData[]>([]);
  const [showHistoryDrawer, setShowHistoryDrawer] = useState<boolean>(false);

  const [search, setSearch] = useState("");
  const [amountFilterType, setAmountFilterType] = useState("=");
  const [amount, setAmount] = useState<number | string>("");

  const { user } = useAuth();

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/transactions/eft");
      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.message || "Failed to fetch transactions");
        return;
      }

      const data = await response.json();
      setTransactions(data.transactions);
      setStats({ count: data.count });
    } catch (err) {
      console.log(err);
      setError("An error occurred while fetching transactions.");
    } finally {
      setLoading(false);
    }
  };

  const fetchImportHistory = async () => {
    try {
      const response = await fetch("/api/transactions/eft/import-history");
      if (!response.ok) {
        const errorData = await response.json();
        notification.error({
          message: errorData.message || "Failed to fetch import history",
        });
        return;
      }

      const data: IEftImportData[] = await response.json();
      setImports(data);
    } catch (err) {
      console.log(err);
      notification.error({
        message: "An error occurred while fetching import history.",
      });
    }
  };

  const searchTransactions = async (value: string) => {
    try {
      const response = await fetch("/api/transactions/eft/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ searchText: value, searchType: "text" }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.message || "Failed to search transactions");
        return;
      }

      const data = await response.json();
      setTransactions(data);
    } catch (err) {
      console.log(err);
      setError("An error occurred while searching transactions.");
    }
  };

  const searchByAmount = async ({ amount, filterType }: any) => {
    try {
      const response = await fetch("/api/transactions/eft/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: amount,
          filterType: filterType,
          searchType: "amount",
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.message || "Failed to search transactions");
        return;
      }

      const data = await response.json();
      setTransactions(data);
    } catch (err) {
      console.log(err);
      setError("An error occurred while searching transactions.");
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  if (loading) {
    return (
      <div style={{ padding: "20px", textAlign: "center" }}>
        <Spin size="large" />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: "20px", textAlign: "center" }}>
        <h1>{error}</h1>
      </div>
    );
  }

  return (
    <div style={{ padding: "20px" }}>
      <PageHeader
        title="EFT Transactions"
        actions={[
          <Space>
            <Button
              onClick={async () => {
                await fetchImportHistory();
                setShowHistoryDrawer(true);
              }}
            >
              Import History
            </Button>
          </Space>,
        ]}
      >
        <Row gutter={16}>
          <Col
            span={12}
            style={{ display: "flex", justifyContent: "flex-start" }}
          >
            <Space size={32}>
              <Statistic title="Total Transactions" value={stats.count} />
              <Statistic
                title="Selected Transactions"
                value={transactions?.length || 0}
              />
            </Space>
          </Col>
          <Col
            span={12}
            style={{ display: "flex", justifyContent: "flex-end" }}
          >
            {user?.role == "admin" && (
              <Space>
                <ExcelImportTool />
              </Space>
            )}
          </Col>
        </Row>
      </PageHeader>

      <Form
        layout="vertical"
        style={{
          width: "100%",
          borderBottom: "1px solid #ddd",
          padding: "2rem 1rem 3rem 1rem",
        }}
      >
        <Space
          size={32}
          wrap
          style={{
            display: "flex",
            justifyContent: "flex-start",
            paddingBottom: "0",
            width: "100%",
          }}
        >
          <Form.Item style={{ marginBottom: "0" }}>
            <p
              style={{
                marginBottom: ".5rem",
                textTransform: "uppercase",
                letterSpacing: ".2rem",
              }}
            >
              Search for reference
            </p>
            <Search
              allowClear
              value={search}
              placeholder="Search Text..."
              onChange={(event: any) => setSearch(event.target.value)}
              onSearch={(value: string) => {
                if (value.length > 0) {
                  searchTransactions(value);
                } else {
                  setTransactions([]);
                }
              }}
            />
          </Form.Item>
          <Form.Item style={{ marginBottom: "0" }}>
            <p
              style={{
                marginBottom: ".5rem",
                textTransform: "uppercase",
                letterSpacing: ".2rem",
              }}
            >
              Search for Amount
            </p>
            <Space>
              <Search
                allowClear
                defaultValue={""}
                value={amount}
                placeholder="1000"
                onChange={(event: any) =>
                  event.target.value === ""
                    ? setAmount("")
                    : setAmount(Number(event.target.value))
                }
                addonBefore={
                  <Select
                    value={amountFilterType}
                    onChange={(value: string) => setAmountFilterType(value)}
                    suffixIcon={null}
                    defaultValue={"="}
                    style={{ width: "6rem" }}
                  >
                    <Select.Option value={"="}>=</Select.Option>
                    <Select.Option value={">"}>&gt;</Select.Option>
                    <Select.Option value={"<"}>&lt;</Select.Option>
                  </Select>
                }
                onSearch={async (value: string) => {
                  if (value.length > 0) {
                    searchByAmount({
                      amount: amount,
                      filterType: amountFilterType,
                    });
                  } else {
                    setTransactions([]);
                  }
                }}
              />
            </Space>
          </Form.Item>
          {/* {isAdmin && transactions.length > 0 && (
            <Form.Item style={{ marginBottom: "0", marginTop: "2.5rem" }}>
              <Space>
                <Button
                  loading={status === "Deleting selected transactions"}
                  onClick={showDeleteConfirm}
                  danger
                >
                  <DeleteOutlined /> Permanently Delete Selected
                </Button>
              </Space>
            </Form.Item>
          )} */}
        </Space>
      </Form>
      <Table
        rowKey="_id"
        bordered
        dataSource={transactions}
        rowClassName="cursor-pointer hover:bg-gray-100"
        columns={[
          {
            title: "File ID",
            dataIndex: "uuid",
            key: "uuid",
          },
          {
            title: "Description",
            dataIndex: "description",
            key: "description",
          },
          {
            title: "Additional Information",
            dataIndex: "additionalInformation",
            key: "additionalInformation",
          },
          {
            title: "Amount",
            dataIndex: "amount",
            key: "amount",
            render: (value: number) => formatToMoneyWithCurrency(value),
            sorter: (a, b) => a.amount - b.amount,
          },
          {
            title: "Transaction Date",
            dataIndex: "date",
            key: "date",
            sorter: (a, b) =>
              new Date(a.date).getTime() - new Date(b.date).getTime(),
          },
        ]}
      />
      <Drawer
        title="EFT Import History"
        placement="right"
        closable={true}
        onClose={() => setShowHistoryDrawer(false)}
        open={showHistoryDrawer}
      >
        <List
          itemLayout="horizontal"
          dataSource={imports}
          renderItem={(item: IEftImportData) => (
            <List.Item extra={[]}>
              <List.Item.Meta
                title={`Import ${item.uuid}`}
                description={
                  <>
                    <small style={{ display: "block" }}>
                      {item.numberOfTransactions} Transactions
                    </small>
                    <small style={{ display: "block" }}>
                      Imported by {item.createdBy} on{" "}
                      {formatUCTtoISO(item.date)}
                    </small>
                  </>
                }
              />
            </List.Item>
          )}
        />
      </Drawer>
    </div>
  );
}
