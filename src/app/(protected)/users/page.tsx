"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useState } from "react";

import { Button } from "@nextui-org/react";
import { IconEdit, IconPlus, IconTrash } from "@tabler/icons-react";
import { Space, Table } from "antd";
import axios from "axios";

import PageHeader from "@/app/components/page-header";

// Define the type for vehicle data
type User = {
  id: number;
  name: string;
  email: string;
  role: string;
  status: string;
};

const UsersPage: React.FC = () => {
  // Column definitions
  const columns = [
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
    },
    {
      title: "Role",
      dataIndex: "role",
      key: "role",
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
    },
    {
      title: "Actions",
      key: "actions",
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      render: (_: any, record: User) => (
        <Space>
          <Button
            className="text-gray-600 transition-colors hover:text-blue-500"
            isIconOnly
            size="sm"
            onClick={() => handleEdit(record.id)}
          >
            <IconEdit size={16} />
          </Button>
          <Button
            className="text-gray-600 transition-colors hover:text-blue-500"
            isIconOnly
            size="sm"
            aria-label="Delete"
          >
            <IconTrash size={16} />
          </Button>
        </Space>
      ),
    },
  ];

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
    </div>
  );
};

export default UsersPage;
