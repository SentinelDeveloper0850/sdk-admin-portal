import { useState } from "react";

import { Checkbox } from "@nextui-org/react";
import { Table, Tag } from "antd";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

const ClaimsTable = ({
  claims,
  onView,
}: {
  claims: any[];
  onView: (id: string) => void;
}) => {
  const [statusFilter, setStatusFilter] = useState<string[] | null>([
    "Submitted",
    "In Review",
  ]);

  const columns = [
    {
      title: "Claimant",
      dataIndex: "claimantName",
      key: "claimantName",
    },
    {
      title: "Policy",
      dataIndex: "policyId",
      key: "policyId",
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      filters: [
        { text: "Submitted", value: "Submitted" },
        { text: "In Review", value: "In Review" },
        { text: "Approved", value: "Approved" },
        { text: "Rejected", value: "Rejected" },
      ],
      filteredValue: statusFilter || null,
      onFilter: (value: any, record: any) => record.status === value,
      render: (status: string, record: any) => {
        const color = {
          Submitted: "default",
          "In Review": "blue",
          Approved: "green",
          Rejected: "red",
        }[status];

        return (
          <>
            <Tag color={color}>{status}</Tag>
            {record.isOverdue && (
              <span className="ml-2 text-xs font-semibold text-red-600">
                Overdue
              </span>
            )}
          </>
        );
      },
    },
    {
      title: "Submitted By",
      dataIndex: "submittedBy",
      key: "submittedBy",
      render: (user: any) => user?.name || "—",
    },
    {
      title: "Submitted",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (_: any, record: any) => (
        <div>
          {dayjs(record.createdAt).format("DD MMM YYYY")}
          <br />
          <span className="text-xs text-gray-400">
            {dayjs(record.createdAt).fromNow()}
          </span>
        </div>
      ),
    },
  ];

  const now = dayjs();

  const sortedClaims = [...claims]
    .map((claim) => ({
      ...claim,
      isOverdue:
        ["Submitted", "In Review"].includes(claim.status) &&
        now.diff(dayjs(claim.createdAt), "hour") >= 24,
    }))
    .sort((a, b) => {
      const rank = (status: string) =>
        status === "Submitted"
          ? 1
          : status === "In Review"
            ? 2
            : status === "Approved"
              ? 999
              : status === "Rejected"
                ? 9999
                : 10000;
      return rank(a.status) - rank(b.status);
    });

  return (
    <>
      <Checkbox
        className="mb-1"
        size="sm"
        isSelected={!!statusFilter}
        onValueChange={(checked) =>
          setStatusFilter(checked ? ["Submitted", "In Review"] : null)
        }
      >
        <span className="italic">Only show actionable claims</span>
      </Checkbox>

      <Table
        columns={columns}
        dataSource={sortedClaims}
        rowKey="_id"
        pagination={{ pageSize: 8 }}
        onRow={(record) => ({
          onClick: () => onView(record._id),
        })}
        rowClassName={(record) =>
          record.isOverdue ? "bg-red-50 dark:bg-red-900/30" : ""
        }
      />
    </>
  );
};

export default ClaimsTable;
