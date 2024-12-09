"use client";

import { useRouter } from "next/navigation";
import React from "react";

import { Button } from "@nextui-org/react";
import { IconEdit, IconTrash } from "@tabler/icons-react";
import { Space, Table } from "antd";

import PageHeader from "@/app/components/page-header";

// Define the type for driver data
type Driver = {
  id: number;
  name: string;
  availabilityStatus: string;
  assignedVehicle: string;
  licenseType: string;
};

const DriversPage: React.FC = () => {
  const router = useRouter(); // Initialize Next.js router

  // Driver data
  const data: Driver[] = [
    {
      id: 1,
      name: "Sipho Mkhwanazi",
      availabilityStatus: "Available",
      assignedVehicle: "Corolla",
      licenseType: "Code 10",
    },
    {
      id: 2,
      name: "Jan van Potgieter",
      availabilityStatus: "Available",
      assignedVehicle: "VW",
      licenseType: "Code 10",
    },
    {
      id: 3,
      name: "Steve Biko",
      availabilityStatus: "Unavailable",
      assignedVehicle: "Polo",
      licenseType: "Code 10",
    },
  ];

  // Column definitions
  const columns = [
    {
      title: "Driver Name",
      dataIndex: "name",
      key: "driverName",
    },
    {
      title: "Availability Status",
      dataIndex: "availabilityStatus",
      key: "availabilityStatus",
    },
    {
      title: "Assigned Vehicle",
      dataIndex: "assignedVehicle",
      key: "assignedVehicle",
    },
    {
      title: "License Type",
      dataIndex: "licenseType",
      key: "licenseType",
    },
    {
      title: "Actions",
      key: "actions",
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      render: (_: any, record: Driver) => (
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
    console.log(`Edit Driver with id: ${id}`);
  };

  const handleDelete = (id: number) => {
    console.log(`Delete Driver with id: ${id}`);
  };

  return (
    <div style={{ padding: "20px" }}>
      <PageHeader
        title="Manage Drivers"
        subtitle="Create, update, and delete Drivers from your fleet"
      />
      <Table
        dataSource={data}
        columns={columns}
        rowKey="id"
        bordered
        onRow={(record) => ({
          onClick: () => router.push(`/drivers/${record.id}`),
        })}
        rowClassName={() => "cursor-pointer hover:bg-[#FFC107]"}
      />
    </div>
  );
};

export default DriversPage;
