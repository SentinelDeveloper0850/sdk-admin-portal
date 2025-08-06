"use client";

import { useEffect, useState } from "react";

import {
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  MailOutlined,
  MoreOutlined,
  PhoneOutlined,
  UserOutlined,
} from "@ant-design/icons";
import {
  Button,
  Col,
  Dropdown,
  Form,
  Modal,
  Row,
  Select,
  Space,
  Spin,
  Statistic,
  Table,
  Tag
} from "antd";
import Search from "antd/es/input/Search";

import PageHeader from "@/app/components/page-header";
import PolicyDetailsDrawer from "@/app/components/policies/policy-details-drawer";
import sweetAlert from "sweetalert";

interface IPolicy {
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
  memberId?: string;
  fullName?: string;
  whatsappNumber?: string;
  homeTelephone?: string;
  physicalAddress?: string;
  postalAddress?: string;
}

export default function PoliciesPage() {
  const [policies, setPolicies] = useState<IPolicy[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | boolean>(false);
  const [stats, setStats] = useState<{ count: number; totalPages: number }>({ count: 0, totalPages: 0 });
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [selectedPolicyId, setSelectedPolicyId] = useState<string | null>(null);
  const [editingPolicy, setEditingPolicy] = useState<IPolicy | null>(null);

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

  const fetchPolicies = async () => {
    try {
      setLoading(true);

      // Build query parameters
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: pageSize.toString(),
        sortBy,
        sortOrder,
      });

      // Add filters
      if (filters.status) params.append("status", filters.status);
      if (filters.productName) params.append("productName", filters.productName);
      if (filters.branchName) params.append("branchName", filters.branchName);
      if (filters.searchText) params.append("searchText", filters.searchText);

      const response = await fetch(`/api/policies?${params.toString()}`);
      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.message || "Failed to fetch policies");
        return;
      }

      const data = await response.json();
      setPolicies(data.policies);
      setStats({ count: data.count, totalPages: data.totalPages });
    } catch (err) {
      console.log(err);
      setError("An error occurred while fetching policies.");
    } finally {
      setLoading(false);
    }
  };

  const fetchFilterOptions = async () => {
    try {
      const response = await fetch("/api/policies/filter-options");
      if (response.ok) {
        const data = await response.json();
        setFilterOptions(data);
      }
    } catch (err) {
      console.log("Error fetching filter options:", err);
    }
  };

  const handleSearch = (value: string) => {
    setFilters(prev => ({ ...prev, searchText: value }));
    setCurrentPage(1); // Reset to first page when searching
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1); // Reset to first page when filtering
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
    fetchPolicies();
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

      const response = await fetch(`/api/policies/${id}`, {
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

  const editPolicy = (policy: IPolicy) => {
    setEditingPolicy(policy);
    // You can implement edit functionality here
    console.log("Edit policy:", policy);
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
      <PageHeader title="Policies">
        <Row gutter={16}>
          <Col span={12}>
            <Space size={32}>
              <Statistic title="Total Policies" value={stats.count} />
              <Statistic
                title="Listed Policies"
                value={policies ? policies.length : 0}
              />
            </Space>
          </Col>
        </Row>
      </PageHeader>
      {error && (
        <div style={{ color: "red", marginBottom: "20px" }}>{error}</div>
      )}
      <Form layout="vertical" style={{ width: "100%" }}>
        <Row gutter={16}>
          <Col span={6}>
            <Form.Item label="Search">
              <Search
                allowClear
                placeholder="Search by Policy Number, Member ID, Name, ID Number, or Phone..."
                onSearch={handleSearch}
              />
            </Form.Item>
          </Col>
          <Col span={4}>
            <Form.Item label="Status">
              <Select
                allowClear
                placeholder="All Statuses"
                value={filters.status || undefined}
                onChange={(value: string) => handleFilterChange("status", value)}
              >
                {filterOptions.statuses.map((status: string) => (
                  <Select.Option key={status} value={status}>
                    {status}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col span={4}>
            <Form.Item label="Product">
              <Select
                allowClear
                placeholder="All Products"
                value={filters.productName || undefined}
                onChange={(value) => handleFilterChange("productName", value)}
              >
                {filterOptions.products.map((product: string) => (
                  <Select.Option key={product} value={product}>
                    {product}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col span={4}>
            <Form.Item label="Branch">
              <Select
                allowClear
                placeholder="All Branches"
                value={filters.branchName || undefined}
                onChange={(value) => handleFilterChange("branchName", value)}
              >
                {filterOptions.branches.map((branch: string) => (
                  <Select.Option key={branch} value={branch}>
                    {branch}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item label="Actions">
              <Space>
                <Button onClick={() => {
                  setFilters({ status: "", productName: "", branchName: "", searchText: "" });
                  setCurrentPage(1);
                }}>
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
        rowClassName="cursor-pointer hover:bg-gray-50"
        onChange={(pagination, filters, sorter: any) => {
          if (sorter && sorter.field) {
            handleSort(sorter.field, sorter.order === "descend" ? "desc" : "asc");
          }
        }}
        pagination={{
          current: currentPage,
          pageSize: pageSize,
          total: stats.count,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total, range) =>
            `${range[0]}-${range[1]} of ${total} policies`,
          onChange: handlePageChange,
          onShowSizeChange: handlePageChange,
        }}
        columns={[
          {
            title: "Policy Number",
            dataIndex: "policyNumber",
            key: "policyNumber",
            sorter: true,
            sortOrder: sortBy === "policyNumber" ? (sortOrder as any) : undefined,
            render: (policyNumber: string) => (
              <span className="font-mono font-semibold">{policyNumber}</span>
            ),
          },
          {
            title: "Member ID",
            dataIndex: "memberId",
            key: "memberId",
            sorter: (a, b) => a.memberId?.localeCompare(b.memberId || "") || 0,
          },
          {
            title: "Main Member",
            dataIndex: "fullName",
            key: "fullName",
            sorter: (a, b) => a.fullName?.localeCompare(b.fullName || "") || 0,
            render: (fullName: string, record: IPolicy) => (
              <div className="flex items-center gap-2">
                <UserOutlined className="text-gray-400" />
                <span>{fullName || record.fullname || "N/A"}</span>
              </div>
            ),
          },
          {
            title: "Contact",
            key: "contact",
            render: (_, record: IPolicy) => {
              const contactMethods = [];
              if (record.cellphoneNumber) contactMethods.push(record.cellphoneNumber);
              if (record.cellNumber) contactMethods.push(record.cellNumber);
              if (record.whatsappNumber) contactMethods.push(record.whatsappNumber);
              if (record.homeTelephone) contactMethods.push(record.homeTelephone);

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
                    <span className="text-gray-400 text-xs">No contact info</span>
                  )}
                </div>
              );
            },
          },
          {
            title: "Product",
            dataIndex: "productName",
            key: "productName",
            sorter: (a, b) => a.productName?.localeCompare(b.productName || "") || 0,
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
                <Tag color={getStatusColor(status)}>
                  {status || "Unknown"}
                </Tag>
              );
            },
            sorter: (a, b) => (a.status || "").localeCompare(b.status || ""),
          },
          {
            title: "Actions",
            key: "actions",
            render: (_: any, record: IPolicy) => (
              <Dropdown
                menu={{
                  items: [
                    {
                      key: "view",
                      icon: <EyeOutlined />,
                      label: "View Details",
                      onClick: () => setSelectedPolicyId(record._id || null),
                    },
                    {
                      key: "edit",
                      icon: <EditOutlined />,
                      label: "Edit Policy",
                      onClick: () => editPolicy(record),
                    },
                    ...(record.paymentHistoryFile ? [{
                      key: "payment-history",
                      icon: <EyeOutlined />,
                      label: "Payment History",
                      onClick: () => setPreviewImage(record.paymentHistoryFile || null),
                    }] : []),
                    {
                      key: "delete",
                      icon: <DeleteOutlined />,
                      label: "Delete",
                      danger: true,
                      onClick: () => deletePolicy(record._id, record.policyNumber),
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

      {/* Modal to preview payment history image */}
      <Modal
        open={!!previewImage}
        title={<div className="flex justify-between items-center pb-4">
          <h1>Payment History</h1>
          <Button key="close" onClick={() => setPreviewImage(null)}>
            Close
          </Button>
        </div>}
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
        bodyStyle={{
          marginTop: "20px",
        }}
      >
        {previewImage && (
          <img
            src={previewImage}
            alt="Payment History"
            style={{ width: "100%", height: "100%", objectFit: "contain" }}
          />
        )}
      </Modal>

      <PolicyDetailsDrawer
        open={!!selectedPolicyId}
        onClose={() => setSelectedPolicyId(null)}
        policyId={selectedPolicyId}
      />
    </div>
  );
}
