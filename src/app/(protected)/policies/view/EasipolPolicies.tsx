"use client";

import { useEffect, useState } from "react";

import {
  CloseOutlined,
  EyeOutlined,
  MailOutlined,
  MoreOutlined,
  PhoneOutlined,
  ReloadOutlined,
  SearchOutlined,
  UserOutlined
} from "@ant-design/icons";
import {
  Button,
  Col,
  Dropdown,
  Form,
  Input,
  Modal,
  Row,
  Select,
  Space,
  Statistic,
  Table,
  Tag
} from "antd";
import sweetAlert from "sweetalert";

import PolicyCancellationDrawer from "@/app/components/policies/policy-cancellation-drawer";
import PolicyDetailsDrawer from "@/app/components/policies/policy-details-drawer";
import Loading from "@/app/components/ui/loading";

export interface IEasipolPolicy {
  _id: string;
  memberID: string;
  policyNumber: string;
  fullname: string;
  productName: string;
  cellNumber?: string;
  cellphoneNumber?: string;
  emailAddress?: string;
  paymentMethod?: string;
  status?: string;
  paymentHistoryFile?: string;
  easypayNumber?: string;
  payAtNumber?: string;
  memberId?: string;
  fullName?: string;
  whatsappNumber?: string;
  homeTelephone?: string;
  physicalAddress?: string;
  postalAddress?: string;
  cancellationStatus?: "none" | "pending_review" | "approved" | "rejected";
}

