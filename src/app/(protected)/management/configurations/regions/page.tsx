"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { PlusOutlined, ReloadOutlined, SaveOutlined } from "@ant-design/icons";
import {
  Button,
  Drawer,
  Form,
  Input,
  Popconfirm,
  Select,
  Space,
  Spin,
  Switch,
  Table,
  Tag,
  Tooltip,
  message,
} from "antd";
import { Delete, Edit, User as UserIcon } from "lucide-react";
import sweetAlert from "sweetalert";

import { withRoleGuard } from "@/utils/utils/with-role-guard";

import PageHeader from "@/app/components/page-header";
import { IUser } from "@/app/models/auth/user.schema";
import { useAuth } from "@/context/auth-context";
import { debounce, deriveRegionCode } from "@/lib/utils";

import { ERoles } from "@/types/roles.enum";

const { Option } = Select;

type Province =
  | "Gauteng"
  | "Western Cape"
  | "KwaZulu-Natal"
  | "Eastern Cape"
  | "Free State"
  | "Mpumalanga"
  | "Limpopo"
  | "North West"
  | "Northern Cape";

interface RegionConfig {
  _id: string; // mongo _id
  id: string; // business id
  name: string;
  code: string;
  province?: Province;
  manager?: string | { _id: string; name?: string; email?: string };
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  updatedBy?: string;
}

interface User extends IUser {
  _id: string;
}

const PROVINCES: Province[] = [
  "Gauteng",
  "Western Cape",
  "KwaZulu-Natal",
  "Eastern Cape",
  "Free State",
  "Mpumalanga",
  "Limpopo",
  "North West",
  "Northern Cape",
];

