"use client";

import Link from "next/link";
import React from "react";

import { Button } from "@nextui-org/react";
import { IconEdit, IconPlus, IconTrash } from "@tabler/icons-react";
import { Space, Table } from "antd";

import PageHeader from "@/app/components/page-header";

// Define the type for vehicle data
type Booking = {
  id: number;
  user: string;
  driver: string;
  car: string;
  startDate: string;
  status: string;
  endDate: string;
};

const BookingsPage: React.FC = () => {

  // Vehicle data
  const data: Booking[] = [
    {
      id: 1,
      user: "Gift",
      driver: "Sam",
      car: "VW",
      startDate: "8 Dec 2024",
      endDate: "8 Dec 2024",
      status: "Pending",
    },
    {
      id: 2,
      user: "Give",
      driver: "Derrick",
      car: "Eitos",
      startDate: "8 Dec 2024",
      endDate: "8 Dec 2024",
      status: "Approved",
    },
    {
      id: 3,
      user: "Stephen",
      driver: "Jame",
      car: "I20",
      startDate: "8 Dec 2024",
      endDate: "8 Dec 2024",
      status: "Declined",
    },
  ];

  // Column definitions
  const columns = [
    {
      title: "Booked by",
      dataIndex: "user",
      key: "user",
    },
    {
      title: "Driver",
      dataIndex: "driver",
      key: "driver",
    },
    {
      title: "Vehicle",
      dataIndex: "car",
      key: "car",
    },
    {
      title: "Start Date",
      dataIndex: "startDate",
      key: "startDate",
    },
    {
      title: "End Date",
      dataIndex: "endDate",
      key: "endDate",
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status: string) => {
        const statusColors: Record<string, string> = {
          Approved: "text-green-600",
          Pending: "text-yellow-600",
          Declined: "text-red-600",
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
      render: (_: any, record: Booking) => (
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
    console.log(`Edit booking with id: ${id}`);
  };

  const handleDelete = (id: number) => {
    console.log(`Delete booking with id: ${id}`);
  };

  return (
    <div style={{ padding: "20px" }}>
      <PageHeader
        title="Manage Bookings"
        subtitle="Create, update, and delete vehicles from your fleet"
        actions={[
          <Link key={1} href="/bookings/create">
            <Button isIconOnly color="primary" size="sm">
              <IconPlus />
            </Button>
          </Link>,
        ]}
      />
      <Table dataSource={data} columns={columns} rowKey="id" bordered />
    </div>
  );
};

export default BookingsPage;
