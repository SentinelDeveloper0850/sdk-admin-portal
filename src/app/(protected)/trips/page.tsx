"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import React from "react";

import { Button } from "@nextui-org/react";
import { IconEdit, IconTrash } from "@tabler/icons-react";
import { Space, Table } from "antd";

import PageHeader from "@/app/components/page-header";

// Define the type for trip data
type Trip = {
  id: number;
  car: string;
  driver: string;
  date: string;
  distance: string;
  status: string; // Added status
  user: string; // Added user who booked the trip
};

const TripsPage: React.FC = () => {
  const router = useRouter();
  // Trip data
  const data: Trip[] = [
    {
      id: 1,
      car: "Toyota Hilux",
      driver: "John Doe",
      date: "2024-11-26",
      distance: "150 km",
      status: "Completed",
      user: "Alice Johnson",
    },
    {
      id: 2,
      car: "Ford Transit",
      driver: "Jane Smith",
      date: "2024-11-25",
      distance: "90 km",
      status: "In Progress",
      user: "Bob Lee",
    },
    {
      id: 3,
      car: "Nissan Leaf",
      driver: "Sam Wilson",
      date: "2024-11-24",
      distance: "120 km",
      status: "Cancelled",
      user: "Charlie Adams",
    },
  ];

  // Column definitions
  const columns = [
    {
      title: "Car Used",
      dataIndex: "car",
      key: "car",
    },
    {
      title: "Driver",
      dataIndex: "driver",
      key: "driver",
    },
    {
      title: "Trip Date",
      dataIndex: "date",
      key: "date",
    },
    {
      title: "Distance Traveled",
      dataIndex: "distance",
      key: "distance",
    },
    {
      title: "User",
      dataIndex: "user",
      key: "user",
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status: string) => {
        const statusColors: Record<string, string> = {
          Completed: "text-green-600",
          "In Progress": "text-yellow-600",
          Cancelled: "text-red-600",
        };
        return (
          <span className={statusColors[status] || "text-gray-600"}>
            {status}
          </span>
        );
      },
    },
    {
      title: "Actions",
      key: "actions",
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      render: (_: any, record: Trip) => (
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
    console.log(`Edit trip with id: ${id}`);
  };

  const handleDelete = (id: number) => {
    console.log(`Delete trip with id: ${id}`);
  };

  return (
    <div style={{ padding: "20px" }}>
      <PageHeader
        title="Manage Trips"
        subtitle="View, update, and delete trips"
        actions={[
          <Link key={1} href="/trips/create">
            <Button color="primary" size="sm">
              Start Trip
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
          onClick: () => {
            if (record.status === "In Progress") {
              router.push(`/trips/${record.id}`);
            }
          },
        })}
        rowClassName={(record) =>
          record.status === "In Progress"
            ? "cursor-pointer hover:bg-gray-100"
            : ""
        }
      />
    </div>
  );
};

export default TripsPage;
