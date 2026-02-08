import { useEffect, useState } from "react";

import {
  LinkOutlined,
  MoreOutlined,
  PrinterOutlined,
  ReloadOutlined,
  SearchOutlined,
  UploadOutlined,
  UserOutlined,
} from "@ant-design/icons";
import {
  Alert,
  Button,
  Col,
  Descriptions,
  Drawer,
  Dropdown,
  Form,
  Input,
  Row,
  Space,
  Statistic,
  Table,
  Tag,
  Upload,
  UploadProps,
  message
} from "antd";
import Papa from "papaparse";
import sweetAlert from "sweetalert";

import { formatToMoneyWithCurrency } from "@/utils/formatters";
import { hasRole } from "@/utils/helpers/hasRole";

import LinkPolicyDrawer from "@/app/components/policies/link-policy-drawer";
import PolicyPrintCardDrawer from "@/app/components/policies/policy-print-card-drawer";
import { IAssitPolicy } from "@/app/models/scheme/assit-policy.schema";
import { useAuth } from "@/context/auth-context";

const AssitPoliciesPage = () => {
  const [policies, setPolicies] = useState<IAssitPolicy[]>([]);
  const [stats, setStats] = useState<{ count: number; totalPages: number }>({
    count: 0,
    totalPages: 0,
  });

  const [assitPolicies, setAssitPolicies] = useState<IAssitPolicy[]>([]);
  const [results, setResults] = useState<{
    matchedCount: number;
    unmatchedCount: number;
    matchedPolicies: IAssitPolicy[];
    unmatchedPolicies: IAssitPolicy[];
    fetchingAssitPolicies: boolean;
    matchingInProgress: boolean;
  }>({
    matchedCount: 0,
    unmatchedCount: 0,
    matchedPolicies: [],
    unmatchedPolicies: [],
    fetchingAssitPolicies: false,
    matchingInProgress: false,
  });

  const [bootstrapping, setBootstrapping] = useState<boolean>(true);
  const [tableLoading, setTableLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | boolean>(false);
  const [filterOptionsLoading, setFilterOptionsLoading] =
    useState<boolean>(true);
  const [searchInput, setSearchInput] = useState("");
  const [selectedPolicyForPrintCard, setSelectedPolicyForPrintCard] =
    useState<IAssitPolicy | null>(null);

  const [printCardDrawerOpen, setPrintCardDrawerOpen] = useState(false);
  const [linkPolicyDrawerOpen, setLinkPolicyDrawerOpen] = useState(false);
  const [selectedPolicyForLinkPolicy, setSelectedPolicyForLinkPolicy] =
    useState<IAssitPolicy | null>(null);

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
      if (filters.productName)
        params.set("productName", String(filters.productName));
      if (filters.branchName)
        params.set("branchName", String(filters.branchName));
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
    setSearchInput("");
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

  const printCard = (policy: IAssitPolicy) => {
    setSelectedPolicyForPrintCard(policy);
    setPrintCardDrawerOpen(true);
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

        const requiredCsvFields = [
          "MembershipID",
          "LastName",
          "Initials",
          "DOB",
          "EntDate",
          "CovDate",
          "KGA Premium",
          "TotalPremium",
          "WPeriod",
          "Category",
          "CoverAmount"
        ];

        const modelFields = [
          "category",
          "coverDate",
          // "createdAt",
          "dateOfBirth",
          "entryDate",
          "fullName",
          // "hasLinkedEasipolPolicy",
          // "hasLinkedSociety",
          "initials",
          "lastName",
          "membershipID",
          // "payAtNumber",
          "totalPremium",
          // "updatedAt",
          "waitingPeriod"
        ]

        const _importColumns = modelFields
          .filter((field: string) => field !== "" && !field.includes("_"))
          .map((field: string) => ({
            title: field,
            dataIndex: field,
            key: field,
          }));

        const cleanData = results.data.filter((row: any) => {
          // Ensure that these fields all have values and not empty string
          return requiredCsvFields.every(field => row[field] && row[field].trim() !== "");
        });

        // Map excel fields to data model fields
        const mappedData = cleanData.map((row: any) => {
          const mappedRow: any = {};
          Object.keys(row).forEach((key) => {
            const lowerKey = key.toLowerCase();
            if (lowerKey.includes("membershipid")) {
              mappedRow.membershipID = row[key];
            } else if (lowerKey.includes("lastname")) {
              mappedRow.lastName = row[key];
            } else if (lowerKey.includes("initials")) {
              mappedRow.initials = row[key];
            } else if (lowerKey.includes("dob")) {
              mappedRow.dateOfBirth = row[key];
            } else if (lowerKey.includes("entdate")) {
              mappedRow.entryDate = row[key];
            } else if (lowerKey.includes("covdate")) {
              mappedRow.coverDate = row[key];
            } else if (lowerKey.includes("premium")) {
              mappedRow.totalPremium = row[key];
            } else if (lowerKey.includes("wperiod")) {
              mappedRow.waitingPeriod = row[key];
            } else if (lowerKey.includes("category")) {
              mappedRow.category = row[key];
            }
          });
          return mappedRow;
        });

        // Set fullName field by combining lastName and initials
        mappedData.forEach((row: any) => {
          row.fullName = `${row.initials} ${row.lastName}`;
        });

        setImportColumns(_importColumns);
        setImportData(mappedData);
        setImportDrawerOpen(true);
      },
    });
  };

  const importPolicies = async () => {
    try {
      const response = await fetch("/api/policies/assit/import", {
        method: "POST",
        body: JSON.stringify(results.unmatchedPolicies),
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

  const handlePolicyReview = async () => {
    setResults((prev) => ({ ...prev, fetchingAssitPolicies: true, matchingInProgress: true }));

    // If you still need the ASSIT fetch for something else, keep it.
    const res = await fetch("/api/policies/assit/all");
    const data = await res.json();
    const existingPolicies = data.policies || [];
    setAssitPolicies(existingPolicies);

    // ✅ do the review using current variables (not state)
    reviewPolicies(importData, existingPolicies);

    setResults((prev) => ({ ...prev, fetchingAssitPolicies: false }));
  };

  const reviewPolicies = (
    importDataParam: any[],
    portalPoliciesParam: any[]
  ) => {
    // Portal membership IDs (already in the portal)
    const portalMembershipIDs = new Set(
      portalPoliciesParam
        .map((p) => (p.membershipID ?? "").toString().trim())
        .filter(Boolean)
    );

    // CSV import rows that ALREADY exist in portal
    const matchedPolicies = importDataParam.filter((p) =>
      portalMembershipIDs.has((p.membershipID ?? "").toString().trim())
    );

    // CSV import rows that are NEW (not in portal)
    const unmatchedPolicies = importDataParam.filter(
      (p) => !portalMembershipIDs.has((p.membershipID ?? "").toString().trim())
    );

    setResults((prev) => ({
      ...prev,
      matchedCount: matchedPolicies.length,
      unmatchedCount: unmatchedPolicies.length,
      matchedPolicies,
      unmatchedPolicies,
      matchingInProgress: false,
    }));

    // ✅ If the goal is to reduce the import list to only new ones:
    setImportData(unmatchedPolicies);

    console.log("matched(import already in portal):", matchedPolicies);
    console.log("unmatched(import NOT in portal):", unmatchedPolicies);

    // Optional: if you ALSO want to compare imported vs fetched ASSIT policies:
    // const assitIDs = new Set(assitPoliciesParam.map(p => (p.membershipID ?? "").toString().trim()));
  };


  useEffect(() => {
    fetchPolicies();
  }, [currentPage, pageSize, sortBy, sortOrder, filters]);

  const uploadProps: UploadProps = {
    name: "file",
    action: "/api/policies/assit/import",
    headers: {
      authorization: "authorization-text",
    },
    beforeUpload: (file: File) => {
      parseCsv(file);
      return false;
    },
    onChange(info: any) {
      if (info.file.status !== "uploading") {
        console.log(info.file, info.fileList);
      }
      if (info.file.status === "done") {
        sweetAlert({
          title: `${info.file.name} file uploaded successfully`,
          icon: "success",
          timer: 2000,
        });
      } else if (info.file.status === "error") {
        sweetAlert({
          title: `${info.file.name} file upload failed`,
          icon: "error",
          timer: 2000,
        });
      }
    },
  };

  return (
    <div className="w-full">
      <div className="mb-8 flex w-full justify-between">
        <Space size={32}>
          <Statistic title="Total Policies" value={stats.count} />
          <Statistic
            title="Listed Policies"
            value={policies ? policies.length : 0}
          />
        </Space>
        <div className="flex items-center gap-2">
          {user && hasRole(user, "admin") && (
            <Upload {...uploadProps} accept=".csv">
              <Button icon={<UploadOutlined />}>
                Select Import File
              </Button>
            </Upload>
          )}
          <Button icon={<ReloadOutlined />} onClick={fetchPolicies}>
            Refresh
          </Button>
        </div>
      </div>

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
          {/* <Col span={6}>
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
          </Col> */}
          <Col span={6}>
            <Form.Item label=" ">
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
                <strong>Search Results:</strong> Showing ASSIT policies matching
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

      <Table
        rowKey="_id"
        bordered
        dataSource={policies}
        loading={tableLoading}
        rowClassName="cursor-pointer hover:bg-gray-50"
        onChange={(pagination: any, filters: any, sorter: any) => {
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
          showTotal: (total: number, range: number[]) =>
            `${range[0]}-${range[1]} of ${total} ASSIT policies`,
          onChange: handlePageChange,
          onShowSizeChange: handlePageChange,
          position: ["bottomCenter"],
        }}
        columns={[
          {
            title: "Policy Number",
            dataIndex: "membershipID",
            key: "membershipID",
            sorter: true,
            sortOrder:
              sortBy === "membershipID" ? (sortOrder as any) : undefined,
            render: (policyNumber: string) => (
              <span className="font-mono font-semibold">{policyNumber}</span>
            ),
          },
          {
            title: "Linked Easipol Policy",
            dataIndex: "linkedEasipolPolicyNumber",
            key: "linkedEasipolPolicyNumber",
            // sorter: (a: IAssitPolicy, b: IAssitPolicy) => a.linkedEasipolPolicyNumber?.localeCompare(b.linkedEasipolPolicyNumber || "") || 0,
            render: (linkedEasipolPolicyNumber: any) => (
              <span className="font-mono font-semibold">
                {linkedEasipolPolicyNumber?.toString() ?? "--"}
              </span>
            ),
          },
          {
            title: "Payat Number",
            dataIndex: "payAtNumber",
            key: "payAtNumber",
            // sorter: (a: IAssitPolicy, b: IAssitPolicy) => a.payAtNumber?.localeCompare(b.payAtNumber || "") || 0,
          },
          {
            title: "Main Member",
            dataIndex: "fullName",
            key: "fullName",
            sorter: (a: IAssitPolicy, b: IAssitPolicy) =>
              a.fullName?.localeCompare(b.fullName || "") || 0,
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
            // sorter: (a: IAssitPolicy, b: IAssitPolicy) => a.category?.localeCompare(b.category || "") || 0,
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
            sorter: (a: IAssitPolicy, b: IAssitPolicy) =>
              a.totalPremium - b.totalPremium,
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
                      key: "link-policy",
                      icon: <LinkOutlined />,
                      label: "Link Policy",
                      onClick: () => {
                        setSelectedPolicyForLinkPolicy(record);
                        setLinkPolicyDrawerOpen(true);
                      },
                    },
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
        title="Import Policies from ASSIT"
        width="100%"
        extra={
          <Space>
            <Descriptions column={4} size="small" bordered>
              <Descriptions.Item label="Total to Import">
                {importData.length}
              </Descriptions.Item>
              <Descriptions.Item label="Total on System">
                {stats.count}
              </Descriptions.Item>
              <Descriptions.Item label="Matched Existing Policies">
                {results.matchedCount}
              </Descriptions.Item>
              <Descriptions.Item label="Unmatched (New) Policies">
                {results.unmatchedCount}
              </Descriptions.Item>
            </Descriptions>
            {results.unmatchedCount === 0 && (
              <Button size="large" type="primary" className="text-black text-sm" onClick={handlePolicyReview} loading={results.fetchingAssitPolicies || results.matchingInProgress}>{results.fetchingAssitPolicies ? "Fetching Policies" : results.matchingInProgress ? "Matching Policies" : "Start Review"}</Button>
            )}
            {results.unmatchedCount > 0 && (
              <Button size="large" type="primary" className="text-black text-sm" onClick={importPolicies}>Import {results.unmatchedCount} New Policies</Button>
            )}
          </Space>
        }
        placement="right"
        open={importDrawerOpen}
        onClose={() => setImportDrawerOpen(false)}
      // footer={
      //   <Space>
      //     <Button onClick={() => setImportDrawerOpen(false)}>Cancel</Button>
      //     <Button
      //       type="primary"
      //       className="text-black"
      //       onClick={() => importPolicies()}
      //     >
      //       Import
      //     </Button>
      //   </Space>
      // }
      >
        <Alert
          showIcon
          className="mb-4 rounded-md"
          banner
          message="Import the following policies from ASSIT. Please review the policies and make sure they are correct."
          type="info"
        />
        <Table columns={importColumns} dataSource={importData} size="small" />
      </Drawer>

      {selectedPolicyForPrintCard && (
        <PolicyPrintCardDrawer
          open={printCardDrawerOpen}
          onClose={() => {
            setPrintCardDrawerOpen(false);
            setSelectedPolicyForPrintCard(null);
          }}
          policy={selectedPolicyForPrintCard}
        />
      )}

      {selectedPolicyForLinkPolicy && (
        <LinkPolicyDrawer
          open={linkPolicyDrawerOpen}
          onClose={() => {
            setLinkPolicyDrawerOpen(false);
            setSelectedPolicyForLinkPolicy(null);
            fetchPolicies();
          }}
          policy={selectedPolicyForLinkPolicy}
        />
      )}
    </div>
  );
};

export default AssitPoliciesPage;
