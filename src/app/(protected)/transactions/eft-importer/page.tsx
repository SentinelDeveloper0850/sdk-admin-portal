"use client";

import { useMemo, useState } from "react";



import { DeleteOutlined, EditOutlined, EyeOutlined, UploadOutlined } from "@ant-design/icons";
import { Alert, Button, Drawer, Form, Input, Popconfirm, Space, Spin, Table, Upload, message } from "antd";



import PageHeader from "@/app/components/page-header";
import { useAuth } from "@/context/auth-context";


interface EditableTransaction {
  key: string;
  date: string;
  description: string;
  rawDescription: string;
  rawLine: string;
  amount: number;
}

export default function TransactionHistoryImporter() {
  const [transactions, setTransactions] = useState<EditableTransaction[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | boolean>(false);

  const [pageSize, setPageSize] = useState<number>(10);
  const [editDrawerVisible, setEditDrawerVisible] = useState(false);
  const [currentRecord, setCurrentRecord] =
    useState<EditableTransaction | null>(null);
  const [drawerForm] = Form.useForm();

  const [rawTransactionVisible, setRawTransactionVisible] = useState(false);
  const [rawTransaction, setRawTransaction] = useState<{ description: string, line: string }>();

  const { user } = useAuth();

  const handleDelete = (key: string) => {
    const newData = transactions.filter((item) => item.key !== key);
    setTransactions(newData);
  };

  const handleDrawerSave = async () => {
    try {
      const values = await drawerForm.validateFields();
      if (!currentRecord) return;

      const updated = transactions.map((tx) =>
        tx.key === currentRecord.key ? { ...tx, ...values } : tx
      );

      setTransactions(updated);
      setEditDrawerVisible(false);
      setCurrentRecord(null);
      message.success("Transaction updated");
    } catch (err) {
      console.error("Drawer validation failed:", err);
    }
  };

  const openEditDrawer = (record: EditableTransaction) => {
    setCurrentRecord(record);
    drawerForm.setFieldsValue(record);
    setEditDrawerVisible(true);
  };

  const columns = [
    {
      title: "Date",
      dataIndex: "date",
      editable: true,
    },
    {
      title: "Description",
      dataIndex: "description",
      render: (_: any, record: EditableTransaction) => (
        <Space>
          <span>{record.description}</span>
        </Space>
      ),
    },

    {
      title: "Amount",
      dataIndex: "amount",
      editable: true,
    },
    {
      title: "Actions",
      dataIndex: "actions",
      render: (_: any, record: EditableTransaction) => (
        <Space>
          <Button
            icon={<EyeOutlined />}
            onClick={() => {
              setRawTransaction({
                description: record.rawDescription,
                line: record.rawLine
              });
              setRawTransactionVisible(true);
            }}
          />
          <Button
            icon={<EditOutlined />}
            onClick={() => openEditDrawer(record)}
          />
          <Popconfirm
            title="Delete this transaction?"
            onConfirm={() => handleDelete(record.key)}
          >
            <Button icon={<DeleteOutlined />} danger />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const pageActions = useMemo(() => {
    if (user && user.role === "admin") {

      if (!transactions || transactions.length == 0) {
        return [
          <Upload
            key="upload-btn"
            accept=".pdf"
            showUploadList={false}
            beforeUpload={(file) => {
              return false;
            }}
          >
            <Button icon={<UploadOutlined />} loading={loading}>
              Upload Transaction History (PDF)
            </Button>
          </Upload>,
        ];
      } else {
        return [];
      }
    } else {
      return [];
    }
  }, [user, transactions]);

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center p-5 text-center">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div style={{ padding: "20px" }}>
      <PageHeader title="FNB Transaction History" actions={[...pageActions]} />
      {error && (
        <Alert
          showIcon
          type="error"
          message={error}
          closable
          onClose={() => setError(false)}
        />
      )}

      <div>
        {transactions?.length > 0 && (
          <Table
            dataSource={transactions}
            columns={columns}
            pagination={{
              pageSize: pageSize,
              showSizeChanger: true,
              pageSizeOptions: ["5", "10", "20", "50", "100"],
              onChange(page, pageSize) {
                setPageSize(pageSize);
              },
              showTotal: (total, range) =>
                `${range[0]}–${range[1]} of ${total} transactions`,
            }}
            style={{ marginTop: 24 }}
          />
        )}
      </div>
      <Drawer
        width="40%"
        placement="bottom"
        title="Edit Transaction"
        open={editDrawerVisible}
        onClose={() => setEditDrawerVisible(false)}
        footer={
          <Space style={{ display: "flex", justifyContent: "flex-end" }}>
            <Button onClick={() => setEditDrawerVisible(false)}>Cancel</Button>
            <Button type="primary" onClick={handleDrawerSave}>
              Save
            </Button>
          </Space>
        }
      >
        <Form layout="vertical" form={drawerForm}>
          <Form.Item
            name="date"
            label="Date"
            rules={[{ required: true, message: "Please enter the date" }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="description"
            label="Description"
            rules={[
              { required: true, message: "Please enter the description" },
            ]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="amount"
            label="Amount"
            rules={[{ required: true, message: "Please enter the amount" }]}
          >
            <Input type="number" />
          </Form.Item>
        </Form>
      </Drawer>
      <Drawer
        width="40%"
        placement="bottom"
        open={rawTransactionVisible}
        title="Raw Transaction"
        onClose={() => setRawTransactionVisible(false)}
        footer={null}
      >
        <p style={{ fontWeight: "bold" }}>Raw Description:</p>
        <p style={{ whiteSpace: "pre-wrap" }}>
          {rawTransaction?.description}
        </p>

        <p style={{ fontWeight: "bold", marginTop: 16 }}>Raw Line:</p>
        <p style={{ whiteSpace: "pre-wrap" }}>{rawTransaction?.line}</p>
      </Drawer>
    </div>
  );
}