"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { Avatar, Button, Image } from "@nextui-org/react";
import { IconPlus } from "@tabler/icons-react";
import { Space, Table, Tag } from "antd";

import { capitalizeFirstLetter, getDate, getTime } from "@/utils/formatters";

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

  return (
    <div style={{ padding: "20px" }}>
      <PageHeader
        title="Manage Users"
        subtitle="Create, update, and delete Users from your system"
        actions={
          [
            // <Link key={1} href="/users/create">
            //   <Button isIconOnly color="primary" size="sm">
            //     <IconPlus />
            //   </Button>
            // </Link>,
          ]
        }
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
    </div>
  );
};

export default UsersPage;
