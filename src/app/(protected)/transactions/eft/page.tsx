"use client";

import { useEffect, useState } from "react";

import { InboxOutlined, MoreOutlined, ReloadOutlined, UploadOutlined } from "@ant-design/icons";
import {
  Alert,
  App,
  Button,
  Col,
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
  Tag,
  Upload,
} from "antd";
import Search from "antd/es/input/Search";

import { formatToMoneyWithCurrency, formatUCTtoISO } from "@/utils/formatters";

// BankStatementExcelImporter moved to EFT Importer page
import PageHeader from "@/app/components/page-header";
import { useRole } from "@/app/hooks/use-role";
import { useAuth } from "@/context/auth-context";

import { ERoles } from "../../../../../types/roles.enum";
import { IAllocationRequest } from "@/app/models/hr/allocation-request.schema";

export interface IEftTransaction {
  _id: string;
  uuid: string;
  name: string;
  description: string;
  additionalInformation: string;
  amount: number;
  date: string;
  created_at: string;
  // allocationRequests: mongoose.Types.ObjectId[] or AllocationRequest[];
  allocationRequests?: IAllocationRequest[];
}

export interface IEftImportData {
  _id: string;
  uuid: string;
  date: string;
  numberOfTransactions: number;
  createdBy: string;
  created_at: Date;
}

export interface IEftStats {
  count: number;
  totalAllocationRequestsCount: number;
  pendingAllocationRequestsCount: number;
  submittedAllocationRequestsCount: number;
  approvedAllocationRequestsCount: number;
  rejectedAllocationRequestsCount: number;
  cancelledAllocationRequestsCount: number;
  duplicateAllocationRequestsCount: number;
}

