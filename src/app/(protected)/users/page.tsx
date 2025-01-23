"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { Button } from "@nextui-org/react";
import { IconPlus } from "@tabler/icons-react";
import { Table, Tag } from "antd";

import { getDate, getTime } from "@/utils/formatters";

import PageHeader from "@/app/components/page-header";

const UsersPage = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

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

  useEffect(() => {
    fetchUsers();
  }, []);

  return (
    <div style={{ padding: "20px" }}>
      <PageHeader
        title="Manage Users"
        subtitle="Create, update, and delete Users from your system"
        actions={[
          <Link key={1} href="/users/create">
            <Button isIconOnly color="primary" size="sm">
              <IconPlus />
            </Button>
          </Link>,
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
            render: (value: string) => <Tag color="blue">{value}</Tag>,
            sorter: (a, b) => a.role.localeCompare(b.role),
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
        ]}
      />
    </div>
  );
};

export default UsersPage;
