"use client";

import { useEffect, useState } from "react";

import {
  EyeOutlined,
  InboxOutlined,
  MoreOutlined,
  UploadOutlined,
} from "@ant-design/icons";
import {
  Alert,
  Button,
  Col,
  DatePicker,
  Descriptions,
  Drawer,
  Dropdown,
  Form,
  Input,
  List,
  Row,
  Select,
  Space,
  Spin,
  Statistic,
  Table,
  Upload,
} from "antd";
import Search from "antd/es/input/Search";
import useNotification from "antd/es/notification/useNotification";
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

import { ERoles } from "../../../../types/roles.enum";

interface IEasypayTransaction {
  _id: string;
  uuid: string;
  name: string;
  description: string;
  easypayNumber: string;
  policyNumber: string;
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

  const [stats, setStats] = useState<{
    count: number;
    toSync: number;
    withoutPolicy: number;
    uniqueEasyPayWithoutPolicy: number;
  }>({
    count: 0,
    toSync: 0,
    withoutPolicy: 0,
    uniqueEasyPayWithoutPolicy: 0,
  });

  const [imports, setImports] = useState<IEasypayImportData[]>([]);
  const [showHistoryDrawer, setShowHistoryDrawer] = useState<boolean>(false);

  const [search, setSearch] = useState("");
  const [policyNumberSearch, setPolicyNumberSearch] = useState("");
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
    pageSize: 50,
  });
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 50,
  });

  const [isSearching, setIsSearching] = useState(false);
  const [searchResultsCount, setSearchResultsCount] = useState(0);
  const [currentSearchParams, setCurrentSearchParams] = useState<{
    type: "text" | "policyNumber" | "amount" | "date";
    value: string;
    amount?: number;
    filterType?: string;
    date?: string;
  } | null>(null);

  const { user } = useAuth();
  const { hasRole } = useRole();
  const [notification, contextHolder] = useNotification();

  const [showAllocationRequestDrawer, setShowAllocationRequestDrawer] =
    useState<boolean>(false);
  const [selectedTransaction, setSelectedTransaction] =
    useState<IEasypayTransaction | null>(null);
  const [allocationRequestForm] = Form.useForm();
  const [evidenceFileList, setEvidenceFileList] = useState<any[]>([]);
  const [allocationRequestLoading, setAllocationRequestLoading] =
    useState<boolean>(false);
  const [allocationRequestError, setAllocationRequestError] = useState<
    string | null
  >(null);
  const [allocationRequestSuccess, setAllocationRequestSuccess] = useState<
    string | null
  >(null);

  const fetchTransactions = async (page = 1, pageSize = 50) => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/transactions/easypay?page=${page}&pageSize=${pageSize}`
      );
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
        uniqueEasyPayWithoutPolicy: data.uniqueEasyPayWithoutPolicy || 0,
      });
      setPagination({
        current: page,
        pageSize: pageSize,
      });
      setShowToSync(false);
      setIsSearching(false);
      setSearchResultsCount(0);
      setCurrentSearchParams(null);
    } catch (err) {
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
        uniqueEasyPayWithoutPolicy: data.uniqueEasyPayWithoutPolicy || 0,
      });
      setShowToSync(true);
    } catch (err) {
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
      notification.error({
        message: "An error occurred while fetching import history.",
      });
    }
  };

  const fetchUniqueEasyPayNumbers = async () => {
    try {
      setUniqueEasyPayLoading(true);
      const response = await fetch(
        "/api/transactions/easypay/unique-without-policy"
      );
      if (!response.ok) {
        const errorData = await response.json();
        notification.error({
          message:
            errorData.message || "Failed to fetch unique EasyPay numbers",
        });
        return;
      }

      const data = await response.json();
      if (data.success) {
        setUniqueEasyPayData(data.data);
        setShowUniqueEasyPayDrawer(true);
      } else {
        notification.error({
          message: "Failed to load unique EasyPay numbers",
        });
      }
    } catch (err) {
      console.error("Error fetching unique EasyPay numbers:", err);
      notification.error({
        message: "Failed to fetch unique EasyPay numbers",
      });
    } finally {
      setUniqueEasyPayLoading(false);
    }
  };

  const fetchToSyncForDrawer = async (page = 1, pageSize = 50) => {
    try {
      setToSyncLoading(true);
      const response = await fetch(
        `/api/transactions/easypay/sync?page=${page}&pageSize=${pageSize}`
      );
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
          pageSize: pageSize,
        });
        setShowToSyncDrawer(true);
      } else {
        notification.error({
          message: "Failed to load transactions to sync",
        });
      }
    } catch (err) {
      console.error("Error fetching transactions to sync:", err);
      notification.error({
        message: "Failed to fetch transactions to sync",
      });
    } finally {
      setToSyncLoading(false);
    }
  };

  const searchTransactions = async (
    value: string,
    page = 1,
    pageSize = pagination.pageSize
  ) => {
    setLoading(true);
    try {
      const response = await fetch("/api/transactions/easypay/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          searchText: value,
          searchType: "text",
          page,
          pageSize,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.message || "Failed to search transactions");
        return;
      }

      const data = await response.json();
      setTransactions(data.transactions || data);
      setIsSearching(true);
      setSearchResultsCount(data.total || data.length);
      setCurrentSearchParams({ type: "text", value });
      setPagination({
        current: page,
        pageSize: pageSize,
      });
    } catch (err) {
      setError("An error occurred while searching transactions.");
    } finally {
      setLoading(false);
    }
  };

  const searchByPolicyNumber = async (
    value: string,
    page = 1,
    pageSize = pagination.pageSize
  ) => {
    setLoading(true);
    try {
      const response = await fetch("/api/transactions/easypay/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          searchText: value,
          searchType: "policyNumber",
          page,
          pageSize,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.message || "Failed to search transactions");
        return;
      }

      const data = await response.json();
      setTransactions(data.transactions || data);
      setIsSearching(true);
      setSearchResultsCount(data.total || data.length);
      setCurrentSearchParams({ type: "policyNumber", value });
      setPagination({
        current: page,
        pageSize: pageSize,
      });
    } catch (err) {
      setError("An error occurred while searching transactions.");
    } finally {
      setLoading(false);
    }
  };

  const handleSearchPagination = async (page: number, pageSize: number) => {
    if (!currentSearchParams) return;

    switch (currentSearchParams.type) {
      case "text":
        await searchTransactions(currentSearchParams.value, page, pageSize);
        break;
      case "policyNumber":
        await searchByPolicyNumber(currentSearchParams.value, page, pageSize);
        break;
      case "amount":
        await searchByAmount(
          {
            amount: currentSearchParams.amount!,
            filterType: currentSearchParams.filterType!,
          },
          page,
          pageSize
        );
        break;
      case "date":
        await searchByDate(
          {
            date: {} as Dayjs,
            dateString: currentSearchParams.date!,
          },
          page,
          pageSize
        );
        break;
    }
  };

  const searchByAmount = async (
    { amount, filterType }: any,
    page = 1,
    pageSize = pagination.pageSize
  ) => {
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
          page,
          pageSize,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.message || "Failed to search transactions");
        return;
      }

      const data = await response.json();
      setTransactions(data.transactions || data);
      setIsSearching(true);
      setSearchResultsCount(data.total || data.length);
      setCurrentSearchParams({ type: "amount", value: "", amount, filterType });
      setPagination({
        current: page,
        pageSize: pageSize,
      });
    } catch (err) {
      setError("An error occurred while searching transactions.");
    } finally {
      setLoading(false);
    }
  };

  const searchByDate = async (
    {
      date,
      dateString,
    }: {
      date: Dayjs;
      dateString: string | string[];
    },
    page = 1,
    pageSize = pagination.pageSize
  ) => {
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
            page,
            pageSize,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          setError(errorData.message || "Failed to search transactions");
          return;
        }

        const data = await response.json();
        setTransactions(data.transactions || data);
        setIsSearching(true);
        setSearchResultsCount(data.total || data.length);
        setCurrentSearchParams({
          type: "date",
          value: "",
          date: formattedDate,
        });
        setPagination({
          current: page,
          pageSize: pageSize,
        });
      }
    } catch (err) {
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
      setError("An error occurred while bulk creating transactions.");
    } finally {
      setLoading(false);
    }
  };

  const sync = async (shouldResync: boolean = false) => {
    try {
      setSyncing(true);

      const result = await syncPolicyNumbers(shouldResync);

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

  const openAllocationRequestDrawer = (transaction: IEasypayTransaction) => {
    resetAllocationRequest();
    setSelectedTransaction(transaction);
    setShowAllocationRequestDrawer(true);
  };

  const resetAllocationRequest = () => {
    setEvidenceFileList([]);
    setAllocationRequestError(null);
    setAllocationRequestSuccess(null);
    allocationRequestForm.resetFields();
    setSelectedTransaction(null);
  };

  const submitAllocationRequest = async () => {
    try {
      setAllocationRequestLoading(true);

      await allocationRequestForm.validateFields();
      const data = allocationRequestForm.getFieldsValue();

      if (!selectedTransaction) {
        setAllocationRequestError("No transaction selected");
        return;
      }

      const formData = new FormData();

      formData.append("transactionId", selectedTransaction._id);
      formData.append("easypayNumber", selectedTransaction.easypayNumber);
      formData.append("policyNumber", selectedTransaction.policyNumber || "");
      formData.append("date", selectedTransaction.date);
      formData.append("uuid", selectedTransaction.uuid);
      formData.append("notes", data.notes || []);

      if (evidenceFileList.length > 0) {
        evidenceFileList.forEach((file: any) => {
          const blob = (file && (file.originFileObj || file)) as File;
          if (blob) {
            formData.append("evidence", blob, (blob as any).name || "evidence");
          }
        });
      }

      // Append simple fields last
      formData.append("notes", data.notes || "");

      const response = await fetch(
        `/api/transactions/easypay/request-allocation`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        setAllocationRequestError(
          errorData.message || "Failed to request allocation"
        );
        return;
      }

      setAllocationRequestSuccess("Allocation requested successfully");
      resetAllocationRequest();
      setShowAllocationRequestDrawer(false);
    } catch (err) {
      setAllocationRequestError(
        "An error occurred while requesting allocation"
      );
    } finally {
      setAllocationRequestLoading(false);
    }
  };

  const handleFileUpload = async (file: any) => {
    setEvidenceFileList([...evidenceFileList, file]);
  };

  const uploadEvidenceProps = {
    beforeUpload: handleFileUpload,
    fileList: evidenceFileList,
    onChange: ({ fileList }: any) => setEvidenceFileList(fileList),
    accept: ".jpg,.jpeg,.png,.pdf",
    maxCount: 10,
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

            {hasRole([ERoles.Admin, ERoles.FinanceOfficer]) && (
              <Button
                loading={syncing}
                disabled={syncing}
                onClick={async () => {
                  await sync(false);
                }}
              >
                {syncing ? "Syncing..." : "Sync Policy Numbers"}
              </Button>
            )}
            {hasRole([ERoles.Admin, ERoles.FinanceOfficer]) && (
              <Button
                loading={syncing}
                disabled={syncing}
                onClick={async () => {
                  await sync(true);
                }}
              >
                {syncing ? "Resyncing..." : "Resync ALL Policy Numbers"}
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
                        onClick={() =>
                          !uniqueEasyPayLoading && fetchUniqueEasyPayNumbers()
                        }
                        style={{ cursor: "pointer", color: "#ffac00" }}
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
                          onClick={() =>
                            !toSyncLoading && fetchToSyncForDrawer()
                          }
                          style={{ cursor: "pointer", color: "#ffac00" }}
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
        <main className="space-y-4">
          <Form layout="vertical" className="mb-2 w-full px-0 pb-0">
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
                      : fetchTransactions(1, pagination.pageSize)
                  }
                  onClear={() => {
                    setSearch("");
                    fetchTransactions(1, pagination.pageSize);
                  }}
                />
              </Form.Item>
              <Form.Item style={{ marginBottom: "0" }}>
                <p
                  className="mb-2 uppercase dark:text-white"
                  style={{ letterSpacing: ".2rem" }}
                >
                  Search by Policy Number
                </p>
                <Search
                  allowClear
                  value={policyNumberSearch}
                  placeholder="Policy Number..."
                  onChange={(event: any) =>
                    setPolicyNumberSearch(event.target.value)
                  }
                  onSearch={(value: string) =>
                    value.length > 0
                      ? searchByPolicyNumber(value)
                      : fetchTransactions(1, pagination.pageSize)
                  }
                  onClear={() => {
                    setPolicyNumberSearch("");
                    fetchTransactions(1, pagination.pageSize);
                  }}
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
                        : fetchTransactions(1, pagination.pageSize)
                    }
                    onClear={() => {
                      setAmount("");
                      fetchTransactions(1, pagination.pageSize);
                    }}
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

          {/* Search Results Description */}
          {isSearching && currentSearchParams && (
            <div className="mb-2 mt-2 flex items-center justify-between rounded-md border border-[#333333] bg-[#222222] p-4">
              <div>
                <span
                  className="text-sm"
                  style={{ fontWeight: "400", color: "#CCCCCC" }}
                >
                  Search results for:{" "}
                </span>
                <span style={{ fontWeight: "600", color: "#ffffff" }}>
                  {currentSearchParams.type === "text" &&
                    `"${currentSearchParams.value}"`}
                  {currentSearchParams.type === "policyNumber" &&
                    `Policy Number: "${currentSearchParams.value}"`}
                  {currentSearchParams.type === "amount" &&
                    `${currentSearchParams.filterType} ${currentSearchParams.amount}`}
                  {currentSearchParams.type === "date" &&
                    `Date: ${currentSearchParams.date}`}
                </span>
                <span
                  className="text-sm"
                  style={{ marginLeft: "8px", color: "#CCCCCC" }}
                >
                  ({searchResultsCount} results)
                </span>
              </div>
              <Button
                type="default"
                className="!hover:text-red-500 !hover:border-red-500 !border-red-700 text-sm font-semibold uppercase !text-red-700"
                onClick={() => {
                  setIsSearching(false);
                  setSearchResultsCount(0);
                  setCurrentSearchParams(null);
                  setSearch("");
                  setPolicyNumberSearch("");
                  setAmount("");
                  fetchTransactions(1, pagination.pageSize);
                }}
              >
                Clear Search
              </Button>
            </div>
          )}

          <Table
            rowKey="_id"
            bordered
            loading={loading}
            dataSource={transactions}
            rowClassName="cursor-pointer hover:bg-gray-100"
            pagination={{
              current: pagination.current,
              pageSize: pagination.pageSize,
              total: isSearching ? searchResultsCount : stats.count,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) =>
                `${range[0]}-${range[1]} of ${total} items`,
              onChange: (page, pageSize) => {
                if (isSearching) {
                  // Handle search result pagination
                  handleSearchPagination(page, pageSize);
                } else {
                  fetchTransactions(page, pageSize);
                }
              },
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
              {
                title: "Actions",
                key: "actions",
                render: (_: any, record: any) => (
                  <Dropdown
                    menu={{
                      items: [
                        {
                          key: "request-allocation",
                          icon: <InboxOutlined />,
                          label: "Request Allocation",
                          onClick: () => openAllocationRequestDrawer(record),
                        },
                      ],
                    }}
                    trigger={["click"]}
                  >
                    <Button icon={<MoreOutlined />} />
                  </Dropdown>
                ),
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
                valueStyle={{ color: "#1890ff" }}
              />
            </div>
            <Table
              dataSource={uniqueEasyPayData.uniqueEasyPayNumbers}
              columns={[
                {
                  title: "EasyPay Number",
                  dataIndex: "easypayNumber",
                  key: "easypayNumber",
                  width: 200,
                },
                {
                  title: "Transaction Count",
                  dataIndex: "transactionCount",
                  key: "transactionCount",
                  width: 120,
                  render: (value: number) => (
                    <span
                      style={{
                        fontWeight: "bold",
                        color: value > 1 ? "#ff4d4f" : "#52c41a",
                      }}
                    >
                      {value}
                    </span>
                  ),
                },
                {
                  title: "Total Amount",
                  dataIndex: "totalAmount",
                  key: "totalAmount",
                  width: 120,
                  render: (value: number) => formatToMoneyWithCurrency(value),
                },
                {
                  title: "Date Range",
                  key: "dateRange",
                  width: 150,
                  render: (_, record: any) => {
                    const firstDate = new Date(
                      record.firstTransactionDate
                    ).toLocaleDateString();
                    const lastDate = new Date(
                      record.lastTransactionDate
                    ).toLocaleDateString();
                    return firstDate === lastDate
                      ? firstDate
                      : `${firstDate} - ${lastDate}`;
                  },
                },
              ]}
              pagination={{
                current: uniqueEasyPayData.pagination?.current || 1,
                pageSize: uniqueEasyPayData.pagination?.pageSize || 50,
                total: uniqueEasyPayData.pagination?.total || 0,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total, range) =>
                  `${range[0]}-${range[1]} of ${total} items`,
                onChange: (page, pageSize) => {
                  fetchUniqueEasyPayNumbers();
                },
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
                valueStyle={{ color: "#ff4d4f" }}
              />
            </div>
            <Table
              dataSource={toSyncData.transactions}
              columns={[
                {
                  title: "Transaction Date",
                  dataIndex: "date",
                  key: "date",
                  width: 120,
                },
                {
                  title: "File ID",
                  dataIndex: "uuid",
                  key: "uuid",
                  width: 120,
                },
                {
                  title: "EasyPay Number",
                  dataIndex: "easypayNumber",
                  key: "easypayNumber",
                  width: 180,
                },
                {
                  title: "Amount",
                  dataIndex: "amount",
                  key: "amount",
                  width: 100,
                  render: (value: number) => formatToMoneyWithCurrency(value),
                },
                {
                  title: "Description",
                  dataIndex: "description",
                  key: "description",
                  ellipsis: true,
                },
              ]}
              pagination={{
                current: toSyncPagination.current,
                pageSize: toSyncPagination.pageSize,
                total: toSyncData.pagination?.total || 0,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total, range) =>
                  `${range[0]}-${range[1]} of ${total} items`,
                onChange: (page, pageSize) => {
                  fetchToSyncForDrawer(page, pageSize);
                },
              }}
              size="small"
            />
          </div>
        )}
      </Drawer>

      <Drawer
        title={
          <div>
            <h3 className="text-md mb-0 font-semibold">
              Easypay Allocation Request
            </h3>
            <p className="mb-0 text-sm font-normal text-gray-500">
              Request allocation of the selected easypay transaction on ASSIT
            </p>
          </div>
        }
        placement="right"
        closable={false}
        width="60%"
        onClose={() => setShowAllocationRequestDrawer(false)}
        open={showAllocationRequestDrawer}
        footer={
          <Space>
            <Button onClick={() => setShowAllocationRequestDrawer(false)}>
              Cancel
            </Button>
            <Button
              onClick={submitAllocationRequest}
              loading={allocationRequestLoading}
              type="primary"
            >
              Submit Request
            </Button>
          </Space>
        }
      >
        <Alert
          showIcon
          type="info"
          message="Please note that the allocation request will be reviewed. If approved, it will be submitted for allocation on ASSIT."
          style={{ marginBottom: 16 }}
        />
        <h3 className="text-md mb-4 font-semibold">Transaction Information</h3>
        {selectedTransaction && (
          <Descriptions
            size="small"
            bordered
            column={2}
            style={{ marginBottom: 16 }}
          >
            <Descriptions.Item label="Date">
              {formatUCTtoISO(selectedTransaction.date)}
            </Descriptions.Item>
            <Descriptions.Item label="File ID">
              {selectedTransaction.uuid}
            </Descriptions.Item>
            <Descriptions.Item label="Easypay Number">
              {selectedTransaction.easypayNumber}
            </Descriptions.Item>
            <Descriptions.Item label="Policy Number">
              {selectedTransaction.policyNumber}
            </Descriptions.Item>
            <Descriptions.Item label="Amount">
              {formatToMoneyWithCurrency(selectedTransaction.amount)}
            </Descriptions.Item>
          </Descriptions>
        )}
        {allocationRequestError && (
          <Alert
            showIcon
            type="error"
            message={allocationRequestError}
            closable
            style={{ marginBottom: 16 }}
            onClose={() => setAllocationRequestError(null)}
          />
        )}
        {allocationRequestSuccess && (
          <Alert
            showIcon
            type="success"
            message={allocationRequestSuccess}
            closable
            style={{ marginBottom: 16 }}
            onClose={() => setAllocationRequestSuccess(null)}
          />
        )}
        <Form layout="vertical" form={allocationRequestForm}>
          <Form.Item label="Notes" name="notes">
            <Input.TextArea />
          </Form.Item>
          <Form.Item label="Supporting Documents" name="evidence">
            <Upload.Dragger {...uploadEvidenceProps}>
              <p className="ant-upload-drag-icon">
                <UploadOutlined className="h-6 w-6" />
              </p>
              <p className="ant-upload-text">
                Click or drag supporting documents to upload
              </p>
              <p className="ant-upload-hint">
                Support for JPG, PNG, PDF files. Max file size: 10MB
              </p>
            </Upload.Dragger>
          </Form.Item>
        </Form>
      </Drawer>
    </div>
  );
}
