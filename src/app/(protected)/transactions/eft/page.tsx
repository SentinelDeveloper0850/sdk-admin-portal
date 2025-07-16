"use client";

import { useEffect, useState } from "react";

import {
  Alert,
  Button,
  Col,
  Divider,
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
import Papa from "papaparse";

import { formatToMoneyWithCurrency, formatUCTtoISO } from "@/utils/formatters";

import { BankStatementExcelImporter } from "@/app/components/import-tools/bank-statement-xlsx-importer";
import { TransactionHistoryCsvImporter } from "@/app/components/import-tools/transaction-history-csv-importer";
import PageHeader from "@/app/components/page-header";
import { useAuth } from "@/context/auth-context";
import EftPdfImporter from "@/app/components/import-tools/transaction-history-pdf-importer";

export interface IEftTransaction {
  _id: string;
  uuid: string;
  name: string;
  description: string;
  additionalInformation: string;
  amount: number;
  date: string;
  created_at: string;
}

export interface IEftImportData {
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
  const [error, setError] = useState<string | boolean>(false);

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

  const fileChangeHandler = async (event: any) => {
    parseFiles(event.target.files);
  };

  const parseFiles = (files: any) => {
    const importBatch: any[] = [];

    let statementMonth: any = null;
    let uuid: any = null;

    Promise.all(
      [...files].map(
        (file) =>
          new Promise((resolve, reject) =>
            Papa.parse(file, {
              skipEmptyLines: true,
              complete: function (results: any) {
                const data = results.data;

                const labelsToIgnore = [
                  "ACCOUNT TRANSACTION HISTORY",
                  "Name:",
                  "Account:",
                  "Balance:",
                  "Date",
                ];

                const records: any[] = data.filter(
                  (item: any[]) => !labelsToIgnore.includes(item[0])
                );

                const statementDate = records[0][0];
                const _uuid = statementDate;

                const _transactions: any[] = [];

                records.map((item) => {
                  if (!item[1].trim().includes("-")) {
                    const _amountString = item[1] as string;
                    const _amount = _amountString
                      .replace(",", "")
                      .replace(",", "");
                    _transactions.push({
                      date: item[0],
                      amount: _amount.trim(),
                      description: item[3],
                      uuid: _uuid,
                    });
                  }
                });

                const _numberOfTransactions = _transactions.length;

                let payload = {
                  statementMonth: _uuid,
                  transactions: _transactions,
                  uuid: _uuid,
                  importData: {
                    uuid: _uuid,
                    date: statementDate,
                    numberOfTransactions: _numberOfTransactions,
                    createdBy: user?.name ?? "--",
                    created_at: new Date(),
                  },
                };

                if (_transactions) {
                  resolve(payload);
                }
              }, // Resolve each promise
              error: reject,
            })
          )
      )
    )
      .then((results: any[]) => {
        results.forEach((result, index) => {
          importBatch.push(result);
        });
        console.log("importBatch[0]", importBatch[0]);
        console.log("results[0]", results[0]);
        bulkCreateTransactions({
          ...results[0],
          source: "Transaction History",
        }); // now since .then() excutes after all promises are resolved, filesData contains all the parsed files.
      })
      .catch((err) => console.error("Something went wrong:", err));
  };

  const bulkCreateTransactions = async (payload: any) => {
    try {
      const response = await fetch("/api/transactions/eft", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })
        .then((response) => {
          console.log("response", response);
          if (response.status !== 200) {
            setError(
              "Internal Server Error - Something went wrong while attempting to bulk create transactions"
            );
          }
        })
        .catch((error) => {
          console.error("Error:", error);
          setError("An error occurred while bulk creating transactions.");
        });

      // console.log("response", response);

      // if (!response.ok) {
      //   const errorData = await response.json();
      //   setError(errorData.message || "Failed to bulk create transactions");
      //   return;
      // }

      console.log("bulkCreateTransactions response", response);
    } catch (err) {
      console.log("Caught error on bulkCreateTransactions", err);
      setError("An error occurred while bulk creating transactions.");
    }
  };

  if (loading) {
    return (
      <div
        className="h-[80vh]"
        style={{ padding: "20px", textAlign: "center" }}
      >
        <Spin size="large" />
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
                <BankStatementExcelImporter />
                <TransactionHistoryCsvImporter
                  handleChange={fileChangeHandler}
                  allowMultiple
                  label="Import Transaction History (CSV)"
                />
              </Space>
            )}
          </Col>
        </Row>
      </PageHeader>
      {error && (
        <Alert
          showIcon
          type="error"
          message={error}
          closable
          onClose={() => setError(false)}
        />
      )}
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

      <Divider/>
      <EftPdfImporter />
      <Divider/>

      <Table
        rowKey="_id"
        bordered
        dataSource={transactions}
        rowClassName="cursor-pointer hover:bg-gray-100"
        columns={[
          {
            title: "Transaction Date",
            dataIndex: "date",
            key: "date",
            sorter: (a, b) =>
              new Date(a.date).getTime() - new Date(b.date).getTime(),
          },
          {
            title: "File ID",
            dataIndex: "uuid",
            key: "uuid",
          },
          {
            title: "Description",
            dataIndex: "description",
            key: "description",
            sorter: (a, b) => a.description.localeCompare(b.description),
          },
          {
            title: "Additional Information",
            dataIndex: "additionalInformation",
            key: "additionalInformation",
            sorter: (a, b) =>
              a.additionalInformation.localeCompare(b.additionalInformation),
          },
          {
            title: "Amount",
            dataIndex: "amount",
            key: "amount",
            render: (value: number) => formatToMoneyWithCurrency(value),
            sorter: (a, b) => a.amount - b.amount,
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
