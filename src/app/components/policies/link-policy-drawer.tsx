import { Button, Drawer, Form, Input, Space, Table } from "antd";
import { IAssitPolicy } from "@/app/models/scheme/assit-policy.schema";
import { useEffect, useState } from "react";
import { SearchOutlined, UserOutlined } from "@ant-design/icons";
import { IEasipolPolicy } from "@/app/(protected)/policies/view/EasipolPolicies";
import sweetAlert from "sweetalert";

interface Props {
  open: boolean;
  onClose: () => void;
  policy: IAssitPolicy;
}

const LinkPolicyDrawer = ({ open, onClose, policy }: Props) => {
  const [form] = Form.useForm();
  const [searchInput, setSearchInput] = useState("");
  const [easipolPolicies, setEasipolPolicies] = useState<IEasipolPolicy[]>([]);

  // Pagination and filtering state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortBy, setSortBy] = useState("policyNumber");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [filters, setFilters] = useState({
    searchText: "",
  });


  const handleSearch = (value: string) => {
    setSearchInput(value || "");
    setFilters(prev => ({ ...prev, searchText: value || "" }));
    setCurrentPage(1); // Reset to first page when searching
    fetchEasipolPolicies();
  };

  const handleClearFilters = () => {
    setFilters({ searchText: "" });
    setCurrentPage(1);
    fetchEasipolPolicies();
  }

  const handleLink = async (id: string) => {
    sweetAlert({
      title: "Link Policy",
      text: "Are you sure you want to link this policy?",
      icon: "warning",
      buttons: ["Cancel", "Link"],
    }).then(async (value) => {
      if (value) {
        const response = await fetch(`/api/policies/assit/link-policy`, {
          method: "POST",
          body: JSON.stringify({
            assitPolicyId: policy._id,
            easipolPolicyId: id,
          }),
        });
        const data = await response.json();
        if (data.success) {
          sweetAlert({
            title: data.message,
            icon: "success",
            timer: 2000,
          });
          onClose();
        } else {
          sweetAlert({
            title: data.message,
            icon: "error",
            timer: 2000,
          });
        }
      }
    });
  }

  const fetchEasipolPolicies = async () => {
    const response = await fetch(`/api/policies/easipol?page=${currentPage}&pageSize=${pageSize}&sortBy=${sortBy}&sortOrder=${sortOrder}&searchText=${searchInput}`);
    const data = await response.json();
    setEasipolPolicies(data.policies);
  }

  const columns = [
    {
      title: "Policy Number",
      dataIndex: "policyNumber",
      key: "policyNumber",
    },
    {
      title: "EasyPay Number",
      dataIndex: "easypayNumber",
      key: "easypayNumber",
    },
    {
      title: "Main Member",
      dataIndex: "fullName",
      key: "fullName",
      sorter: (a: IEasipolPolicy, b: IEasipolPolicy) => a.fullName?.localeCompare(b.fullName || "") || 0,
      render: (fullName: string, record: IEasipolPolicy) => (
        <div className="flex items-center gap-2">
          <UserOutlined className="text-gray-400" />
          <span>{fullName || record.fullname || "N/A"}</span>
        </div>
      ),
    },
    {
      title: "Actions",
      dataIndex: "actions",
      key: "actions",
      render: (_: any, record: IEasipolPolicy) => (
        <Button type="link" onClick={() => handleLink(record._id)}>Link Policy</Button>
      ),
    }
  ];

  return (
    <Drawer
      title="Link Policy"
      placement="right"
      width="60%"
      onClose={onClose}
      open={open} destroyOnClose={true}
      extra={
        <Space>
          <Button onClick={onClose}>Close</Button>
        </Space>
      }
    >
      <Form form={form} layout="vertical">
        <p className="text-md font-medium mb-4">Search for an Easipol policy to link</p>

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
      </Form>
      <p className="text-md font-medium mb-4">Search results:</p>

      {/* Search Results Indicator */}
      {(filters.searchText) && (
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
              <strong>Search Results:</strong> Showing Easipol policies matching your search term
              {filters.searchText && <span style={{ marginLeft: "8px" }}>• Search: "{filters.searchText}"</span>}
              <span style={{ marginLeft: "8px" }}>• {easipolPolicies.length} results</span>
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
        dataSource={easipolPolicies}
        columns={columns}
        pagination={{
          pageSize: 10,
        }}
      />
    </Drawer>
  )
}

export default LinkPolicyDrawer;