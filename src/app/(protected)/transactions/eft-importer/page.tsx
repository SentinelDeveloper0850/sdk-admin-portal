"use client";

import Papa from "papaparse";
import { useEffect, useMemo, useState } from "react";

import { DeleteOutlined, EditOutlined, EyeOutlined, ReloadOutlined, UploadOutlined } from "@ant-design/icons";
import { Alert, Button, Col, Drawer, Form, Input, message, Popconfirm, Row, Space, Spin, Statistic, Table, Upload } from "antd";

import { BankStatementExcelImporter } from "@/app/components/import-tools/bank-statement-xlsx-importer";
import PageHeader from "@/app/components/page-header";
import { useAuth } from "@/context/auth-context";

interface EditableTransaction {
  key: string;
  date: string;
  description: string;
  rawDescription: string;
  rawLine: string;
  amount: number;
}

interface CsvTransaction {
  key: string;
  date: string;
  description: string;
  amount: number;
  rawData: any;
}

export default function TransactionHistoryImporter() {
  const [transactions, setTransactions] = useState<EditableTransaction[]>([]);
  const [csvTransactions, setCsvTransactions] = useState<CsvTransaction[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | boolean>(false);
  const [previewMode, setPreviewMode] = useState<boolean>(false);
  const [previewPageSize, setPreviewPageSize] = useState<number>(10);
  const [previewUuid, setPreviewUuid] = useState<string>("");
  const [previewDateRange, setPreviewDateRange] = useState<{ start: string; end: string } | null>(null);
  const [previewContentHash, setPreviewContentHash] = useState<string>("");
  const [duplicateExists, setDuplicateExists] = useState<boolean>(false);
  const [checkingDuplicate, setCheckingDuplicate] = useState<boolean>(false);
  const [previewFilter, setPreviewFilter] = useState<"all" | "positive" | "negative">("all");
  const [imports, setImports] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const [pageSize, setPageSize] = useState<number>(10);
  const [editDrawerVisible, setEditDrawerVisible] = useState(false);
  const [currentRecord, setCurrentRecord] =
    useState<EditableTransaction | null>(null);
  const [drawerForm] = Form.useForm();

  const [rawTransactionVisible, setRawTransactionVisible] = useState(false);
  const [rawTransaction, setRawTransaction] = useState<{ description: string, line: string }>();

  const { user } = useAuth();

  // Helpers for cleaning/sorting
  const parseNumber = (value: any): number => {
    if (value === null || value === undefined) return NaN;
    const s = String(value)
      .replace(/\s+/g, "")
      .replace(/[,]/g, "")
      .replace(/R|ZAR|\$/gi, "")
      .replace(/\((.*)\)/, (_, p1) => `-${p1}`);
    const n = Number(s);
    return isNaN(n) ? NaN : n;
  };

  const isNegativeAmount = (record: CsvTransaction): boolean => {
    const rawAmt: any = (record as any).rawData?.amount ?? (record as any).rawData?.Amount ?? record.amount;
    const amt = typeof rawAmt === "number" ? rawAmt : parseNumber(rawAmt);
    return !isNaN(amt) && amt < 0;
  };

  const handleDelete = (key: string) => {
    const newData = transactions.filter((item) => item.key !== key);
    setTransactions(newData);
  };

  const handleCsvDelete = (key: string) => {
    const newData = csvTransactions.filter((item) => item.key !== key);
    setCsvTransactions(newData);
  };

  const handleDrawerSave = async () => {
    try {
      const values = await drawerForm.validateFields();
      if (!currentRecord) return;

      const updated = transactions.map((tx) =>
        tx.key === currentRecord.key ? { ...tx, ...values } : tx
      );

      setTransactions(updated);
      setEditDrawerVisible(false);
      setCurrentRecord(null);
      message.success("Transaction updated");
    } catch (err) {
      console.error("Drawer validation failed:", err);
    }
  };

  // Derived preview list based on quick filter
  const filteredCsvTransactions = useMemo(() => {
    if (previewFilter === "negative") {
      return csvTransactions.filter((tx) => isNegativeAmount(tx));
    }
    if (previewFilter === "positive") {
      return csvTransactions.filter((tx) => !isNegativeAmount(tx));
    }
    return csvTransactions;
  }, [csvTransactions, previewFilter]);

  const openEditDrawer = (record: EditableTransaction) => {
    setCurrentRecord(record);
    drawerForm.setFieldsValue(record);
    setEditDrawerVisible(true);
  };

  const fetchImportHistory = async () => {
    try {
      setHistoryLoading(true);
      const response = await fetch("/api/transactions/eft/import-history");
      if (!response.ok) {
        return;
      }
      const data = await response.json();
      setImports(data);
    } catch (_e) {
      // ignore
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    // Load dashboard data on first load or whenever exiting preview
    if (!previewMode) {
      fetchImportHistory();
    }
  }, [previewMode]);

  const handleCsvUpload = (file: File) => {
    setLoading(true);
    setError(false);

    Papa.parse(file, {
      header: false,
      skipEmptyLines: true,
      complete: (results) => {
        setLoading(false);

        if (results.errors.length > 0) {
          console.log("🚀 ~ handleCsvUpload ~ results.errors:", results.errors)
          setError("Error parsing CSV file. Please check the file format.");
          return;
        }

        // Find the header row that contains Date, Amount, Balance, Description
        const headerRowIndex = results.data.findIndex((row: any) => {
          const rowString = row.join(',').toLowerCase();
          return rowString.includes('date') &&
            rowString.includes('amount') &&
            rowString.includes('balance') &&
            rowString.includes('description');
        });

        if (headerRowIndex === -1) {
          setError("Could not find header row with Date, Amount, Balance, Description columns.");
          return;
        }

        // Get the header row and data rows after it
        const headerRow = results.data[headerRowIndex] as string[];
        const dataRows = results.data.slice(headerRowIndex + 1);

        // Create a mapping of column indices
        const columnMap = {
          date: headerRow.findIndex((col: string) => col.toLowerCase().includes('date')),
          amount: headerRow.findIndex((col: string) => col.toLowerCase().includes('amount')),
          balance: headerRow.findIndex((col: string) => col.toLowerCase().includes('balance')),
          description: headerRow.findIndex((col: string) => col.toLowerCase().includes('description'))
        };

        // Parse transactions from data rows
        const parsedTransactions: CsvTransaction[] = dataRows
          .filter((row: any) => row.length > 0 && row.some((cell: any) => cell && cell.toString().trim() !== ''))
          .map((row: any, index: number) => ({
            key: `csv-${index}`,
            date: row[columnMap.date] || "",
            description: row[columnMap.description] || "",
            amount: parseFloat(row[columnMap.amount] || "0"),
            rawData: {
              date: row[columnMap.date],
              amount: row[columnMap.amount],
              balance: row[columnMap.balance],
              description: row[columnMap.description]
            }
          }));

        setCsvTransactions(parsedTransactions);
        setPreviewMode(true);
        message.success(`Successfully parsed ${parsedTransactions.length} transactions`);
      },
      error: (error) => {
        setLoading(false);
        setError("Failed to parse CSV file: " + error.message);
      }
    });

    return false; // Prevent default upload behavior
  };

  // Compute preview metadata and check for duplicates whenever csvTransactions are set for preview
  useEffect(() => {
    if (!previewMode || csvTransactions.length === 0) {
      setPreviewUuid("");
      setPreviewDateRange(null);
      setPreviewContentHash("");
      setDuplicateExists(false);
      return;
    }

    // Compute content hash from transactions
    const transactionContent = csvTransactions
      .map((tx) => `${tx.date}-${tx.description}-${tx.amount}`)
      .sort()
      .join("|");
    const contentHash = btoa(transactionContent).slice(0, 32);
    setPreviewContentHash(contentHash);

    // Compute date range without timezone shifts by normalizing and comparing strings
    const normalizeDate = (input: string) => {
      const s = String(input).trim();
      if (!s) return "";
      if (s.includes("/")) {
        const parts = s.split("/");
        // YYYY/MM/DD
        if (parts[0]?.length === 4) {
          const [y, m, d] = parts;
          return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
        }
        // DD/MM/YYYY
        if (parts[2]?.length === 4) {
          const [d, m, y] = parts;
          return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
        }
      }
      if (s.includes("-")) {
        const parts = s.split("-");
        // Assume YYYY-MM-DD
        if (parts[0]?.length === 4) {
          const [y, m, d] = parts;
          return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
        }
      }
      return s;
    };

    const normalizedDates = csvTransactions
      .map((tx) => normalizeDate(tx.date))
      .filter((s) => !!s)
      .sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));

    if (normalizedDates.length > 0) {
      const firstDate = normalizedDates[0];
      const lastDate = normalizedDates[normalizedDates.length - 1];
      const uuid = `${firstDate}-to-${lastDate}`;
      setPreviewUuid(uuid);
      setPreviewDateRange({ start: firstDate, end: lastDate });

      // Check duplicate against import history by uuid
      const checkDuplicate = async () => {
        try {
          setCheckingDuplicate(true);
          const resp = await fetch("/api/transactions/eft/import-history");
          if (!resp.ok) {
            setDuplicateExists(false);
            return;
          }
          const data = await resp.json();
          const history = data?.data || [];
          const exists = history.some((item: any) => item.uuid === uuid);
          setDuplicateExists(exists);
        } catch (_e) {
          setDuplicateExists(false);
        } finally {
          setCheckingDuplicate(false);
        }
      };

      checkDuplicate();
    }
  }, [previewMode, csvTransactions]);

  const handleImportCsvTransactions = async () => {
    try {
      setLoading(true);

      // Use preview metadata
      const uuid = previewUuid;
      const firstDateStr = previewDateRange?.start || new Date().toISOString().slice(0, 10);
      const lastDateStr = previewDateRange?.end || new Date().toISOString().slice(0, 10);
      const contentHash = previewContentHash;

      // Prepare the payload for the API
      const payload = {
        source: "Transaction History",
        statementMonth: new Date().toISOString().slice(0, 7), // YYYY-MM format
        transactions: csvTransactions.map((csvTx) => ({
          uuid: uuid,
          date: csvTx.date,
          description: csvTx.description,
          amount: csvTx.amount,
          additionalInformation: "--"
        })),
        importData: {
          uuid: uuid,
          date: new Date().toISOString().slice(0, 10), // YYYY-MM-DD format
          numberOfTransactions: csvTransactions.length,
          createdBy: user?.name || user?.email || "unknown",
          // Enhanced fields for transaction history imports (optional)
          contentHash: contentHash,
          dateRange: {
            start: firstDateStr,
            end: lastDateStr
          },
          importType: "transaction-history-csv"
        }
      };

      const response = await fetch("/api/transactions/eft", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.message || "Failed to import transactions");
        return;
      }

      const result = await response.json();

      if (result.success) {
        message.success(result.message || `Successfully imported ${csvTransactions.length} transactions`);

        // Clear the preview and show the imported transactions in the main table
        const convertedTransactions: EditableTransaction[] = csvTransactions.map((csvTx, index) => ({
          key: `imported-${index}`,
          date: csvTx.date,
          description: csvTx.description,
          rawDescription: csvTx.description,
          rawLine: JSON.stringify(csvTx.rawData),
          amount: csvTx.amount
        }));

        setTransactions(convertedTransactions);
        setCsvTransactions([]);
        setPreviewMode(false);
      } else {
        setError(result.message || "Failed to import transactions");
      }
    } catch (err) {
      console.error("Error importing transactions:", err);
      setError("An error occurred while importing transactions");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelPreview = () => {
    setCsvTransactions([]);
    setPreviewMode(false);
    setError(false);
    setPreviewPageSize(10);
  };

  const columns = [
    {
      title: "Date",
      dataIndex: "date",
      editable: true,
    },
    {
      title: "Description",
      dataIndex: "description",
      render: (_: any, record: EditableTransaction) => (
        <Space>
          <span>{record.description}</span>
        </Space>
      ),
    },
    {
      title: "Amount",
      dataIndex: "amount",
      editable: true,
    },
    {
      title: "Actions",
      dataIndex: "actions",
      render: (_: any, record: EditableTransaction) => (
        <Space>
          <Button
            icon={<EyeOutlined />}
            onClick={() => {
              setRawTransaction({
                description: record.rawDescription,
                line: record.rawLine
              });
              setRawTransactionVisible(true);
            }}
          />
          <Button
            icon={<EditOutlined />}
            onClick={() => openEditDrawer(record)}
          />
          <Popconfirm
            title="Delete this transaction?"
            onConfirm={() => handleDelete(record.key)}
          >
            <Button icon={<DeleteOutlined />} danger />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const csvPreviewColumns = [
    {
      title: "Date",
      dataIndex: "date",
      sorter: (a: CsvTransaction, b: CsvTransaction) => {
        const norm = (s: string) => {
          const x = String(s);
          if (x.includes("/")) {
            const p = x.split("/");
            if (p[0]?.length === 4) return `${p[0]}-${p[1].padStart(2, "0")}-${p[2].padStart(2, "0")}`;
            if (p[2]?.length === 4) return `${p[2]}-${p[1].padStart(2, "0")}-${p[0].padStart(2, "0")}`;
          }
          return x.replace(/\./g, "-");
        };
        const da = norm(a.date);
        const db = norm(b.date);
        return da < db ? -1 : da > db ? 1 : 0;
      },
    },
    {
      title: "Description",
      dataIndex: "description",
      sorter: (a: CsvTransaction, b: CsvTransaction) => a.description.localeCompare(b.description),
    },
    {
      title: "Amount",
      dataIndex: "amount",
      sorter: (a: CsvTransaction, b: CsvTransaction) => (a.amount || 0) - (b.amount || 0),
    },
    {
      title: "Actions",
      dataIndex: "actions",
      render: (_: any, record: CsvTransaction) => (
        <Popconfirm
          title="Remove this transaction from import?"
          onConfirm={() => handleCsvDelete(record.key)}
        >
          <Button icon={<DeleteOutlined />} danger size="small" />
        </Popconfirm>
      ),
    },
  ];

  const pageActions = useMemo(() => {
    if (user && user.role === "admin") {
      const actions: any[] = [];
      if (!transactions || transactions.length == 0) {
        actions.push(
          <BankStatementExcelImporter key="xlsx-importer" />
        );
        actions.push(
          <Upload
            key="upload-csv-btn"
            accept=".csv"
            showUploadList={false}
            beforeUpload={handleCsvUpload}
          >
            <Button icon={<UploadOutlined />} loading={loading}>
              Upload Transaction History (CSV)
            </Button>
          </Upload>
        );
      }
      actions.push(
        <Button key="refresh-btn" icon={<ReloadOutlined />} loading={refreshing} onClick={async () => { setRefreshing(true); await fetchImportHistory(); setRefreshing(false); }}>
          Refresh
        </Button>
      );
      return actions;
    } else {
      return [];
    }
  }, [user, transactions, loading]);

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center p-5 text-center">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div style={{ padding: "20px" }}>
      <PageHeader title="FNB Transaction History" actions={[...pageActions]} />
      {error && (
        <Alert
          showIcon
          type="error"
          message={error}
          closable
          onClose={() => setError(false)}
        />
      )}

      {/* CSV Preview Section */}
      {previewMode && csvTransactions.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <div className="flex justify-between items-center p-3 md:p-4 rounded-lg border bg-white text-slate-800 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100">
            <div>
              <div className="text-sm text-slate-500 dark:text-slate-400">Preview Summary</div>
              <div className="mt-1.5 text-sm">
                <span className="mr-4"><span className="font-semibold">Date range:</span> {previewDateRange?.start} → {previewDateRange?.end}</span>
                <span className="mr-4"><span className="font-semibold">Showing:</span> {filteredCsvTransactions.length} of {csvTransactions.length}</span>
                <span className="mr-4"><span className="font-semibold">UUID:</span> {previewUuid}</span>
                <span>
                  <span className="font-semibold">Duplicate:</span>
                  <span className={`ml-2 inline-flex items-center rounded px-2 py-0.5 text-xs font-medium border ${checkingDuplicate ? 'border-slate-300 text-slate-600 dark:border-slate-600 dark:text-slate-300' : duplicateExists ? 'border-red-300 text-red-700 dark:border-red-500 dark:text-red-400' : 'border-emerald-300 text-emerald-700 dark:border-emerald-500 dark:text-emerald-400'}`}>
                    {checkingDuplicate ? 'Checking…' : duplicateExists ? 'Yes (already imported)' : 'No'}
                  </span>
                </span>
              </div>
            </div>
            <Space>
              <div className="hidden md:flex items-center gap-1 mr-2">
                <Button size="small" type={previewFilter === "all" ? "primary" : "default"} onClick={() => setPreviewFilter("all")}>All</Button>
                <Button size="small" type={previewFilter === "positive" ? "primary" : "default"} onClick={() => setPreviewFilter("positive")}>Positive</Button>
                <Button size="small" type={previewFilter === "negative" ? "primary" : "default"} onClick={() => setPreviewFilter("negative")}>Negative</Button>
              </div>
              <Button size="small" onClick={handleCancelPreview}>
                Cancel
              </Button>
              <Button size="small" onClick={() => setCsvTransactions(prev => prev.filter(tx => !isNegativeAmount(tx)))}>
                Remove Negative Amounts
              </Button>
              <Button size="small" type="primary" onClick={handleImportCsvTransactions} disabled={duplicateExists}>
                {duplicateExists ? "Already Imported" : "Import All"}
              </Button>
            </Space>
          </div>
          <Table
            dataSource={filteredCsvTransactions}
            columns={csvPreviewColumns}
            rowClassName={(record: any) => (isNegativeAmount(record) ? 'bg-red-50 dark:bg-red-900/20' : '')}
            pagination={{
              pageSize: previewPageSize,
              showSizeChanger: true,
              pageSizeOptions: ["5", "10", "20", "50"],
              onChange: (page, size) => {
                if (size && size !== previewPageSize) setPreviewPageSize(size);
              },
              showTotal: (total, range) =>
                `${range[0]}–${range[1]} of ${total} transactions`,
            }}
            style={{ marginTop: 16 }}
          />
        </div>
      )}

      {/* Import Dashboard */}
      {!previewMode && (
        <div>
          <Row gutter={16} style={{ marginBottom: 16 }}>
            <Col span={12} style={{ display: "flex", justifyContent: "flex-start" }}>
              <Space size={32}>
                <Statistic title="Total Imports" value={imports.length} loading={historyLoading} />
                <Statistic
                  title="Total Imported Transactions"
                  value={imports.reduce((sum, it: any) => sum + (Number(it.numberOfTransactions) || 0), 0)}
                  loading={historyLoading}
                />
              </Space>
            </Col>
          </Row>
          <Table
            rowKey={(r: any) => r._id || r.uuid}
            dataSource={imports}
            loading={historyLoading}
            columns={[
              { title: "UUID", dataIndex: "uuid" },
              {
                title: "Date Range",
                key: "dateRange",
                render: (_: any, rec: any) =>
                  rec?.dateRange?.start && rec?.dateRange?.end
                    ? `${rec.dateRange.start} → ${rec.dateRange.end}`
                    : "--",
              },
              { title: "Transactions", dataIndex: "numberOfTransactions" },
              { title: "Created By", dataIndex: "createdBy" },
              { title: "Source", dataIndex: "source" },
              { title: "Imported On", dataIndex: "date" },
              {
                title: "Actions",
                key: "actions",
                render: (_: any, rec: any) => (
                  <Space>
                    <Popconfirm
                      title="Reverse this import?"
                      description={`This will permanently delete ${rec.numberOfTransactions} transaction(s) for ${rec.uuid}.`}
                      okText="Reverse"
                      okButtonProps={{ danger: true }}
                      onConfirm={async () => {
                        try {
                          setRefreshing(true);
                          const resp = await fetch('/api/transactions/eft/reverse', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ uuid: rec.uuid })
                          });
                          const result = await resp.json();
                          if (!resp.ok || !result.success) {
                            message.error(result.message || 'Failed to reverse import');
                          } else {
                            message.success(result.message || 'Import reversed');
                            await fetchImportHistory();
                          }
                        } catch (_e) {
                          message.error('Failed to reverse import');
                        } finally {
                          setRefreshing(false);
                        }
                      }}
                    >
                      <Button danger size="small">Reverse</Button>
                    </Popconfirm>
                  </Space>
                )
              }
            ]}
          />
        </div>
      )}

      {/* Main Transactions Table */}
      <div>
        {transactions?.length > 0 && (
          <Table
            dataSource={transactions}
            columns={columns}
            pagination={{
              pageSize: pageSize,
              showSizeChanger: true,
              pageSizeOptions: ["5", "10", "20", "50", "100"],
              onChange(page, pageSize) {
                setPageSize(pageSize);
              },
              showTotal: (total, range) =>
                `${range[0]}–${range[1]} of ${total} transactions`,
            }}
            style={{ marginTop: 24 }}
          />
        )}
      </div>

      {/* Edit Transaction Drawer */}
      <Drawer
        width="40%"
        placement="bottom"
        title="Edit Transaction"
        open={editDrawerVisible}
        onClose={() => setEditDrawerVisible(false)}
        footer={
          <Space style={{ display: "flex", justifyContent: "flex-end" }}>
            <Button onClick={() => setEditDrawerVisible(false)}>Cancel</Button>
            <Button type="primary" onClick={handleDrawerSave}>
              Save
            </Button>
          </Space>
        }
      >
        <Form layout="vertical" form={drawerForm}>
          <Form.Item
            name="date"
            label="Date"
            rules={[{ required: true, message: "Please enter the date" }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="description"
            label="Description"
            rules={[
              { required: true, message: "Please enter the description" },
            ]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="amount"
            label="Amount"
            rules={[{ required: true, message: "Please enter the amount" }]}
          >
            <Input type="number" />
          </Form.Item>
        </Form>
      </Drawer>

      {/* Raw Transaction Drawer */}
      <Drawer
        width="40%"
        placement="bottom"
        open={rawTransactionVisible}
        title="Raw Transaction"
        onClose={() => setRawTransactionVisible(false)}
        footer={null}
      >
        <p style={{ fontWeight: "bold" }}>Raw Description:</p>
        <p style={{ whiteSpace: "pre-wrap" }}>
          {rawTransaction?.description}
        </p>

        <p style={{ fontWeight: "bold", marginTop: 16 }}>Raw Line:</p>
        <p style={{ whiteSpace: "pre-wrap" }}>{rawTransaction?.line}</p>
      </Drawer>
    </div>
  );
}