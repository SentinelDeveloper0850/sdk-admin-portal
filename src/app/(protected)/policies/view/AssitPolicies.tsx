import PolicyPrintCardDrawer from "@/app/components/policies/policy-print-card-drawer";
import { IAssitPolicy } from "@/app/models/scheme/assit-policy.schema";
import { useAuth } from "@/context/auth-context";
import { formatToMoneyWithCurrency } from "@/utils/formatters";
import { hasRole } from "@/utils/helpers/hasRole";
import { MoreOutlined, PrinterOutlined, ReloadOutlined, SearchOutlined, UploadOutlined, UserOutlined } from "@ant-design/icons";
import { Alert, Button, Col, Drawer, Dropdown, Form, Input, message, Row, Select, Space, Statistic, Table, Tag, Upload, UploadProps } from "antd";
import Papa from "papaparse";
import { useEffect, useState } from "react";
import sweetAlert from "sweetalert";

const AssitPoliciesPage = () => {
  const [policies, setPolicies] = useState<IAssitPolicy[]>([]);
  const [stats, setStats] = useState<{ count: number; totalPages: number }>({ count: 0, totalPages: 0 });
  const [bootstrapping, setBootstrapping] = useState<boolean>(true);
  const [tableLoading, setTableLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | boolean>(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [selectedPolicyId, setSelectedPolicyId] = useState<string | null>(null);
  const [editingPolicy, setEditingPolicy] = useState<IAssitPolicy | null>(null);
  const [cancellationDrawerOpen, setCancellationDrawerOpen] = useState(false);
  const [selectedPolicyForCancellation, setSelectedPolicyForCancellation] = useState<IAssitPolicy | null>(null);
  const [filterOptionsLoading, setFilterOptionsLoading] = useState<boolean>(true);
  const [searchInput, setSearchInput] = useState("");
  const [printCardModalOpen, setPrintCardModalOpen] = useState(false);
  const [selectedPolicyForPrintCard, setSelectedPolicyForPrintCard] = useState<IAssitPolicy | null>(null);

  const { user } = useAuth();

  // Pagination and filtering state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortBy, setSortBy] = useState("membershipID");
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
      setTableLoading(true);
      const params = new URLSearchParams();
      params.set("page", String(currentPage));
      params.set("limit", String(pageSize));
      params.set("sortBy", sortBy);
      params.set("sortOrder", sortOrder);
      params.set("withFilters", "true");

      if (filters.status) params.set("status", filters.status);
      if (filters.productName) params.set("productName", String(filters.productName));
      if (filters.branchName) params.set("branchName", String(filters.branchName));
      if (filters.searchText) params.set("searchText", filters.searchText);

      const response = await fetch(`/api/policies/assit?${params.toString()}`);
      if (!response.ok) {
        throw new Error("Failed to load policies");
      }
      const data = await response.json();
      setPolicies(data.policies || []);
      setStats(data.stats || { count: 0, totalPages: 0 });
      if (data.filterOptions) {
        setFilterOptions(data.filterOptions);
        setFilterOptionsLoading(false);
      }
      setError(false);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to load policies");
    } finally {
      setTableLoading(false);
      setBootstrapping(false);
    }
  }

  const handleSearch = (value: string) => {
    setSearchInput(value || "");
    setFilters(prev => ({ ...prev, searchText: value || "" }));
    setCurrentPage(1); // Reset to first page when searching
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value || "" }));
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

      const response = await fetch(`/api/policies/assit/${id}`, {
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
      setPolicies((prevPolicies) => prevPolicies.filter((p) => p.membershipID !== id));
    } catch (err) {
      console.error("Delete error:", err);
      sweetAlert({
        title: "Error deleting policy",
        text: "Please try again later.",
        icon: "error",
      });
    }
  };

  const editPolicy = (policy: IAssitPolicy) => {
    setEditingPolicy(policy);
    // You can implement edit functionality here
    console.log("Edit policy:", policy);
  };

  const printCard = (policy: IAssitPolicy) => {
    setSelectedPolicyForPrintCard(policy);
    setPrintCardModalOpen(true);
  };

  const [importColumns, setImportColumns] = useState<any[]>([]);
  const [importDrawerOpen, setImportDrawerOpen] = useState(false);
  const [importData, setImportData] = useState<any[]>([]);

  const parseCsv = (file: File) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results: any) => {
        console.log(results);

        // check if the results.data and results.meta.fields is empty
        if (results.data.length === 0 || results.meta.fields.length === 0) {
          message.error("CSV file is empty");
          return;
        }

        const _importColumns = results.meta.fields.filter((field: string) => field !== "").map((field: string) => ({
          title: field,
          dataIndex: field,
          key: field,
        }));

        setImportColumns(_importColumns);
        setImportData(results.data);
        setImportDrawerOpen(true);
      },
    });
  };

  const importPolicies = async () => {
    try {
      const response = await fetch("/api/policies/assit/import", {
        method: "POST",
        body: JSON.stringify(importData),
      });
      const data = await response.json();

      if (data.success) {
        sweetAlert({
          title: "Policies imported successfully",
          icon: "success",
          timer: 2000,
        });
        setImportData([]);
        setImportColumns([]);
        setImportDrawerOpen(false);

        fetchPolicies();
      } else {
        sweetAlert({
          title: "Failed to import policies",
          text: data.message,
          icon: "error",
        });
      }
    } catch (error) {
      console.error("Error importing policies:", error);
      sweetAlert({
        title: "Error importing policies",
        text: "Please try again later.",
        icon: "error",
      });
    }
  };

  useEffect(() => {
    fetchPolicies();
  }, [currentPage, pageSize, sortBy, sortOrder, filters]);

  const uploadProps: UploadProps = {
    name: 'file',
    action: '/api/policies/assit/import',
    headers: {
      authorization: 'authorization-text',
    },
    beforeUpload: (file: File) => {
      parseCsv(file);
      return false;
    },
    onChange(info: any) {
      if (info.file.status !== 'uploading') {
        console.log(info.file, info.fileList);
      }
      if (info.file.status === 'done') {
        message.success(`${info.file.name} file uploaded successfully`);
      } else if (info.file.status === 'error') {
        message.error(`${info.file.name} file upload failed.`);
      }
    },
  };

  return (
    <div className="w-full">
      <div className="w-full flex justify-between mb-8">
        <Space size={32}>
          <Statistic title="Total Policies" value={stats.count} />
          <Statistic
            title="Listed Policies"
            value={policies ? policies.length : 0}
          />
        </Space>
        <div className="flex items-center gap-2">
          {user && hasRole(user, "admin") && <Upload {...uploadProps} accept=".csv">
            <Button icon={<UploadOutlined />} onClick={importPolicies}>Import</Button>
          </Upload>}
          <Button icon={<ReloadOutlined />} onClick={fetchPolicies}>Refresh</Button>
        </div>
      </div>

      {/* Search Results Indicator */}
      {(filters.status || filters.productName || filters.branchName || filters.searchText) && (
        <div style={{
          backgroundColor: "#f0f9ff",
          border: "1px solid #0ea5e9",
          borderRadius: "6px",
          padding: "12px 16px",
          marginBottom: "16px",
          color: "#0c4a6e"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <strong>Search Results:</strong> Showing ASSIT policies matching your filters
              {filters.status && <span style={{ marginLeft: "8px" }}>• Status: {filters.status}</span>}
              {filters.productName && <span style={{ marginLeft: "8px" }}>• Product: {filters.productName}</span>}
              {filters.branchName && <span style={{ marginLeft: "8px" }}>• Branch: {filters.branchName}</span>}
              {filters.searchText && <span style={{ marginLeft: "8px" }}>• Search: "{filters.searchText}"</span>}
              <span style={{ marginLeft: "8px" }}>• {policies.length} results</span>
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
                addonAfter={<SearchOutlined style={{ cursor: "pointer" }} onClick={() => handleSearch(searchInput)} />}
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
                  disabled={!filters.status && !filters.productName && !filters.branchName && !filters.searchText}
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
        onChange={(pagination: any, filters: any, sorter: any) => {
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
          showTotal: (total: number, range: number[]) =>
            `${range[0]}-${range[1]} of ${total} ASSIT policies`,
          onChange: handlePageChange,
          onShowSizeChange: handlePageChange,
          position: ['bottomCenter'],
        }}
        columns={[
          {
            title: "Policy Number",
            dataIndex: "membershipID",
            key: "membershipID",
            sorter: true,
            sortOrder: sortBy === "membershipID" ? (sortOrder as any) : undefined,
            render: (policyNumber: string) => (
              <span className="font-mono font-semibold">{policyNumber}</span>
            ),
          },
          {
            title: "Pay @ Number",
            dataIndex: "payAtNumber",
            key: "payAtNumber",
            sorter: (a: IAssitPolicy, b: IAssitPolicy) => a.payAtNumber?.localeCompare(b.payAtNumber || "") || 0,
          },
          {
            title: "Main Member",
            dataIndex: "fullName",
            key: "fullName",
            sorter: (a: IAssitPolicy, b: IAssitPolicy) => a.fullName?.localeCompare(b.fullName || "") || 0,
            render: (fullName: string, record: IAssitPolicy) => (
              <div className="flex items-center gap-2">
                <UserOutlined className="text-gray-400" />
                <span>{fullName || record.fullName || "N/A"}</span>
              </div>
            ),
          },
          {
            title: "Cover Type",
            dataIndex: "category",
            key: "category",
            sorter: (a: IAssitPolicy, b: IAssitPolicy) => a.category?.localeCompare(b.category || "") || 0,
            render: (category: string) => (
              <Tag color="blue" className="w-fit">
                {category}
              </Tag>
            ),
          },
          {
            title: "Premium",
            dataIndex: "totalPremium",
            key: "totalPremium",
            sorter: (a: IAssitPolicy, b: IAssitPolicy) => a.totalPremium - b.totalPremium,
            render: (totalPremium: number) => (
              <span>{formatToMoneyWithCurrency(totalPremium)}</span>
            ),
          },
          {
            title: "Actions",
            key: "actions",
            render: (_: any, record: IAssitPolicy) => (
              <Dropdown
                menu={{
                  items: [
                    // {
                    //   key: "view",
                    //   icon: <EyeOutlined />,
                    //   label: "View Details",
                    //   onClick: () => setSelectedPolicyId(record._id as string | null),
                    // },
                    // {
                    //   key: "edit",
                    //   icon: <EditOutlined />,
                    //   label: "Edit Policy",
                    //   onClick: () => editPolicy(record),
                    // },
                    {
                      key: "print-card",
                      icon: <PrinterOutlined />,
                      label: "Print Card",
                      onClick: () => printCard(record),
                    },
                    // {
                    //   key: "delete",
                    //   icon: <DeleteOutlined />,
                    //   label: "Delete Policy",
                    //   danger: true,
                    //   onClick: () => deletePolicy(record._id as string, record.payAtNumber as string),
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
      <Drawer
        title="Import Polices" width="93%" placement="right"
        open={importDrawerOpen}
        onClose={() => setImportDrawerOpen(false)}
        footer={
          <Space>
            <Button onClick={() => setImportDrawerOpen(false)}>Cancel</Button>
            <Button type="primary" className="text-black" onClick={() => importPolicies()}>Import</Button>
          </Space>
        }
      >
        <Alert showIcon className="mb-4 rounded-md" banner message="Import the following policies from ASSIT. Please review the policies and make sure they are correct." type="info" />
        <Table columns={importColumns} dataSource={importData} />
      </Drawer>

      {selectedPolicyForPrintCard && (
        <PolicyPrintCardDrawer
          open={printCardModalOpen}
          onClose={() => {
            setPrintCardModalOpen(false);
            setSelectedPolicyForPrintCard(null);
          }}
          policy={selectedPolicyForPrintCard}
        />
      )}
    </div>
  )
}

export default AssitPoliciesPage;