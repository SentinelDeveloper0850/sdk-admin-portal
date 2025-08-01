"use client";

import { useEffect, useState } from "react";

import {
  DeleteOutlined,
  MailOutlined,
  MoreOutlined,
  PhoneOutlined,
  PlusOutlined,
  StopOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { Avatar, Button } from "@nextui-org/react";
import {
  Button as AntButton,
  Col,
  Drawer,
  Dropdown,
  Form,
  Input,
  Row,
  Space,
  Table,
  Tag
} from "antd";
import axios from "axios";
import { AiOutlineUserAdd } from "react-icons/ai";
import sweetAlert from "sweetalert";

import { capitalizeFirstLetter, getDate, getTime } from "@/utils/formatters";
import { roleLabels } from "@/utils/helpers/roles";
import { withRoleGuard } from "@/utils/utils/with-role-guard";

import PageHeader from "@/app/components/page-header";
import CoreRoleSelect from "@/app/components/roles/core-role-select";
import RoleSelect from "@/app/components/roles/role-select";
import { useAuth } from "@/context/auth-context";

import { ERoles } from "../../../../types/roles.enum";

const UsersPage = () => {
  const [users, setUsers] = useState<any[]>([]);

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [createDrawerOpen, setCreateDrawerOpen] = useState<boolean>(false);
  const [viewDrawerOpen, setViewDrawerOpen] = useState<boolean>(false);

  const [editDrawerOpen, setEditDrawerOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);

  const [form] = Form.useForm();
  const { user } = useAuth();

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/users");
      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.message || "Failed to fetch users");
        return;
      }

      const data = await response.json();

      const updatedUsers = data.users.map((v: any) => {
        const firstRole = v.roles[0] ?? null;
        const isAdmin = v.role === "admin";

        let additionalRoles = [...v.roles];

        if (isAdmin && firstRole === "member") {
          additionalRoles.shift();
        }

        return {
          ...v,
          roles: additionalRoles,
        };
      });

      setUsers(updatedUsers);
    } catch (err) {
      console.log(err);
      setError("An error occurred while fetching users.");
    } finally {
      setLoading(false);
    }
  };

  const deactivateUser = async (id: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/users`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id, status: "Inactive" }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.message || "Failed to deactivate user");
        return;
      }

      const data = await response.json();
      setUsers(data.users);
    } catch (err) {
      console.log(err);
      setError("An error occurred while attempting to deactivate the user.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleSubmitForm = () => {
    form.submit();
  };

  const handleCancel = () => {
    form.resetFields();
    setCreateDrawerOpen(false);
  };

  const handleSubmit = async (values: any) => {
    try {
      console.log("🚀 ~ handleSubmit ~ values:", values);

      const { firstNames, lastname, ...rest } = values;

      const name = `${firstNames} ${lastname}`;

      const response = await axios.post(
        "/api/users",
        JSON.stringify({
          ...rest,
          name,
        }),
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (response.status != 201) {
        console.log("Create user response", response);
        sweetAlert({
          title: "Failed to create new user!",
          text: response.data.message,
          icon: "error",
        });
        return;
      }

      const data = response.data;

      sweetAlert({
        title: "User created successfully!",
        icon: "success",
        timer: 2000,
      });

      const updatedUsers = [data.user, ...users];
      setUsers(updatedUsers);

      handleCancel(); // Navigate back to the Vehicles page
    } catch (error: any) {
      console.error(error);
      sweetAlert({
        title: "Failed to create new user!",
        text: error?.response?.data?.message,
        icon: "error",
      });
    }
  };

  const handleUpdate = async (values: any) => {
    try {
      const { firstNames, lastname, ...rest } = values;
      const name = `${firstNames} ${lastname}`;

      const response = await axios.put(
        "/api/users",
        JSON.stringify({
          ...rest,
          id: editingUser._id,
          name,
        }),
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (response.status !== 200) {
        sweetAlert({
          title: "Failed to update user!",
          text: response.data.message,
          icon: "error",
        });
        return;
      }

      sweetAlert({
        title: "User updated successfully!",
        icon: "success",
        timer: 2000,
      });

      setUsers((prev) =>
        prev.map((u) => (u._id === editingUser._id ? response.data.user : u))
      );

      form.resetFields();
      setEditDrawerOpen(false);
      setEditingUser(null);
    } catch (error: any) {
      console.error(error);
      sweetAlert({
        title: "Failed to update user!",
        text: error?.response?.data?.message,
        icon: "error",
      });
    }
  };

  const deleteUser = async (id: string) => {
    try {
      const confirmed = await sweetAlert({
        title: "Are you sure?",
        text: "This will remove the user from the system.",
        icon: "warning",
        buttons: ["Cancel", "Yes, delete it!"],
        dangerMode: true,
      });

      if (!confirmed) return;

      const deletedBy = user?._id?.toString();

      const response = await fetch(`/api/users`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, deletedBy }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        sweetAlert({
          title: "Failed to delete user!",
          text: errorData.message,
          icon: "error",
        });
        return;
      }

      sweetAlert({
        title: "User deleted",
        icon: "success",
        timer: 2000,
      });

      // 🔥 Remove from UI without re-fetching
      setUsers((prevUsers) => prevUsers.filter((u) => u._id !== id));
    } catch (err) {
      console.error("Delete error:", err);
      sweetAlert({
        title: "Error deleting user",
        text: "Please try again later.",
        icon: "error",
      });
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <PageHeader
        title="Manage Users"
        subtitle="Create, update, and delete Users from your system"
        actions={[
          <Button size="sm" onClick={() => setCreateDrawerOpen(true)}>
            <PlusOutlined /> New User
          </Button>,
        ]}
      />

      <Table
        rowKey="_id"
        bordered
        dataSource={users}
        rowClassName="cursor-pointer hover:bg-gray-100"
        columns={[
          {
            title: "Full Names",
            dataIndex: "name",
            key: "name",
            sorter: (a, b) => a.name.localeCompare(b.name),
            render: (name, user) => {
              return (
                <div className="flex items-center gap-4">
                  <Avatar
                    src={user.avatarUrl}
                    size="sm"
                    isBordered
                    radius="full"
                  />
                  <span className="text-sm">{name ?? "Unnamed"}</span>
                </div>
              );
            },
          },
          {
            title: "Email",
            dataIndex: "email",
            key: "email",
            sorter: (a, b) => a.email.localeCompare(b.email),
          },
          {
            title: "Roles",
            dataIndex: "role",
            key: "role",
            render: (value: string, record: any) => (
              <Tag className="w-fit" color={value == "admin" ? "gold" : "blue"}>
                {capitalizeFirstLetter(value)}
              </Tag>
            ),
            sorter: (a, b) => a.role.localeCompare(b.role),
          },
          {
            title: "Status",
            dataIndex: "status",
            key: "status",
            render: (value: string) => (
              <Tag color={value == "Active" ? "green" : "red"}>{value}</Tag>
            ),
            sorter: (a, b) => a.status.localeCompare(b.role),
          },
          {
            title: "Date Created",
            dataIndex: "createdAt",
            key: "createdAt",
            render: (value: string) => (
              <span>
                {getDate(value)} {getTime(value)}
              </span>
            ),
            sorter: (a, b) =>
              new Date(a.date).getTime() - new Date(b.date).getTime(),
          },
          {
            title: "Actions",
            key: "actions",
            render: (_: any, record: any) => (
              <Dropdown
                menu={{
                  items: [
                    {
                      key: "edit",
                      icon: <UserOutlined />,
                      label: "Edit",
                      onClick: () => {
                        form.setFieldsValue({
                          firstNames: record.name
                            .split(" ")
                            .slice(0, -1)
                            .join(" "),
                          lastname: record.name.split(" ").slice(-1).join(" "),
                          email: record.email,
                          phone: record.phone,
                          role: record.role,
                          roles: record.roles,
                        });
                        setEditingUser(record);
                        setEditDrawerOpen(true);
                      }
                    },
                    ...(record.status === "Active" ? [{
                      key: "deactivate",
                      icon: <StopOutlined />,
                      label: "Deactivate",
                      onClick: () => deactivateUser(record._id)
                    }] : []),
                    {
                      key: "delete",
                      icon: <DeleteOutlined />,
                      label: "Delete",
                      danger: true,
                      onClick: () => deleteUser(record._id)
                    }
                  ]
                }}
                trigger={["click"]}
              >
                <AntButton icon={<MoreOutlined />} />
              </Dropdown>
            ),
          },
        ]}
        expandable={{
          expandedRowRender: (record: any) =>
            record.roles ? (
              <div className="ml-0 gap-1 whitespace-pre-wrap p-0 text-gray-700">
                🛡️<strong className="ml-1 mr-2">Additional Roles:</strong>
                {record.roles.map((role: string, index: number) => (
                  <Tag key={`${record._id}-${role}-${index}`} className="w-fit">{roleLabels[role]}</Tag>
                ))}
              </div>
            ) : (
              <i className="text-gray-400">No additional roles assigned.</i>
            ),
          rowExpandable: (record) =>
            !!record.roles &&
            record.roles.length > 0 &&
            record.roles[0] !== record.role,
        }}
      />

      <Drawer
        styles={{
          header: {
            background: "rgb(255 172 0 / 0.75)",
          },
        }}
        title={
          <Space>
            <AiOutlineUserAdd
              fontSize="2em"
              width="2em"
              height="2em"
              color="black"
            />
            <div>
              <h2 className="text-medium font-semibold text-black">
                Invite User
              </h2>
              <p className="text-xs font-normal text-gray-800">
                Invite a new user to the team
              </p>
            </div>
          </Space>
        }
        placement="right"
        closable={false}
        onClose={handleCancel}
        open={createDrawerOpen}
        width="50%"
        footer={
          <Space>
            <Button color="danger" size="md" onClick={handleCancel}>
              Cancel
            </Button>
            <Button color="primary" size="md" onClick={handleSubmitForm}>
              Submit
            </Button>
          </Space>
        }
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="First Names"
                name="firstNames"
                rules={[
                  {
                    required: true,
                    message: "Required",
                  },
                ]}
              >
                <Input suffix={<UserOutlined />} value={user?.name} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Surname"
                name="lastname"
                rules={[
                  {
                    required: true,
                    message: "Required",
                  },
                ]}
              >
                <Input suffix={<UserOutlined />} value={user?.name} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Email Address"
                name="email"
                rules={[
                  {
                    required: true,
                    message: "Required",
                  },
                  {
                    type: "email",
                  },
                ]}
              >
                <Input suffix={<MailOutlined />} value={user?.name} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Phone Number"
                name="phone"
                rules={[
                  {
                    required: true,
                    message: "Required",
                  },
                  {
                    len: 10,
                  },
                ]}
              >
                <Input suffix={<PhoneOutlined />} value={user?.name} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Primary Role"
                name="role"
                rules={[
                  {
                    required: true,
                    message: "Required",
                  },
                ]}
              >
                <CoreRoleSelect />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Additional Roles" name="roles">
                <RoleSelect />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Drawer>

      <Drawer
        title="Update User"
        placement="right"
        closable={false}
        onClose={() => {
          setEditDrawerOpen(false);
          setEditingUser(null);
          form.resetFields();
        }}
        open={editDrawerOpen}
        width="50%"
        footer={
          <Space>
            <Button
              color="danger"
              size="md"
              onClick={() => setEditDrawerOpen(false)}
            >
              Cancel
            </Button>
            <Button color="primary" size="md" onClick={() => form.submit()}>
              Save Changes
            </Button>
          </Space>
        }
      >
        <Form form={form} layout="vertical" onFinish={handleUpdate}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="First Names"
                name="firstNames"
                rules={[{ required: true, message: "Required" }]}
              >
                <Input suffix={<UserOutlined />} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Surname"
                name="lastname"
                rules={[{ required: true, message: "Required" }]}
              >
                <Input suffix={<UserOutlined />} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Email Address"
                name="email"
                rules={[
                  { required: true, message: "Required" },
                  { type: "email" },
                ]}
              >
                <Input suffix={<MailOutlined />} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Phone Number"
                name="phone"
                rules={[{ required: true, message: "Required" }, { len: 10 }]}
              >
                <Input suffix={<PhoneOutlined />} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Primary Role"
                name="role"
                rules={[{ required: true, message: "Required" }]}
              >
                <CoreRoleSelect />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Additional Roles" name="roles">
                <RoleSelect />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Drawer>
    </div>
  );
};

export default withRoleGuard(UsersPage, [ERoles.Admin, ERoles.HRManager]);