export default function EasipolPoliciesPage() {
  const [policies, setPolicies] = useState<IEasipolPolicy[]>([]);
  const [bootstrapping, setBootstrapping] = useState<boolean>(true);
  const [tableLoading, setTableLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | boolean>(false);
  const [stats, setStats] = useState<{ count: number; totalPages: number }>({
    count: 0,
    totalPages: 0,
  });
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [selectedPolicyId, setSelectedPolicyId] = useState<string | null>(null);
  const [editingPolicy, setEditingPolicy] = useState<IEasipolPolicy | null>(
    null
  );
  const [cancellationDrawerOpen, setCancellationDrawerOpen] = useState(false);
  const [selectedPolicyForCancellation, setSelectedPolicyForCancellation] =
    useState<IEasipolPolicy | null>(null);
  const [filterOptionsLoading, setFilterOptionsLoading] =
    useState<boolean>(true);
  const [searchInput, setSearchInput] = useState("");

  // Pagination and filtering state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortBy, setSortBy] = useState("policyNumber");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [filters, setFilters] = useState({
    status: "",
    productName: "",
    branchName: "",
    searchText: "",
  });
  const [filterOptions, setFilterOptions] = useState({
    statuses: [],
    products: [],
    branches: [],
  });

  const fetchEasipolPolicies = async () => {
    try {
      setTableLoading(true);
      setError(false);

      // Build query parameters
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: pageSize.toString(),
        sortBy,
        sortOrder,
      });

      // Add filters - only add non-empty values
      if (filters.status && filters.status.trim())
        params.append("status", filters.status.trim());
      if (filters.productName && filters.productName.trim())
        params.append("productName", filters.productName.trim());
      if (filters.branchName && filters.branchName.trim())
        params.append("branchName", filters.branchName.trim());
      if (filters.searchText && filters.searchText.trim())
        params.append("searchText", filters.searchText.trim());

      const response = await fetch(
        `/api/policies/easipol?${params.toString()}`
      );
      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.message || "Failed to fetch policies");
        return;
      }

      const data = await response.json();
      setPolicies(data.policies || []);
      setStats({ count: data.count || 0, totalPages: data.totalPages || 0 });
    } catch (err) {
      console.error("Error fetching policies:", err);
      setError("An error occurred while fetching policies.");
    } finally {
      setTableLoading(false);
      if (bootstrapping) setBootstrapping(false);
    }
  };

  const fetchFilterOptions = async () => {
    try {
      setFilterOptionsLoading(true);
      const response = await fetch("/api/policies/easipol/filter-options");
      if (response.ok) {
        const data = await response.json();
        setFilterOptions({
          statuses: data.statuses || [],
          products: data.products || [],
          branches: data.branches || [],
        });
      } else {
        console.error("Failed to fetch filter options:", response.status);
      }
    } catch (err) {
      console.error("Error fetching filter options:", err);
    } finally {
      setFilterOptionsLoading(false);
    }
  };

  const handleSearch = (value: string) => {
    setSearchInput(value || "");
    setFilters((prev) => ({ ...prev, searchText: value || "" }));
    setCurrentPage(1); // Reset to first page when searching
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value || "" }));
    setCurrentPage(1); // Reset to first page when filtering
  };

  const handleClearFilters = () => {
    setFilters({ status: "", productName: "", branchName: "", searchText: "" });
    setCurrentPage(1);
  };

  const handleSort = (column: string, order: "asc" | "desc") => {
    setSortBy(column);
    setSortOrder(order);
  };

  const handlePageChange = (page: number, size?: number) => {
    setCurrentPage(page);
    if (size) setPageSize(size);
  };

  useEffect(() => {
    fetchEasipolPolicies();
  }, [currentPage, pageSize, sortBy, sortOrder, filters]);

  useEffect(() => {
    fetchFilterOptions();
  }, []);

  const handleDownload = () => {
    if (previewImage) {
      const link = document.createElement("a");
      link.href = previewImage;
      link.download = "payment-history.png";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleEmailShare = () => {
    if (previewImage) {
      const email =
        "?subject=Payment History&body=See attached payment history image.";
      const mailtoLink = `mailto:${email}`;
      window.location.href = mailtoLink;
    }
  };

  const deletePolicy = async (id: string, policyNumber: string) => {
    try {
      const confirmed = await sweetAlert({
        title: "Are you sure?",
        text: `This will permanently delete policy ${policyNumber} from the system.`,
        icon: "warning",
        buttons: ["Cancel", "Yes, delete it!"],
        dangerMode: true,
      });

      if (!confirmed) return;

      const response = await fetch(`/api/policies/easipol/${id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        const errorData = await response.json();
        sweetAlert({
          title: "Failed to delete policy!",
          text: errorData.message,
          icon: "error",
        });
        return;
      }

      sweetAlert({
        title: "Policy deleted",
        icon: "success",
        timer: 2000,
      });

      // Remove from UI without re-fetching
      setPolicies((prevPolicies) => prevPolicies.filter((p) => p._id !== id));
    } catch (err) {
      console.error("Delete error:", err);
      sweetAlert({
        title: "Error deleting policy",
        text: "Please try again later.",
        icon: "error",
      });
    }
  };

  const editPolicy = (policy: IEasipolPolicy) => {
    setEditingPolicy(policy);
    // You can implement edit functionality here
    console.log("Edit policy:", policy);
  };

  if (bootstrapping) {
    return (
      <Loading
        type="fullscreen"
        message="Loading policies from Easipol..."
        error={error as string}
        retry={fetchEasipolPolicies}
      />
    );
  }

  return (
    <div>
      <div className="mb-8 flex w-full justify-between">
        <Space size={32}>
          <Statistic title="Total Easipol Policies" value={stats.count} />
          <Statistic
            title="Listed Easipol Policies"
            value={policies ? policies.length : 0}
          />
        </Space>
        <Space size={32}>
          <Button icon={<ReloadOutlined />} onClick={fetchEasipolPolicies}>
            Refresh
          </Button>
        </Space>
      </div>
      {error && (
        <div style={{ color: "red", marginBottom: "20px" }}>{error}</div>
      )}

      {/* Search Results Indicator */}
      {(filters.status ||
        filters.productName ||
        filters.branchName ||
        filters.searchText) && (
          <div
            style={{
              backgroundColor: "#f0f9ff",
              border: "1px solid #0ea5e9",
              borderRadius: "6px",
              padding: "12px 16px",
              marginBottom: "16px",
              color: "#0c4a6e",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <strong>Search Results:</strong> Showing Easipol policies matching
                your filters
                {filters.status && (
                  <span style={{ marginLeft: "8px" }}>
                    • Status: {filters.status}
                  </span>
                )}
                {filters.productName && (
                  <span style={{ marginLeft: "8px" }}>
                    • Product: {filters.productName}
                  </span>
                )}
                {filters.branchName && (
                  <span style={{ marginLeft: "8px" }}>
                    • Branch: {filters.branchName}
                  </span>
                )}
                {filters.searchText && (
                  <span style={{ marginLeft: "8px" }}>
                    • Search: "{filters.searchText}"
                  </span>
                )}
                <span style={{ marginLeft: "8px" }}>
                  • {policies.length} results
                </span>
              </div>
              <Button
                type="link"
                onClick={handleClearFilters}
                style={{ padding: "0", color: "#0ea5e9", fontWeight: "600" }}
              >
                CLEAR SEARCH
              </Button>
            </div>
          </div>
        )}
      <Form layout="vertical" style={{ width: "100%" }}>
        <Row gutter={16}>
          <Col span={6}>
            <Form.Item label="Search">
              <Input
                allowClear
                placeholder="Search by Policy Number, Member ID, Name, ID Number, or Phone..."
                value={searchInput}
                onChange={(e) => {
                  const val = e.target.value;
                  setSearchInput(val);
                  if (val === "") {
                    handleSearch("");
                  }
                }}
                onPressEnter={() => handleSearch(searchInput)}
                addonAfter={
                  <SearchOutlined
                    style={{ cursor: "pointer" }}
                    onClick={() => handleSearch(searchInput)}
                  />
                }
              />
            </Form.Item>
          </Col>
          {/* <Col span={4}>
            <Form.Item label="Status">
              <Select
                allowClear
                placeholder="All Statuses"
                value={filters.status || undefined}
                onChange={(value: string) => handleFilterChange("status", value)}
                loading={filterOptionsLoading}
              >
                {filterOptions.statuses.map((status: string) => (
                  <Select.Option key={status} value={status}>
                    {status}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          </Col> */}
          <Col span={6}>
            <Form.Item label="Product">
              <Select
                allowClear
                placeholder="All Products"
                value={filters.productName || undefined}
                onChange={(value) => handleFilterChange("productName", value)}
                loading={filterOptionsLoading}
              >
                {filterOptions.products.map((product: string) => (
                  <Select.Option key={product} value={product}>
                    {product}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          {/* <Col span={4}>
            <Form.Item label="Branch">
              <Select
                allowClear
                placeholder="All Branches"
                value={filters.branchName || undefined}
                onChange={(value) => handleFilterChange("branchName", value)}
                loading={filterOptionsLoading}
              >
                {filterOptions.branches.map((branch: string) => (
                  <Select.Option key={branch} value={branch}>
                    {branch}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          </Col> */}
          <Col span={6}>
            <Form.Item label="Actions">
              <Space>
                <Button
                  onClick={handleClearFilters}
                  disabled={
                    !filters.status &&
                    !filters.productName &&
                    !filters.branchName &&
                    !filters.searchText
                  }
                >
                  Clear Filters
                </Button>
              </Space>
            </Form.Item>
          </Col>
        </Row>
      </Form>
      <Table
        rowKey="_id"
        bordered
        dataSource={policies}
        loading={tableLoading}
        rowClassName="cursor-pointer hover:bg-gray-50"
        onChange={(pagination, filters, sorter: any) => {
          if (sorter && sorter.field) {
            handleSort(
              sorter.field,
              sorter.order === "descend" ? "desc" : "asc"
            );
          }
        }}
        pagination={{
          current: currentPage,
          pageSize: pageSize,
          total: stats.count,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total, range) =>
            `${range[0]}-${range[1]} of ${total} Easipol policies`,
          onChange: handlePageChange,
          onShowSizeChange: handlePageChange,
          position: ["bottomCenter"],
        }}
        columns={[
          {
            title: "Policy Number",
            dataIndex: "policyNumber",
            key: "policyNumber",
            sorter: true,
            sortOrder:
              sortBy === "policyNumber" ? (sortOrder as any) : undefined,
            render: (policyNumber: string) => (
              <span className="font-mono font-semibold">{policyNumber}</span>
            ),
          },
          {
            title: "Easypay Number",
            dataIndex: "easypayNumber",
            key: "easypayNumber",
            sorter: (a, b) =>
              a.easypayNumber?.localeCompare(b.easypayNumber || "") || 0,
          },
          // {
          //   title: "Easipol Member ID",
          //   dataIndex: "memberId",
          //   key: "memberId",
          //   sorter: (a, b) => a.memberId?.localeCompare(b.memberId || "") || 0,
          // },
          {
            title: "Main Member",
            dataIndex: "fullName",
            key: "fullName",
            sorter: (a, b) => a.fullName?.localeCompare(b.fullName || "") || 0,
            render: (fullName: string, record: IEasipolPolicy) => (
              <div className="flex items-center gap-2">
                <UserOutlined className="text-gray-400" />
                <span>{fullName || record.fullname || "N/A"}</span>
              </div>
            ),
          },
          {
            title: "Contact",
            key: "contact",
            render: (_, record: IEasipolPolicy) => {
              const contactMethods = [];
              if (record.cellphoneNumber)
                contactMethods.push(record.cellphoneNumber);
              if (record.cellNumber) contactMethods.push(record.cellNumber);
              if (record.whatsappNumber)
                contactMethods.push(record.whatsappNumber);
              if (record.homeTelephone)
                contactMethods.push(record.homeTelephone);

              return (
                <div className="space-y-1">
                  {record.cellphoneNumber && (
                    <div className="flex items-center gap-1 text-sm">
                      <PhoneOutlined className="text-green-500" />
                      <span>{record.cellphoneNumber}</span>
                    </div>
                  )}
                  {!record.cellphoneNumber && record.cellNumber && (
                    <div className="flex items-center gap-1 text-sm">
                      <PhoneOutlined className="text-green-500" />
                      <span>{record.cellNumber}</span>
                    </div>
                  )}
                  {record.emailAddress && (
                    <div className="flex items-center gap-1 text-sm">
                      <MailOutlined className="text-blue-500" />
                      <span className="text-xs">{record.emailAddress}</span>
                    </div>
                  )}
                  {contactMethods.length === 0 && (
                    <span className="text-xs text-gray-400">
                      No contact info
                    </span>
                  )}
                </div>
              );
            },
          },
          {
            title: "Product",
            dataIndex: "productName",
            key: "productName",
            sorter: (a, b) =>
              a.productName?.localeCompare(b.productName || "") || 0,
            render: (productName: string) => (
              <Tag color="blue" className="w-fit">
                {productName}
              </Tag>
            ),
          },
          {
            title: "Status",
            dataIndex: "status",
            key: "status",
            render: (status: string) => {
              const getStatusColor = (status: string) => {
                switch (status?.toLowerCase()) {
                  case "active":
                    return "green";
                  case "inactive":
                    return "red";
                  case "lapsed":
                    return "orange";
                  case "suspended":
                    return "volcano";
                  case "pending":
                    return "blue";
                  case "cancelled":
                    return "red";
                  case "expired":
                    return "purple";
                  default:
                    return "default";
                }
              };

              return (
                <Tag color={getStatusColor(status)}>{status || "Unknown"}</Tag>
              );
            },
            sorter: (a, b) => (a.status || "").localeCompare(b.status || ""),
          },
          {
            title: "Cancellation Status",
            dataIndex: "cancellationStatus",
            key: "cancellationStatus",
            render: (cancellationStatus: string) => {
              // Only render if there's a meaningful cancellation status
              if (!cancellationStatus || cancellationStatus === "none") {
                return null;
              }

              const getCancellationStatusColor = (status: string) => {
                switch (status) {
                  case "pending_review":
                    return "orange";
                  case "approved":
                    return "red";
                  case "rejected":
                    return "green";
                  default:
                    return "default";
                }
              };

              const getCancellationStatusText = (status: string) => {
                switch (status) {
                  case "pending_review":
                    return "Pending Review";
                  case "approved":
                    return "Cancellation Approved";
                  case "rejected":
                    return "Cancellation Rejected";
                  default:
                    return "Unknown";
                }
              };

              return (
                <Tag color={getCancellationStatusColor(cancellationStatus)}>
                  {getCancellationStatusText(cancellationStatus)}
                </Tag>
              );
            },
            sorter: (a, b) =>
              (a.cancellationStatus || "").localeCompare(
                b.cancellationStatus || ""
              ),
          },
          {
            title: "Actions",
            key: "actions",
            render: (_: any, record: IEasipolPolicy) => (
              <Dropdown
                menu={{
                  items: [
                    // {
                    //   key: "view",
                    //   icon: <EyeOutlined />,
                    //   label: "View Details",
                    //   onClick: () => setSelectedPolicyId(record._id || null),
                    // },
                    // {
                    //   key: "edit",
                    //   icon: <EditOutlined />,
                    //   label: "Edit Easipol Policy",
                    //   onClick: () => editPolicy(record),
                    // },
                    ...(record.cancellationStatus === "none" ||
                      !record.cancellationStatus
                      ? [
                        {
                          key: "request-cancellation",
                          icon: <CloseOutlined />,
                          label: "Request Cancellation",
                          onClick: () => {
                            setSelectedPolicyForCancellation(record);
                            setCancellationDrawerOpen(true);
                          },
                        },
                      ]
                      : []),
                    ...(record.paymentHistoryFile
                      ? [
                        {
                          key: "payment-history",
                          icon: <EyeOutlined />,
                          label: "Payment History",
                          onClick: () =>
                            setPreviewImage(
                              record.paymentHistoryFile || null
                            ),
                        },
                      ]
                      : []),
                    // {
                    //   key: "delete",
                    //   icon: <DeleteOutlined />,
                    //   label: "Delete Easipol Policy",
                    //   danger: true,
                    //   onClick: () => deletePolicy(record._id, record.policyNumber),
                    // },
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

      {/* Modal to preview payment history image */}
      <Modal
        open={!!previewImage}
        title={
          <div className="flex items-center justify-between pb-4">
            <h1>Easipol Payment History</h1>
            <Button key="close" onClick={() => setPreviewImage(null)}>
              Close
            </Button>
          </div>
        }
        footer={[
          <Button key="close" onClick={() => setPreviewImage(null)}>
            Close
          </Button>,
        ]}
        closable={false}
        onCancel={() => setPreviewImage(null)}
        width="80vw"
        style={{
          padding: "20px",
        }}
        styles={{
          body: {
            marginTop: "20px",
          }
        }}
      >
        {previewImage && (
          <img
            src={previewImage}
            alt="Easipol Payment History"
            style={{ width: "100%", height: "100%", objectFit: "contain" }}
          />
        )}
      </Modal>

      <PolicyDetailsDrawer
        open={!!selectedPolicyId}
        onClose={() => setSelectedPolicyId(null)}
        policyId={selectedPolicyId}
      />

      <PolicyCancellationDrawer
        open={cancellationDrawerOpen}
        onClose={() => {
          setCancellationDrawerOpen(false);
          setSelectedPolicyForCancellation(null);
        }}
        policyId={selectedPolicyForCancellation?._id || null}
        policyNumber={selectedPolicyForCancellation?.policyNumber}
        memberName={
          selectedPolicyForCancellation?.fullName ||
          selectedPolicyForCancellation?.fullname
        }
      />
    </div>
  );
}