const RegionsPage = () => {
  const { user } = useAuth();

  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);

  const [regions, setRegions] = useState<RegionConfig[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  const [addDrawerOpen, setAddDrawerOpen] = useState(false);
  const [editDrawerOpen, setEditDrawerOpen] = useState(false);

  const [editingRegion, setEditingRegion] = useState<RegionConfig | null>(null);
  const [originalRegionData, setOriginalRegionData] =
    useState<Partial<RegionConfig> | null>(null);

  const [addForm] = Form.useForm();
  const [editForm] = Form.useForm();

  // Tracks whether the user manually edited the code (so we stop auto-overwriting)
  const codeManuallyEditedRef = useRef(false);
  const editCodeManuallyEditedRef = useRef(false);

  const lastSuggestedAddCodeRef = useRef<string | null>(null);
  const lastSuggestedEditCodeRef = useRef<string | null>(null);

  const fetchRegions = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/configurations/regions");
      const data = await response.json();

      if (data?.success && data?.data) {
        setRegions(data.data);
      } else {
        sweetAlert({
          title: "Error",
          text: data?.error || "Failed to fetch regions",
          icon: "error",
        });
      }
    } catch (error) {
      console.error("Error fetching regions:", error);
      sweetAlert({
        title: "Error",
        text: "An error occurred while fetching regions.",
        icon: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/users");
      if (!response.ok) {
        const errorData = await response.json();
        sweetAlert({
          title: "Error",
          text: errorData?.message || "Failed to fetch users",
          icon: "error",
        });
        return;
      }

      const data = await response.json();

      // Keep your existing normalization for roles
      const updatedUsers = (data || []).map((v: any) => {
        const firstRole = v.roles?.[0] ?? null;
        const isAdmin = v.role === "admin";

        let additionalRoles = Array.isArray(v.roles) ? [...v.roles] : [];

        if (isAdmin && firstRole === "member") {
          additionalRoles.shift();
        }

        return { ...v, roles: additionalRoles };
      });

      setUsers(updatedUsers);
    } catch (err) {
      console.log(err);
      sweetAlert({
        title: "Error",
        text: "An error occurred while fetching users.",
        icon: "error",
      });
    }
  };

  useEffect(() => {
    fetchRegions();
    fetchUsers();
  }, []);

  const handleRefresh = () => {
    fetchRegions();
    fetchUsers();
  };

  const getManagerLabel = (manager: RegionConfig["manager"]) => {
    if (!manager) return "--";
    if (typeof manager === "string") {
      const u = users.find((x) => x._id === manager);
      return u?.name || manager;
    }
    return manager?.name || manager?._id || "--";
  };

  const handleSaveRegion = async (values: any) => {
    try {
      setSaving(true);

      const response = await fetch("/api/configurations/regions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...values,
          createdBy: user?._id, // your API can ignore this and use auth user
        }),
      });

      const data = await response.json();

      if (data?.success) {
        sweetAlert({
          title: "Success",
          text: "Region saved successfully",
          icon: "success",
        });
        addForm.resetFields();
        setAddDrawerOpen(false);
        fetchRegions();
      } else {
        sweetAlert({
          title: "Error",
          text: data?.error || "Failed to save region",
          icon: "error",
        });
      }
    } catch (error) {
      console.error("Error saving region:", error);
      sweetAlert({
        title: "Error",
        text: "An error occurred while saving region",
        icon: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleEditRegion = (region: RegionConfig) => {
    setEditingRegion(region);

    const managerValue =
      typeof region.manager === "string" ? region.manager : region.manager?._id;

    setOriginalRegionData({
      name: region.name,
      code: region.code,
      province: region.province,
      manager: managerValue,
      isActive: region.isActive,
    });

    editForm.setFieldsValue({
      name: region.name,
      code: region.code,
      province: region.province,
      manager: managerValue,
      isActive: region.isActive,
    });

    setEditDrawerOpen(true);
    editCodeManuallyEditedRef.current = false;
  };

  const handleUpdateRegion = async (values: any) => {
    if (!editingRegion || !originalRegionData) return;

    try {
      setSaving(true);

      const dirtied: any = {};
      Object.keys(values).forEach((key) => {
        if (values[key] !== (originalRegionData as any)[key]) {
          dirtied[key] = values[key];
        }
      });

      if (Object.keys(dirtied).length === 0) {
        message.info("No changes detected");
        return;
      }

      const response = await fetch(
        `/api/configurations/regions/${editingRegion._id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...dirtied, updatedBy: user?._id }),
        }
      );

      const data = await response.json();

      if (data?.success) {
        sweetAlert({
          title: "Success",
          text: "Region updated successfully",
          icon: "success",
        });
        setEditDrawerOpen(false);
        setEditingRegion(null);
        setOriginalRegionData(null);
        editForm.resetFields();
        fetchRegions();
      } else {
        sweetAlert({
          title: "Error",
          text: data?.error || "Failed to update region",
          icon: "error",
        });
      }
    } catch (error) {
      console.error("Error updating region:", error);
      sweetAlert({
        title: "Error",
        text: "An error occurred while updating region",
        icon: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteRegion = async (id: string) => {
    try {
      const response = await fetch(`/api/configurations/regions/${id}`, {
        method: "DELETE",
      });
      const data = await response.json();

      if (data?.success) {
        sweetAlert({
          title: "Success",
          text: "Region deleted successfully",
          icon: "success",
        });
        fetchRegions();
      } else {
        sweetAlert({
          title: "Error",
          text: data?.error || "Failed to delete region",
          icon: "error",
        });
      }
    } catch (error) {
      console.error("Error deleting region:", error);
      sweetAlert({
        title: "Error",
        text: "An error occurred while deleting region",
        icon: "error",
      });
    }
  };

  const columns = useMemo(
    () => [
      {
        title: "Name",
        dataIndex: "name",
        key: "name",
        sorter: (a: RegionConfig, b: RegionConfig) =>
          a.name.localeCompare(b.name),
      },
      {
        title: "Code",
        dataIndex: "code",
        key: "code",
        render: (text: string) => <Tag color="blue">{text}</Tag>,
        sorter: (a: RegionConfig, b: RegionConfig) =>
          a.code.localeCompare(b.code),
      },
      {
        title: "Province",
        dataIndex: "province",
        key: "province",
        render: (value: string) =>
          value ? (
            <Tag>{value}</Tag>
          ) : (
            <span className="text-gray-400">--</span>
          ),
        filters: PROVINCES.map((p) => ({ text: p, value: p })),
        onFilter: (value: any, record: RegionConfig) =>
          record.province === value,
      },
      {
        title: "Manager",
        dataIndex: "manager",
        key: "manager",
        render: (_: any, record: RegionConfig) =>
          getManagerLabel(record.manager),
      },
      {
        title: "Status",
        dataIndex: "isActive",
        key: "isActive",
        render: (isActive: boolean) => (
          <Tag color={isActive ? "green" : "red"}>
            {isActive ? "Active" : "Inactive"}
          </Tag>
        ),
        filters: [
          { text: "Active", value: true },
          { text: "Inactive", value: false },
        ],
        onFilter: (value: any, record: RegionConfig) =>
          record.isActive === value,
      },
      {
        title: "Actions",
        key: "actions",
        render: (_: any, record: RegionConfig) => (
          <Space>
            <Tooltip title="Edit">
              <Button
                type="text"
                icon={<Edit size={16} />}
                onClick={() => handleEditRegion(record)}
              />
            </Tooltip>
            <Popconfirm
              title="Are you sure you want to delete this region?"
              onConfirm={() => handleDeleteRegion(record._id)}
              okText="Yes"
              cancelText="No"
            >
              <Tooltip title="Delete">
                <Button type="text" danger icon={<Delete size={16} />} />
              </Tooltip>
            </Popconfirm>
          </Space>
        ),
      },
    ],
    [users]
  );

  // Debounced updater for the Add form
  const suggestAddCode = useMemo(
    () =>
      debounce((name: string) => {
        if (codeManuallyEditedRef.current) return;

        const suggested = deriveRegionCode(name, {
          maxLength: 3,
          fallbackLength: 3,
        });
        if (!suggested) return;

        const currentCode = (addForm.getFieldValue("code") || "")
          .trim()
          .toUpperCase();
        const lastSuggested = lastSuggestedAddCodeRef.current;

        // Fill if empty OR still equals our last suggestion
        if (!currentCode || (lastSuggested && currentCode === lastSuggested)) {
          addForm.setFieldsValue({ code: suggested });
          lastSuggestedAddCodeRef.current = suggested;
        }
      }, 300),
    [addForm]
  );

  const suggestEditCode = useMemo(
    () =>
      debounce((name: string) => {
        if (editCodeManuallyEditedRef.current) return;

        const suggested = deriveRegionCode(name, {
          maxLength: 3,
          fallbackLength: 3,
        });
        if (!suggested) return;

        const currentCode = (editForm.getFieldValue("code") || "")
          .trim()
          .toUpperCase();
        const lastSuggested = lastSuggestedEditCodeRef.current;

        if (!currentCode || (lastSuggested && currentCode === lastSuggested)) {
          editForm.setFieldsValue({ code: suggested });
          lastSuggestedEditCodeRef.current = suggested;
        }
      }, 300),
    [editForm]
  );

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div style={{ padding: 20 }}>
      <PageHeader
        title="Region Configurations"
        subtitle="Manage operational regions (groupings of branches)"
        actions={[
          <Button
            key="refresh"
            icon={<ReloadOutlined />}
            onClick={handleRefresh}
          >
            Refresh
          </Button>,
          <Button
            key="add-region"
            type="primary"
            className="text-black"
            icon={<PlusOutlined />}
            onClick={() => {
              codeManuallyEditedRef.current = false;
              setAddDrawerOpen(true);
            }}
          >
            Add Region
          </Button>,
        ]}
      />

      <Table
        dataSource={regions}
        columns={columns as any}
        rowKey="_id"
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showQuickJumper: true,
        }}
      />

      {/* Add Drawer */}
      <Drawer
        title="Add Region"
        open={addDrawerOpen}
        onClose={() => {
          setAddDrawerOpen(false);
          addForm.resetFields();
          codeManuallyEditedRef.current = false;
        }}
        destroyOnClose
        footer={
          <div className="flex justify-end gap-2 border-t border-gray-200 pt-4 dark:border-gray-700">
            <Button
              onClick={() => {
                setAddDrawerOpen(false);
                addForm.resetFields();
                codeManuallyEditedRef.current = false;
              }}
            >
              Cancel
            </Button>
            <Button
              type="primary"
              onClick={() => addForm.submit()}
              loading={saving}
              icon={<SaveOutlined />}
            >
              Save
            </Button>
          </div>
        }
      >
        <Form
          form={addForm}
          layout="vertical"
          onFinish={handleSaveRegion}
          className="grid grid-cols-1 gap-4"
        >
          <Form.Item
            name="name"
            label="Region Name"
            rules={[{ required: true, message: "Please enter region name" }]}
          >
            <Input
              placeholder="e.g. South Coast"
              allowClear
              onChange={(e) => {
                // user is typing name → suggest code
                suggestAddCode(e.target.value);
              }}
            />
          </Form.Item>

          <Form.Item
            name="code"
            label="Region Code"
            rules={[{ required: true, message: "Please enter region code" }]}
          >
            <Input
              placeholder="e.g. SC001"
              allowClear
              onChange={(e) => {
                // once user touches code, stop auto-suggest
                codeManuallyEditedRef.current = true;
                addForm.setFieldsValue({ code: e.target.value.toUpperCase() });
              }}
            />
          </Form.Item>

          <Form.Item name="province" label="Province">
            <Select placeholder="Select province" allowClear>
              {PROVINCES.map((p) => (
                <Option key={p} value={p}>
                  {p}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item name="manager" label="Region Manager">
            <Select
              placeholder="Select region manager"
              allowClear
              suffixIcon={<UserIcon size={16} />}
            >
              {users.map((u, idx) => (
                <Option key={u._id || idx} value={u._id}>
                  {u.name as any}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="isActive"
            label="Active"
            valuePropName="checked"
            initialValue={true}
          >
            <Switch />
          </Form.Item>
        </Form>
      </Drawer>

      {/* Edit Drawer */}
      <Drawer
        title="Edit Region"
        open={editDrawerOpen}
        onClose={() => {
          setEditDrawerOpen(false);
          setEditingRegion(null);
          setOriginalRegionData(null);
          editForm.resetFields();
          editCodeManuallyEditedRef.current = false;
        }}
        destroyOnClose
        width={520}
        footer={
          <div className="flex justify-end gap-2 border-t border-gray-200 pt-4 dark:border-gray-700">
            <Button
              onClick={() => {
                setEditDrawerOpen(false);
                setEditingRegion(null);
                setOriginalRegionData(null);
                editForm.resetFields();
                editCodeManuallyEditedRef.current = false;
              }}
            >
              Cancel
            </Button>
            <Button
              type="primary"
              onClick={() => editForm.submit()}
              loading={saving}
              icon={<SaveOutlined />}
            >
              Update
            </Button>
          </div>
        }
      >
        <Form
          form={editForm}
          layout="vertical"
          onFinish={handleUpdateRegion}
          className="grid grid-cols-1 gap-4"
        >
          <Form.Item name="name" label="Region Name">
            <Input
              placeholder="e.g. South Coast"
              allowClear
              onChange={(e) => {
                // user is typing name → suggest code
                suggestEditCode(e.target.value);
              }}
            />
          </Form.Item>

          <Form.Item name="code" label="Region Code">
            <Input
              placeholder="e.g. SC001"
              allowClear
              onChange={(e) => {
                // once user touches code, stop auto-suggest
                editCodeManuallyEditedRef.current = true;
                editForm.setFieldsValue({ code: e.target.value.toUpperCase() });
              }}
            />
          </Form.Item>

          <Form.Item name="province" label="Province">
            <Select placeholder="Select province" allowClear>
              {PROVINCES.map((p) => (
                <Option key={p} value={p}>
                  {p}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item name="manager" label="Region Manager">
            <Select
              placeholder="Select region manager"
              allowClear
              suffixIcon={<UserIcon size={16} />}
            >
              {users.map((u, idx) => (
                <Option key={u._id || idx} value={u._id}>
                  {u.name as any}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item name="isActive" label="Active" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Drawer>
    </div>
  );
};

export default withRoleGuard(RegionsPage, [ERoles.Admin]);
