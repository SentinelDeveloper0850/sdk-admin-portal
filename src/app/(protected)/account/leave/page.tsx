// app/account/leave/page.tsx
"use client";

import React, { useEffect, useState } from "react";

import { Button, Card, CardBody, CardHeader } from "@nextui-org/react";
import { DatePicker, Form, Input, Select, Table, Tag, message } from "antd";
import dayjs from "dayjs";

import PageHeader from "@/app/components/page-header";
import { useAuth } from "@/context/auth-context";

// app/account/leave/page.tsx

const { RangePicker } = DatePicker;

const LeavePage = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchLeaveRequests = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/hr/leave-request");
      const json = await res.json();
      setRequests(json.data);
    } catch (err) {
      message.error("Failed to load leave requests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaveRequests();
  }, []);

  const handleRequest = async (values: any) => {
    const [start, end] = values.range;
    const payload = {
      leaveType: values.leaveType,
      startDate: start.toISOString(),
      endDate: end.toISOString(),
      numberOfDays: dayjs(end).diff(start, "day") + 1,
      reason: values.reason,
    };

    try {
      const res = await fetch("/api/hr/leave-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (json.success) {
        fetchLeaveRequests();
        message.success("Leave request submitted.");
      } else {
        throw new Error(json.message);
      }
    } catch (err: any) {
      message.error(err.message || "Failed to submit leave");
    }
  };

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title="Leave Requests"
        subtitle="Submit and track your personal leave history"
      />

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Balances */}
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold">Your Leave Balances</h2>
          </CardHeader>
          <CardBody className="space-y-2 text-sm">
            <div className="flex justify-between text-gray-400">
              <span>Annual</span>
              <span className="text-yellow-400">
                {user?.employee?.leaveBalance?.annual ?? "—"} days
              </span>
            </div>
            <div className="flex justify-between text-gray-400">
              <span>Sick</span>
              <span className="text-yellow-400">
                {user?.employee?.leaveBalance?.sick ?? "—"} days
              </span>
            </div>
            <div className="flex justify-between text-gray-400">
              <span>Family Responsibility</span>
              <span className="text-yellow-400">
                {user?.employee?.leaveBalance?.familyResponsibility ?? "—"} days
              </span>
            </div>
          </CardBody>
        </Card>

        {/* Request Form */}
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold">Submit a Leave Request</h2>
          </CardHeader>
          <CardBody>
            <Form layout="vertical" onFinish={handleRequest}>
              <Form.Item
                name="leaveType"
                label="Type"
                rules={[{ required: true }]}
              >
                <Select
                  placeholder="Select leave type"
                  options={[
                    { label: "Annual", value: "ANNUAL" },
                    { label: "Sick", value: "SICK" },
                    {
                      label: "Family Responsibility",
                      value: "FAMILY_RESPONSIBILITY",
                    },
                    { label: "Unpaid", value: "UNPAID" },
                  ]}
                />
              </Form.Item>

              <Form.Item
                name="range"
                label="Leave Dates"
                rules={[{ required: true }]}
              >
                <RangePicker />
              </Form.Item>

              <Form.Item name="reason" label="Reason">
                <Input.TextArea rows={3} />
              </Form.Item>

              <Button type="submit" color="primary" size="sm">
                Submit Request
              </Button>
            </Form>
          </CardBody>
        </Card>
      </div>

      {/* Request History */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold">Your Leave History</h2>
        </CardHeader>
        <CardBody>
          <Table
            rowKey="_id"
            dataSource={requests.filter(
              (r: any) => r.employee?._id === user?.employee?._id
            )}
            columns={[
              {
                title: "Type",
                dataIndex: "leaveType",
                render: (text) => text.replace("_", " "),
              },
              {
                title: "Dates",
                render: (record) =>
                  `${dayjs(record.startDate).format("DD MMM")} → ${dayjs(
                    record.endDate
                  ).format("DD MMM")}`,
              },
              {
                title: "Days",
                dataIndex: "numberOfDays",
              },
              {
                title: "Status",
                dataIndex: "status",
                render: (status) => (
                  <Tag
                    color={
                      status === "APPROVED"
                        ? "green"
                        : status === "REJECTED"
                          ? "red"
                          : "gold"
                    }
                  >
                    {status}
                  </Tag>
                ),
              },
            ]}
            loading={loading}
            pagination={false}
          />
        </CardBody>
      </Card>
    </div>
  );
};

export default LeavePage;
