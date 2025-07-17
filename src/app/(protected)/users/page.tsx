"use client";

import { useEffect, useState } from "react";

import {
  MailOutlined,
  PhoneOutlined,
  PlusOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { Avatar, Button } from "@nextui-org/react";
import { Col, Drawer, Form, Input, Row, Select, Space, Table, Tag } from "antd";
import axios from "axios";
import { AiOutlineUserAdd } from "react-icons/ai";
import sweetAlert from "sweetalert";

import { capitalizeFirstLetter, getDate, getTime } from "@/utils/formatters";

import PageHeader from "@/app/components/page-header";
import { useAuth } from "@/context/auth-context";

const UsersPage = () => {
  const [users, setUsers] = useState<any[]>([]);

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [createDrawerOpen, setCreateDrawerOpen] = useState<boolean>(false);
  const [viewDrawerOpen, setViewDrawerOpen] = useState<boolean>(false);

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
      setUsers(data.users);
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

  const roles = ["admin", "member"];

  const additionalRoles = ["admin", "member"];

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
            title: "Role",
            dataIndex: "role",
            key: "role",
            render: (value: string) => (
              <Tag color={value == "admin" ? "gold" : undefined}>
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
          // {
          //   title: "Actions",
          //   dataIndex: "actions",
          //   key: "actions",
          //   render: (_value: any, record: any) => (
          //     <div className="flex justify-between">
          //       {record.status == "Active" ? (
          //         <Button color="danger" size="sm" onPress={() => deactivateUser(record._id)}>
          //           Deactivate
          //         </Button>
          //       ) : (
          //         <Button color="primary" size="sm">
          //           Activate
          //         </Button>
          //       )}
          //     </div>
          //   ),
          //   sorter: (a, b) => a.status.localeCompare(b.role),
          // },
        ]}
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
                <Select>
                  {roles.map((item) => (
                    <Select.Option key={item} value={item}>
                      {capitalizeFirstLetter(item)}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Additional Roles" name="roles">
                <Select mode="tags">
                  {additionalRoles.map((item) => (
                    <Select.Option key={item} value={item}>
                      {capitalizeFirstLetter(item)}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Drawer>
    </div>
  );
};

export default UsersPage;
