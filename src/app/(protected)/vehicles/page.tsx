"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import React from "react";



import { Button } from "@nextui-org/react";
import { IconEdit, IconPlus, IconTrash } from "@tabler/icons-react";
import { Space, Table } from "antd";



import PageHeader from "@/app/components/page-header";


// Define the type for vehicle data
type Vehicle = {
  id: number;
  name: string;
  type: string;
  status: string;
};

const VehiclesPage: React.FC = () => {
  const router = useRouter(); // Initialize Next.js router for navigation

  // Vehicle data
  const data: Vehicle[] = [
    { id: 1, name: "Truck A", type: "Truck", status: "Active" },
    { id: 2, name: "Van B", type: "Van", status: "Maintenance" },
    { id: 3, name: "Car C", type: "Car", status: "Inactive" },
  ];

  // Column definitions
  const columns = [
    {
      title: "Vehicle Name",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Type",
      dataIndex: "type",
      key: "type",
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
      render: (_: any, record: Vehicle) => (
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
            onClick={() => handleDelete(record.id)}
          >
            <IconTrash size={16} />
          </Button>
        </Space>
      ),
    },
  ];

  // Handlers for edit and delete actions
  const handleEdit = (id: number) => {
    console.log(`Edit vehicle with id: ${id}`);
  };

  const handleDelete = (id: number) => {
    console.log(`Delete vehicle with id: ${id}`);
  };

  return (
    <div style={{ padding: "20px" }}>
      <PageHeader
        title="Manage Vehicles"
        subtitle="Create, update, and delete vehicles from your fleet"
        actions={[
          <Link key={1} href="/vehicles/create">
            <Button isIconOnly color="primary" size="sm">
              <IconPlus />
            </Button>
          </Link>,
        ]}
      />
      <Table
        dataSource={data}
        columns={columns}
        rowKey="id"
        bordered
        onRow={(record) => ({
          onClick: () => router.push(`/vehicles/${record.id}`), // Navigate to vehicle details page
        })}
        rowClassName="cursor-pointer hover:bg-gray-100" // Add hover and pointer styles
      />
    </div>
  );
};

export default VehiclesPage;