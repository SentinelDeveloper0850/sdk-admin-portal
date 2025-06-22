import { useState } from "react";



import { Checkbox } from "@nextui-org/react";
import { Table, Tag } from "antd";


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
      render: (status: string) => {
        const color = {
          Submitted: "default",
          "In Review": "blue",
          Approved: "green",
          Rejected: "red",
        }[status];

        return <Tag color={color}>{status}</Tag>;
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
      render: (val: string) => new Date(val).toLocaleDateString(),
    },
  ];

  const sortedClaims = [...claims].sort((a, b) => {
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
      <Checkbox className="mb-1"size="sm"
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
      />
    </>
  );
};

export default ClaimsTable;