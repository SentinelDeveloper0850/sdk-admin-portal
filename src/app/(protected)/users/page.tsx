"use client";

import { useEffect, useState } from "react";

import {
  DeleteOutlined,
  LockOutlined,
  MailOutlined,
  MoreOutlined,
  PhoneOutlined,
  PlusOutlined,
  ReloadOutlined,
  StopOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { Avatar, Button, Switch } from "@nextui-org/react";
import {
  Button as AntButton,
  Col,
  Drawer,
  Dropdown,
  Form,
  Input,
  Row,
  Select,
  Space,
  Table,
  Tag,
} from "antd";
import axios from "axios";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { ListChecks } from "lucide-react";
import { AiOutlineUserAdd } from "react-icons/ai";
import sweetAlert from "sweetalert";

import { capitalizeFirstLetter } from "@/utils/formatters";
import { roleLabels } from "@/utils/helpers/roles";
import { withRoleGuard } from "@/utils/utils/with-role-guard";

import PageHeader from "@/app/components/page-header";
import CoreRoleSelect from "@/app/components/roles/core-role-select";
import RoleSelect from "@/app/components/roles/role-select";
import { useAuth } from "@/context/auth-context";

import { ERoles } from "../../../types/roles.enum";

const UsersPage = () => {
  dayjs.extend(relativeTime);
  const [users, setUsers] = useState<any[]>([]);

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [createDrawerOpen, setCreateDrawerOpen] = useState<boolean>(false);
  const [viewDrawerOpen, setViewDrawerOpen] = useState<boolean>(false);

  const [editDrawerOpen, setEditDrawerOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);

  const [assignmentDrawerOpen, setAssignmentDrawerOpen] =
    useState<boolean>(false);
  const [assignmentUserId, setAssignmentUserId] = useState<string | null>(null);

  const [form] = Form.useForm();
  const [assignmentForm] = Form.useForm();

  const { user } = useAuth();
  const [showDeleted, setShowDeleted] = useState<boolean>(false);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/users${showDeleted ? "?deleted=true" : ""}`
      );
      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.message || "Failed to fetch users");
        return;
      }

      const data = await response.json();

      const updatedUsers = data.map((v: any) => {
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
      setError("An error occurred while fetching users.");
    } finally {
      setLoading(false);
    }
  };

  const toggleUserStatus = async (id: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === "Active" ? "Inactive" : "Active";
      const action = currentStatus === "Active" ? "deactivate" : "activate";

      const confirmed = await sweetAlert({
        title: `Are you sure?`,
        text: `This will ${action} the user's account.`,
        icon: "warning",
        buttons: ["Cancel", `Yes, ${action} it!`],
        dangerMode: action === "deactivate",
      });

      if (!confirmed) return;

      setLoading(true);
      const response = await fetch(`/api/users`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id, status: newStatus }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        sweetAlert({
          title: `Failed to ${action} user!`,
          text: errorData.message || `Failed to ${action} user`,
          icon: "error",
        });
        return;
      }

      const data = await response.json();

      // Update the user in the local state
      setUsers((prevUsers) =>
        prevUsers.map((user) =>
          user._id === id ? { ...user, status: newStatus } : user
        )
      );

      sweetAlert({
        title: `User ${action}d successfully!`,
        icon: "success",
        timer: 2000,
      });
    } catch (err) {
      sweetAlert({
        title: "Error",
        text: `An error occurred while attempting to execute the action.`,
        icon: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [showDeleted]);

  const handleSubmitForm = () => {
    form.submit();
  };

  const handleCancel = () => {
    form.resetFields();
    setCreateDrawerOpen(false);
  };

  const handleSubmit = async (values: any) => {
    try {
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
      sweetAlert({
        title: "Failed to update user!",
        text: error?.response?.data?.message,
        icon: "error",
      });
    }
  };

  const resetPassword = async (id: string, userName: string) => {
    try {
      const confirmed = await sweetAlert({
        title: "Reset Password",
        text: `Are you sure you want to reset the password for ${userName}? A new temporary password will be generated and sent to their email.`,
        icon: "warning",
        buttons: ["Cancel", "Yes, reset it!"],
        dangerMode: false,
      });

      if (!confirmed) return;

      setLoading(true);

      const response = await fetch(`/api/users/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: id }),
      });

      const data = await response.json();

      if (!response.ok) {
        sweetAlert({
          title: "Failed to reset password!",
          text: data.message,
          icon: "error",
        });
        return;
      }

      if (data.warning) {
        sweetAlert({
          title: "Password Reset Successful",
          text: `${data.message}. ${data.warning}`,
          icon: "warning",
        });
      } else {
        sweetAlert({
          title: "Password Reset Successful",
          text: data.message,
          icon: "success",
          timer: 3000,
        });
      }
    } catch (err) {
      sweetAlert({
        title: "Error resetting password",
        text: "Please try again later.",
        icon: "error",
      });
    } finally {
      setLoading(false);
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
      sweetAlert({
        title: "Error deleting user",
        text: "Please try again later.",
        icon: "error",
      });
    }
  };

  const openAssignmentDrawer = (id: string) => {
    setAssignmentDrawerOpen(true);
    setAssignmentUserId(id);
  };

  const handleSubmitAssignment = async (values: any) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/users/assign-region-branch`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: assignmentUserId, ...values }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        sweetAlert({
          title: "Failed to assign region and branch",
          text: errorData.message,
          icon: "error",
        });
        return;
      }
      const data = await response.json();
      sweetAlert({
        title: "Region and branch assigned successfully",
        text: data.message,
        icon: "success",
        timer: 2000,
      });
      setAssignmentDrawerOpen(false);
      setAssignmentUserId(null);
      assignmentForm.resetFields();
    } catch (err) {
      sweetAlert({
        title: "Error assigning region and branch",
        text: "Please try again later.",
        icon: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <PageHeader
        title="Manage Portal Users"
        subtitle="Create, update, and delete users from your system"
        actions={[
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm">Show Deleted</span>
              <Switch
                size="sm"
                isSelected={showDeleted}
                onValueChange={setShowDeleted}
              />
            </div>
            <AntButton
              icon={<ReloadOutlined />}
              loading={loading}
              onClick={fetchUsers}
            >
              Refresh
            </AntButton>
            <AntButton onClick={() => setCreateDrawerOpen(true)}>
              <PlusOutlined /> New User
            </AntButton>
          </div>,
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
            sorter: (a: any, b: any) => a.name.localeCompare(b.name),
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
            sorter: (a: any, b: any) => a.email.localeCompare(b.email),
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
            sorter: (a: any, b: any) => a.role.localeCompare(b.role),
          },
          ...(!showDeleted
            ? [
              {
                title: "Status",
                dataIndex: "status",
                key: "status",
                render: (value: string) => (
                  <Tag color={value == "Active" ? "green" : "red"}>
                    {value}
                  </Tag>
                ),
                sorter: (a: any, b: any) => a.status.localeCompare(b.status),
              },
            ]
            : [
              {
                title: "Deleted",
                dataIndex: "deletedAt",
                key: "deletedAt",
                render: (value: string) => (
                  <span>{value ? dayjs(value).fromNow() : "-"}</span>
                ),
              },
            ]),
          {
            title: "Created",
            dataIndex: "createdAt",
            key: "createdAt",
            render: (value: string) => (
              <span>{value ? dayjs(value).fromNow() : "-"}</span>
            ),
            sorter: (a: any, b: any) =>
              new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
          },
          ...(!showDeleted
            ? [
              {
                title: "Last Seen",
                dataIndex: "lastSeenAt",
                key: "lastSeenAt",
                render: (value: string) => (
                  <span>{value ? dayjs(value).fromNow() : "-"}</span>
                ),
              },
            ]
            : []),
          {
            title: "Actions",
            key: "actions",
            render: (_: any, record: any) => (
              <Dropdown
                menu={{
                  items: [
                    ...(!showDeleted
                      ? [
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
                              lastname: record.name
                                .split(" ")
                                .slice(-1)
                                .join(" "),
                              email: record.email,
                              phone: record.phone,
                              role: record.role,
                              roles: record.roles,
                            });
                            setEditingUser(record);
                            setEditDrawerOpen(true);
                          },
                        },
                        // Assign region and branch to the user
                        ...(record.roles?.includes(ERoles.BranchManager) ||
                          record.roles?.includes(ERoles.RegionalManager)
                          ? [
                            {
                              key: "assign-region-branch",
                              icon: <ListChecks size={14} />,
                              label: "Assignments",
                              onClick: () =>
                                openAssignmentDrawer(record._id),
                            },
                          ]
                          : []),
                        // Only show reset password for non-admin users
                        ...(!record.roles?.includes("admin")
                          ? [
                            {
                              key: "reset-password",
                              icon: <LockOutlined size={14} />,
                              label: "Reset Password",
                              onClick: () =>
                                resetPassword(record._id, record.name),
                            },
                          ]
                          : []),
                        {
                          key: "toggle-status",
                          icon: <StopOutlined />,
                          label:
                            record.status === "Active"
                              ? "Deactivate"
                              : "Activate",
                          onClick: () =>
                            toggleUserStatus(record._id, record.status),
                        },
                        {
                          key: "delete",
                          icon: <DeleteOutlined />,
                          label: "Delete",
                          danger: true,
                          onClick: () => deleteUser(record._id),
                        },
                      ]
                      : [
                        {
                          key: "reactivate",
                          icon: <UserOutlined />,
                          label: "Reactivate",
                          onClick: async () => {
                            try {
                              const confirmed = await sweetAlert({
                                title: "Reactivate user?",
                                text: "This will restore the user's access.",
                                icon: "warning",
                                buttons: ["Cancel", "Yes, reactivate"],
                              });
                              if (!confirmed) return;

                              setLoading(true);
                              const res = await fetch(
                                `/api/users/reactivate`,
                                {
                                  method: "POST",
                                  headers: {
                                    "Content-Type": "application/json",
                                  },
                                  body: JSON.stringify({ id: record._id }),
                                }
                              );
                              const data = await res.json();
                              if (!res.ok) {
                                sweetAlert({
                                  title: "Failed",
                                  text: data.message,
                                  icon: "error",
                                });
                                return;
                              }
                              sweetAlert({
                                title: "User reactivated",
                                icon: "success",
                                timer: 2000,
                              });
                              setUsers((prev) =>
                                prev.filter((u) => u._id !== record._id)
                              );
                            } catch (e) {
                              sweetAlert({
                                title: "Error",
                                text: "Could not reactivate user",
                                icon: "error",
                              });
                            } finally {
                              setLoading(false);
                            }
                          },
                        },
                      ]),
                  ],
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
                  <Tag key={`${record._id}-${role}-${index}`} className="w-fit">
                    {roleLabels[role]}
                  </Tag>
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

      <Drawer
        title="Assign Region and Branch"
        placement="right"
        closable={false}
        onClose={() => {
          setAssignmentDrawerOpen(false);
          setAssignmentUserId(null);
        }}
        open={assignmentDrawerOpen}
        width="50%"
      >
        <Form
          form={assignmentForm}
          layout="vertical"
          onFinish={handleSubmitAssignment}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Region" name="region">
                <Select />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Branch" name="branch">
                <Select />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Drawer>
    </div>
  );
};

export default withRoleGuard(UsersPage, [ERoles.Admin, ERoles.HRManager]);
