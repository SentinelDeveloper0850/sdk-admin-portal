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
import { useRole } from "@/app/hooks/use-role";
import { IEasypayImport } from "@/app/interfaces/easypay-import.interface";
import { useAuth } from "@/context/auth-context";
import { syncPolicyNumbers } from "@/server/actions/easypay-transactions";
import useNotification from "antd/es/notification/useNotification";

import { ERoles } from "../../../../../types/roles.enum";

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

  const [stats, setStats] = useState<{ count: number; toSync: number; withoutPolicy: number; uniqueEasyPayWithoutPolicy: number }>({
    count: 0,
    toSync: 0,
    withoutPolicy: 0,
    uniqueEasyPayWithoutPolicy: 0,
  });

  const [imports, setImports] = useState<IEasypayImportData[]>([]);
  const [showHistoryDrawer, setShowHistoryDrawer] = useState<boolean>(false);

  const [search, setSearch] = useState("");
  const [amountFilterType, setAmountFilterType] = useState("=");
  const [amount, setAmount] = useState<number | string>("");

  const [showUniqueEasyPayDrawer, setShowUniqueEasyPayDrawer] = useState(false);
  const [uniqueEasyPayData, setUniqueEasyPayData] = useState<any>(null);
  const [uniqueEasyPayLoading, setUniqueEasyPayLoading] = useState(false);
  const [showToSyncDrawer, setShowToSyncDrawer] = useState(false);
  const [toSyncData, setToSyncData] = useState<any>(null);
  const [toSyncLoading, setToSyncLoading] = useState(false);
  const [toSyncPagination, setToSyncPagination] = useState({
    current: 1,
    pageSize: 50
  });
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 50
  });

  const { user } = useAuth();
  const { hasRole } = useRole();
  const [notification, contextHolder] = useNotification();

  const fetchTransactions = async (page = 1, pageSize = 50) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/transactions/easypay?page=${page}&pageSize=${pageSize}`);
      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.message || "Failed to fetch transactions");
        return;
      }

      const data = await response.json();
      setTransactions(data.transactions);
      setStats({
        count: data.count,
        toSync: data.toSync,
        withoutPolicy: data.withoutPolicy,
        uniqueEasyPayWithoutPolicy: data.uniqueEasyPayWithoutPolicy || 0
      });
      setPagination({
        current: page,
        pageSize: pageSize
      });
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
      setStats({
        count: data.count,
        toSync: data.toSync,
        withoutPolicy: data.withoutPolicy,
        uniqueEasyPayWithoutPolicy: data.uniqueEasyPayWithoutPolicy || 0
      });
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

  const fetchUniqueEasyPayNumbers = async () => {
    try {
      setUniqueEasyPayLoading(true);
      const response = await fetch("/api/transactions/easypay/unique-without-policy");
      if (!response.ok) {
        const errorData = await response.json();
        notification.error({
          message: errorData.message || "Failed to fetch unique EasyPay numbers",
        });
        return;
      }

      const data = await response.json();
      if (data.success) {
        setUniqueEasyPayData(data.data);
        setShowUniqueEasyPayDrawer(true);
      } else {
        notification.error({
          message: "Failed to load unique EasyPay numbers"
        });
      }
    } catch (err) {
      console.error("Error fetching unique EasyPay numbers:", err);
      notification.error({
        message: "Failed to fetch unique EasyPay numbers"
      });
    } finally {
      setUniqueEasyPayLoading(false);
    }
  };

  const fetchToSyncForDrawer = async (page = 1, pageSize = 50) => {
    try {
      setToSyncLoading(true);
      const response = await fetch(`/api/transactions/easypay/sync?page=${page}&pageSize=${pageSize}`);
      if (!response.ok) {
        const errorData = await response.json();
        notification.error({
          message: errorData.message || "Failed to fetch transactions to sync",
        });
        return;
      }

      const data = await response.json();
      if (data.success) {
        setToSyncData(data.data);
        setToSyncPagination({
          current: page,
          pageSize: pageSize
        });
        setShowToSyncDrawer(true);
      } else {
        notification.error({
          message: "Failed to load transactions to sync"
        });
      }
    } catch (err) {
      console.error("Error fetching transactions to sync:", err);
      notification.error({
        message: "Failed to fetch transactions to sync"
      });
    } finally {
      setToSyncLoading(false);
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
      {contextHolder}
      <PageHeader
        title="Easypay Transactions"
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

            {hasRole([ERoles.Admin, ERoles.FinanceOfficer]) &&
              stats.toSync > 0 && (
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
            {hasRole([ERoles.Admin, ERoles.FinanceOfficer]) && (
              <Button onClick={exportToCSV} disabled={!transactions.length}>
                Export CSV
              </Button>
            )}
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
              <Statistic title="Displayed" value={transactions?.length || 0} />
              <Statistic
                title={
                  <Space>
                    <span>Policies to Find</span>
                    {stats.uniqueEasyPayWithoutPolicy > 0 && (
                      <EyeOutlined
                        onClick={() => !uniqueEasyPayLoading && fetchUniqueEasyPayNumbers()}
                        style={{ cursor: 'pointer', color: '#ffac00' }}
                      />
                    )}
                  </Space>
                }
                value={stats.uniqueEasyPayWithoutPolicy}
              />
              {hasRole([ERoles.Admin, ERoles.FinanceOfficer]) && (
                <Statistic
                  title={
                    <Space>
                      <span>To Sync</span>
                      {!showToSync ? (
                        <EyeOutlined
                          onClick={() => !toSyncLoading && fetchToSyncForDrawer()}
                          style={{ cursor: 'pointer', color: '#ffac00' }}
                        />
                      ) : (
                        <EyeClosed width="1em" height="1em" />
                      )}
                    </Space>
                  }
                  value={stats.toSync}
                />
              )}
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
            pagination={{
              current: pagination.current,
              pageSize: pagination.pageSize,
              total: stats.count,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`,
              onChange: (page, pageSize) => {
                fetchTransactions(page, pageSize);
              }
            }}
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
      <Drawer
        title="Unique EasyPay Numbers Without Policy"
        placement="right"
        closable={true}
        width={800}
        onClose={() => setShowUniqueEasyPayDrawer(false)}
        open={showUniqueEasyPayDrawer}
      >
        {uniqueEasyPayData && (
          <div>
            <div style={{ marginBottom: "16px" }}>
              <Statistic
                title="Total Unique EasyPay Numbers"
                value={uniqueEasyPayData.pagination?.total || 0}
                valueStyle={{ color: '#1890ff' }}
              />
            </div>
            <Table
              dataSource={uniqueEasyPayData.uniqueEasyPayNumbers}
              columns={[
                {
                  title: 'EasyPay Number',
                  dataIndex: 'easypayNumber',
                  key: 'easypayNumber',
                  width: 200,
                },
                {
                  title: 'Transaction Count',
                  dataIndex: 'transactionCount',
                  key: 'transactionCount',
                  width: 120,
                  render: (value: number) => (
                    <span style={{ fontWeight: 'bold', color: value > 1 ? '#ff4d4f' : '#52c41a' }}>
                      {value}
                    </span>
                  ),
                },
                {
                  title: 'Total Amount',
                  dataIndex: 'totalAmount',
                  key: 'totalAmount',
                  width: 120,
                  render: (value: number) => formatToMoneyWithCurrency(value),
                },
                {
                  title: 'Date Range',
                  key: 'dateRange',
                  width: 150,
                  render: (_, record: any) => {
                    const firstDate = new Date(record.firstTransactionDate).toLocaleDateString();
                    const lastDate = new Date(record.lastTransactionDate).toLocaleDateString();
                    return firstDate === lastDate ? firstDate : `${firstDate} - ${lastDate}`;
                  },
                },
              ]}
              pagination={{
                current: uniqueEasyPayData.pagination?.current || 1,
                pageSize: uniqueEasyPayData.pagination?.pageSize || 50,
                total: uniqueEasyPayData.pagination?.total || 0,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`,
                onChange: (page, pageSize) => {
                  fetchUniqueEasyPayNumbers();
                }
              }}
              size="small"
            />
          </div>
        )}
      </Drawer>
      <Drawer
        title="Transactions to Sync"
        placement="right"
        closable={true}
        width={800}
        onClose={() => setShowToSyncDrawer(false)}
        open={showToSyncDrawer}
      >
        {toSyncData && (
          <div>
            <div style={{ marginBottom: "16px" }}>
              <Statistic
                title="Total Transactions to Sync"
                value={toSyncData.toSync || 0}
                valueStyle={{ color: '#ff4d4f' }}
              />
            </div>
            <Table
              dataSource={toSyncData.transactions}
              columns={[
                {
                  title: 'Transaction Date',
                  dataIndex: 'date',
                  key: 'date',
                  width: 120,
                },
                {
                  title: 'File ID',
                  dataIndex: 'uuid',
                  key: 'uuid',
                  width: 120,
                },
                {
                  title: 'EasyPay Number',
                  dataIndex: 'easypayNumber',
                  key: 'easypayNumber',
                  width: 180,
                },
                {
                  title: 'Amount',
                  dataIndex: 'amount',
                  key: 'amount',
                  width: 100,
                  render: (value: number) => formatToMoneyWithCurrency(value),
                },
                {
                  title: 'Description',
                  dataIndex: 'description',
                  key: 'description',
                  ellipsis: true,
                },
              ]}
              pagination={{
                current: toSyncPagination.current,
                pageSize: toSyncPagination.pageSize,
                total: toSyncData.pagination?.total || 0,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`,
                onChange: (page, pageSize) => {
                  fetchToSyncForDrawer(page, pageSize);
                }
              }}
              size="small"
            />
          </div>
        )}
      </Drawer>
    </div>
  );
}
