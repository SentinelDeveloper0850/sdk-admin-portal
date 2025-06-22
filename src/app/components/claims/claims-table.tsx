import { Table, Tag } from "antd";

const ClaimsTable = ({
  claims,
  onView,
}: {
  claims: any[];
  onView: (id: string) => void;
}) => {
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
      title: "Submitted",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (val: string) => new Date(val).toLocaleDateString(),
    },
  ];

  return (
    <Table
      columns={columns}
      dataSource={claims}
      rowKey="_id"
      pagination={{ pageSize: 8 }}
      onRow={(record) => ({
        onClick: () => onView(record._id),
      })}
    />
  );
};

export default ClaimsTable;
