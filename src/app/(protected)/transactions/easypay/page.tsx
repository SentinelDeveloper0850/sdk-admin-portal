"use client";

import { useEffect, useState } from "react";

import { EyeOutlined } from "@ant-design/icons";
import {
  Button,
  Col,
  DatePicker,
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
import { Dayjs } from "dayjs";
import { saveAs } from "file-saver";
import { EyeClosed } from "lucide-react";
import Papa from "papaparse";
import sweetAlert from "sweetalert";

import { formatToMoneyWithCurrency, formatUCTtoISO } from "@/utils/formatters";

import { EasypayCsvImporter } from "@/app/components/import-tools/easypay-csv-importer";
import PageHeader from "@/app/components/page-header";
import { IEasypayImport } from "@/app/interfaces/easypay-import.interface";
import { useAuth } from "@/context/auth-context";
import { syncPolicyNumbers } from "@/server/actions/easypay-transactions";

interface IEasypayTransaction {
  _id: string;
  uuid: string;
  name: string;
  description: string;
  additionalInformation: string;
  amount: number;
  date: string;
  created_at: string;
}

interface IEasypayImportData {
  _id: string;
  uuid: string;
  date: string;
  numberOfTransactions: number;
  createdBy: string;
  created_at: Date;
}

export default function EasypayTransactionsPage() {
  const [transactions, setTransactions] = useState<IEasypayTransaction[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [showToSync, setShowToSync] = useState<boolean>(false);
  const [syncing, setSyncing] = useState<boolean>(false);
  const [syncError, setSyncError] = useState<string | null>(null);

  const [stats, setStats] = useState<{ count: number; toSync: number }>({
    count: 0,
    toSync: 0,
  });

  const [imports, setImports] = useState<IEasypayImportData[]>([]);
  const [showHistoryDrawer, setShowHistoryDrawer] = useState<boolean>(false);

  const [search, setSearch] = useState("");
  const [amountFilterType, setAmountFilterType] = useState("=");
  const [amount, setAmount] = useState<number | string>("");

  const { user } = useAuth();

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/transactions/easypay");
      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.message || "Failed to fetch transactions");
        return;
      }

      const data = await response.json();
      setTransactions(data.transactions);
      setStats({ count: data.count, toSync: data.toSync });
      setShowToSync(false);
    } catch (err) {
      console.log(err);
      setError("An error occurred while fetching transactions.");
    } finally {
      setLoading(false);
    }
  };

  const fetchTransactionsToSync = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/transactions/easypay/sync");
      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.message || "Failed to fetch transactions to sync");
        return;
      }

      const data = await response.json();
      setTransactions(data.transactions);
      setStats({ count: data.count, toSync: data.toSync });
      setShowToSync(true);
    } catch (err) {
      console.log(err);
      setError("An error occurred while fetching transactions to sync.");
    } finally {
      setLoading(false);
    }
  };

  const fetchImportHistory = async () => {
    try {
      const response = await fetch("/api/transactions/easypay/import-history");
      if (!response.ok) {
        const errorData = await response.json();
        notification.error({
          message: errorData.message || "Failed to fetch import history",
        });
        return;
      }

      const data: IEasypayImportData[] = await response.json();
      setImports(data);
    } catch (err) {
      console.log(err);
      notification.error({
        message: "An error occurred while fetching import history.",
      });
    }
  };

  const searchTransactions = async (value: string) => {
    setLoading(true);
    try {
      const response = await fetch("/api/transactions/easypay/search", {
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
    } finally {
      setLoading(false);
    }
  };

  const searchByAmount = async ({ amount, filterType }: any) => {
    setLoading(true);
    try {
      const response = await fetch("/api/transactions/easypay/search", {
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
    } finally {
      setLoading(false);
    }
  };

  const searchByDate = async ({
    date,
    dateString,
  }: {
    date: Dayjs;
    dateString: string | string[];
  }) => {
    try {
      setLoading(true);
      const formattedDate = (dateString as String).replaceAll("-", "/");

      if (formattedDate) {
        const response = await fetch("/api/transactions/easypay/search", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            date: formattedDate,
            searchType: "date",
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          setError(errorData.message || "Failed to search transactions");
          return;
        }

        const data = await response.json();
        setTransactions(data);
      }
    } catch (err) {
      console.log(err);
      setError("An error occurred while searching transactions.");
    } finally {
      setLoading(false);
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

                if (data) {
                  let statementDate = data[0][3];
                  const _uuid = data[0][3];
                  const _year = statementDate.substr(0, 4);
                  const _month = statementDate.substr(4, 2);
                  const _day = statementDate.substr(6, 2);

                  if (!uuid) uuid = _uuid;
                  if (!statementMonth) statementMonth = `${_year}-${_month}`;

                  statementDate = `${_year}/${_month}/${_day}`;

                  let _transactions: any[] = [];

                  data.forEach((child: any[], index: number) => {
                    if (child[0] === "P") {
                      _transactions.push({
                        uuid: _uuid,
                        date: statementDate,
                        amount: child[1].trim(),
                        easypayNumber: child[3],
                      });
                    }
                  });

                  const _numberOfTransactions = _transactions.length;

                  let payload: IEasypayImport = {
                    transactions: _transactions,
                    importData: {
                      uuid: _uuid,
                      date: statementDate,
                      numberOfTransactions: _numberOfTransactions,
                      createdBy: user?.name ?? "--",
                      created_at: new Date(),
                    },
                  };

                  resolve(payload);
                }
              }, // Resolve each promise
              error: reject,
            })
          )
      )
    )
      .then((results) => {
        results.forEach((result, index) => {
          importBatch.push(result);
        });
        bulkCreateTransactions({ statementMonth, importBatch, uuid }); // now since .then() excutes after all promises are resolved, filesData contains all the parsed files.
      })
      .catch((err) => console.error("Something went wrong:", err));
  };

  const bulkCreateTransactions = async (payload: {
    statementMonth: any;
    importBatch: any;
    uuid: any;
  }) => {
    try {
      const { statementMonth, importBatch, uuid } = payload;
      const { importData, transactions } = importBatch[0];

      const response = await fetch("/api/transactions/easypay", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          uuid,
          statementMonth,
          importData,
          transactions,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.message || "Failed to bulk create transactions");
        return;
      }

      fetchTransactions();
    } catch (err) {
      console.log(err);
      setError("An error occurred while bulk creating transactions.");
    } finally {
      setLoading(false);
    }
  };

  const sync = async () => {
    try {
      setSyncing(true);

      const result = await syncPolicyNumbers();

      if (result.success) {
        sweetAlert({
          title: result.message,
          icon: "success",
          timer: 2000,
        });
        await fetchTransactions();
      } else {
        sweetAlert({
          title: result.message,
          icon: "error",
          timer: 2000,
        });
      }
    } catch (error) {
      console.log("🚀 ~ syncPolicyNumbers ~ error:", error);
    } finally {
      setSyncing(false);
    }
  };

  const exportToCSV = () => {
    if (!transactions.length) {
      notification.warning({
        message: "No transactions to export",
      });
      return;
    }

    const csv = Papa.unparse(
      transactions.map((tx) => ({
        "Transaction Date": tx.date,
        "File ID": tx.uuid,
        "Policy Number": (tx as any).policyNumber ?? "",
        "Easypay Number": (tx as any).easypayNumber ?? "",
        Amount: tx.amount,
      }))
    );

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    saveAs(blob, "easypay-transactions.csv");
  };

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
        title="Easypay Transactions"
        actions={[
          <Space>
            {stats.toSync > 0 && (
              <Button
                loading={syncing}
                disabled={syncing}
                onClick={async () => {
                  await sync();
                }}
              >
                {syncing ? "Syncing..." : "Sync Policy Numbers"}
              </Button>
            )}
            <Button
              onClick={async () => {
                await fetchImportHistory();
                setShowHistoryDrawer(true);
              }}
            >
              Import History
            </Button>
            <Button onClick={exportToCSV} disabled={!transactions.length}>
              Export CSV
            </Button>
            {/* <Button onClick={syncPolicyNumbers} loading={syncing} disabled={syncing}>
              {syncing ? "Syncing..." : "Sync Policy Numbers"}
            </Button> */}
          </Space>,
        ]}
      >
        <Row gutter={16}>
          <Col
            span={12}
            style={{ display: "flex", justifyContent: "flex-start" }}
          >
            <Space size={32}>
              <Statistic title="Total" value={stats.count} />
              <Statistic title="Selected" value={transactions?.length || 0} />
              <Statistic
                title={
                  <Space>
                    <span>To Sync</span>
                    {!showToSync ? (
                      <EyeOutlined
                        onClick={() => !loading && fetchTransactionsToSync()}
                      />
                    ) : (
                      <EyeClosed width="1em" height="1em" />
                    )}
                  </Space>
                }
                value={stats.toSync}
              />
            </Space>
          </Col>
          <Col
            span={12}
            style={{ display: "flex", justifyContent: "flex-end" }}
          >
            {user?.role == "admin" && (
              <Space>
                <EasypayCsvImporter
                  handleChange={fileChangeHandler}
                  allowMultiple
                  label="Import Easypay Statement"
                />
              </Space>
            )}
          </Col>
        </Row>
      </PageHeader>

      {!loading ? (
        <main>
          <Form
            layout="vertical"
            className="w-full"
            style={{
              borderBottom: "1px solid #ddd",
              padding: "2rem 1rem 3rem 1rem",
            }}
          >
            <Space size={32} wrap className="flex w-full pb-0">
              <Form.Item style={{ marginBottom: "0" }}>
                <p
                  className="mb-2 uppercase dark:text-white"
                  style={{ letterSpacing: ".2rem" }}
                >
                  Search for reference
                </p>
                <Search
                  allowClear
                  value={search}
                  placeholder="Search Text..."
                  onChange={(event: any) => setSearch(event.target.value)}
                  onSearch={(value: string) =>
                    value.length > 0
                      ? searchTransactions(value)
                      : setTransactions([])
                  }
                />
              </Form.Item>
              <Form.Item style={{ marginBottom: "0" }}>
                <p
                  className="mb-2 uppercase dark:text-white"
                  style={{ letterSpacing: ".2rem" }}
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
                        className="w-10"
                      >
                        <Select.Option value={"="}>=</Select.Option>
                        <Select.Option value={">"}>&gt;</Select.Option>
                        <Select.Option value={"<"}>&lt;</Select.Option>
                      </Select>
                    }
                    onSearch={async (value: string) =>
                      value.length > 0
                        ? searchByAmount({
                            amount: amount,
                            filterType: amountFilterType,
                          })
                        : setTransactions([])
                    }
                  />
                </Space>
              </Form.Item>
              <Form.Item style={{ marginBottom: "0" }}>
                <p
                  className="mb-2 uppercase dark:text-white"
                  style={{ letterSpacing: ".2rem" }}
                >
                  Search for Date
                </p>
                <Space>
                  <DatePicker
                    onChange={(date, dateString) =>
                      searchByDate({ date, dateString })
                    }
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
              )} 
               */}
            </Space>
          </Form>

          <Table
            rowKey="_id"
            bordered
            loading={loading}
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
                title: "Policy Number",
                dataIndex: "policyNumber",
              },
              {
                title: "Easypay Number",
                dataIndex: "easypayNumber",
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
        </main>
      ) : (
        <div style={{ padding: "20px", textAlign: "center" }}>
          <Spin size="large" />
        </div>
      )}
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
          renderItem={(item: IEasypayImportData) => (
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