export default function EftTransactionsPage() {
  const [transactions, setTransactions] = useState<IEftTransaction[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const { message, notification } = App.useApp();

  const [stats, setStats] = useState<IEftStats>({ count: 0, totalAllocationRequestsCount: 0, pendingAllocationRequestsCount: 0, submittedAllocationRequestsCount: 0, approvedAllocationRequestsCount: 0, rejectedAllocationRequestsCount: 0, cancelledAllocationRequestsCount: 0, duplicateAllocationRequestsCount: 0 });

  const [imports, setImports] = useState<IEftImportData[]>([]);
  const [showHistoryDrawer, setShowHistoryDrawer] = useState<boolean>(false);

  const [showAllocationRequestDrawer, setShowAllocationRequestDrawer] = useState<boolean>(false);
  const [selectedTransaction, setSelectedTransaction] = useState<IEftTransaction | null>(null);
  const [allocationRequestForm] = Form.useForm();
  const [evidenceFileList, setEvidenceFileList] = useState<any[]>([]);
  const [allocationRequestLoading, setAllocationRequestLoading] = useState<boolean>(false);
  const [allocationRequestError, setAllocationRequestError] = useState<string | null>(null);
  const [allocationRequestSuccess, setAllocationRequestSuccess] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [amountFilterType, setAmountFilterType] = useState("=");
  const [amount, setAmount] = useState<number | string>("");

  const { user } = useAuth();

  const { hasRole } = useRole();

  const fetchTransactions = async (showLoader: boolean = true) => {
    try {
      if (showLoader) setLoading(true);
      const response = await fetch("/api/transactions/eft");
      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.message || "Failed to fetch transactions");
        return;
      }

      const data = await response.json();
      setTransactions(data.transactions);
      setStats(data.stats);
    } catch (err) {
      console.log(err);
      setError("An error occurred while fetching transactions.");
    } finally {
      if (showLoader) setLoading(false);
    }
  };

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      await fetchTransactions(false);
    } finally {
      setRefreshing(false);
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

  const resetAllocationRequest = () => {
    setEvidenceFileList([]);
    setAllocationRequestError(null);
    setAllocationRequestSuccess(null);
    allocationRequestForm.resetFields();
    setSelectedTransaction(null);
  };

  const requestAllocation = async () => {
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
      formData.append("policyNumber", data.policyNumber);
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
      formData.append("policyNumber", data.policyNumber);
      formData.append("notes", data.notes || "");

      const response = await fetch(`/api/transactions/eft/request-allocation`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        setAllocationRequestError(errorData.message || "Failed to request allocation");
        return;
      }

      setAllocationRequestSuccess("Allocation requested successfully");
      resetAllocationRequest();
      setShowAllocationRequestDrawer(false);
    } catch (err) {
      console.log(err);
      setAllocationRequestError("An error occurred while requesting allocation");
    } finally {
      setAllocationRequestLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

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

  const openAllocationRequestDrawer = (transaction: IEftTransaction) => {
    resetAllocationRequest();

    setSelectedTransaction(transaction);
    setShowAllocationRequestDrawer(true);
  };

  const handleFileUpload = async (file: any) => {
    console.log("file", file);
    setEvidenceFileList([...evidenceFileList, file]);
  };

  const uploadEvidenceProps = {
    beforeUpload: handleFileUpload,
    fileList: evidenceFileList,
    onChange: ({ fileList }: any) => setEvidenceFileList(fileList),
    accept: ".jpg,.jpeg,.png,.pdf",
    maxCount: 10,
  };

  return (
    <div style={{ padding: "20px" }}>
      <PageHeader
        title="EFT Transactions"
        actions={[
          <Space>
            <Button onClick={handleRefresh} loading={refreshing} icon={<ReloadOutlined />}>Refresh</Button>
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
              <Statistic title="Allocation Requests" value={stats.totalAllocationRequestsCount} />
            </Space>
          </Col>
          <Col
            span={12}
            style={{ display: "flex", justifyContent: "flex-end" }}
          >
            {hasRole(ERoles.Admin) && (
              <Space>
                {/* XLSX importer now available in EFT Importer page */}
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
      <Form layout="vertical" className="w-full mb-8">
        <Space size={32} wrap className="flex w-full">
          <Form.Item className="mb-0">
            <p className="mb-2 dark:text-white font-medium">Search for reference</p>
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
            <p className="mb-2 dark:text-white font-medium">Search for Amount</p>
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
        rowClassName={(record: IEftTransaction) => "cursor-pointer hover:bg-gray-100"}
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
          {
            title: "Allocation",
            dataIndex: "allocationRequests",
            key: "allocationRequests",
            sorter: (a, b) => (a.allocationRequests?.length || 0) - (b.allocationRequests?.length || 0),
            render: (requests: IAllocationRequest[]) => {
              if (requests.length === 0) return;
              return (
                <Space>
                  <Tag>{requests.length > 1 ? `${requests.length} requests` : requests[0].status}</Tag>
                </Space>
              );
            },
          },
          {
            title: "Actions",
            key: "actions",
            render: (_: any, record: IEftTransaction) => {
              const hasAllocationRequests = record.allocationRequests && record.allocationRequests.length > 0;
              return (
                <Dropdown
                  menu={{
                    items: [
                      {
                        key: "request-allocation",
                        icon: <InboxOutlined />,
                        label: "Request Allocation",
                        onClick: () => openAllocationRequestDrawer(record),
                        disabled: hasAllocationRequests,
                      },
                    ]
                  }}
                  trigger={["click"]}
                >
                  <Button icon={<MoreOutlined />} />
                </Dropdown>
              )
            },
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

      <Drawer
        title={
          <div>
            <h3 className="mb-0 text-md font-semibold">Allocation Request</h3>
            <p className="mb-0 text-sm text-gray-500 font-normal">Request allocation of the selected transaction on ASSIT</p>
          </div>
        }
        placement="right"
        closable={false}
        width="60%"
        onClose={() => setShowAllocationRequestDrawer(false)}
        open={showAllocationRequestDrawer}
        footer={
          <Space>
            <Button onClick={() => setShowAllocationRequestDrawer(false)}>Cancel</Button>
            <Button onClick={requestAllocation} loading={allocationRequestLoading} type="primary">Submit Request</Button>
          </Space>
        }
      >
        <Alert
          showIcon
          type="info"
          message="Please note that the allocation request will be reviewed. If approved, it will be submitted for allocation on ASSIT."
          style={{ marginBottom: 16 }}
        />
        <h3 className="mb-4 text-md font-semibold">Transaction Information</h3>
        {selectedTransaction && (
          <Descriptions size="small" bordered column={2} style={{ marginBottom: 16 }}>
            <Descriptions.Item label="Date">{formatUCTtoISO(selectedTransaction.date)}</Descriptions.Item>
            <Descriptions.Item label="File ID">{selectedTransaction.uuid}</Descriptions.Item>
            <Descriptions.Item label="Description">{selectedTransaction.description}</Descriptions.Item>
            <Descriptions.Item label="Amount">{formatToMoneyWithCurrency(selectedTransaction.amount)}</Descriptions.Item>
            <Descriptions.Item label="Additional Info">{selectedTransaction.additionalInformation}</Descriptions.Item>
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
          <Form.Item label="Policy Number" name="policyNumber" rules={[{ required: true, message: "Policy number is required" }]}>
            <Input />
          </Form.Item>
          <Form.Item label="Notes" name="notes">
            <Input.TextArea />
          </Form.Item>
          <Form.Item label="Supporting Documents" name="evidence">
            <Upload.Dragger {...uploadEvidenceProps}>
              <p className="ant-upload-drag-icon">
                <UploadOutlined className="h-6 w-6" />
              </p>
              <p className="ant-upload-text">Click or drag supporting documents to upload</p>
              <p className="ant-upload-hint">Support for JPG, PNG, PDF files. Max file size: 10MB</p>
            </Upload.Dragger>
          </Form.Item>
        </Form>
      </Drawer>
    </div>
  );
}
