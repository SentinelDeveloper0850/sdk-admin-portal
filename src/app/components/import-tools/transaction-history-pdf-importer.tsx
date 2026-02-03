"use client";

import { useState } from "react";

import {
  CloseOutlined,
  DeleteOutlined,
  EditOutlined,
  SaveOutlined,
  UploadOutlined,
} from "@ant-design/icons";
import {
  Button,
  Form,
  Input,
  Popconfirm,
  Space,
  Table,
  Upload,
  message,
} from "antd";

interface ExtractedTransaction {
  date: string;
  description: string;
  amount: number;
}

interface EditableTransaction extends ExtractedTransaction {
  key: string;
}

const EftPdfImporter = () => {
  const [transactions, setTransactions] = useState<EditableTransaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [form] = Form.useForm();

  const isEditing = (record: EditableTransaction) => record.key === editingKey;

  const edit = (record: EditableTransaction) => {
    form.setFieldsValue({ ...record });
    setEditingKey(record.key);
  };

  const cancel = () => {
    setEditingKey(null);
  };

  const save = async (key: string) => {
    try {
      const row = (await form.validateFields()) as ExtractedTransaction;
      const newData = [...transactions];
      const index = newData.findIndex((item) => item.key === key);
      if (index > -1) {
        const updated = { ...newData[index], ...row };
        newData.splice(index, 1, updated);
        setTransactions(newData);
        setEditingKey(null);
      }
    } catch (err) {
      console.log("Validation failed:", err);
    }
  };

  const handleDelete = (key: string) => {
    const newData = transactions.filter((item) => item.key !== key);
    setTransactions(newData);
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
      editable: true,
    },
    {
      title: "Amount",
      dataIndex: "amount",
      editable: true,
    },
    {
      title: "Actions",
      dataIndex: "actions",
      render: (_: any, record: EditableTransaction) => {
        const editable = isEditing(record);
        return editable ? (
          <Space>
            <Button icon={<SaveOutlined />} onClick={() => save(record.key)} />
            <Button icon={<CloseOutlined />} onClick={cancel} />
          </Space>
        ) : (
          <Space>
            <Button
              icon={<EditOutlined />}
              disabled={editingKey !== null}
              onClick={() => edit(record)}
            />
            <Popconfirm
              title="Delete this transaction?"
              onConfirm={() => handleDelete(record.key)}
            >
              <Button icon={<DeleteOutlined />} danger />
            </Popconfirm>
          </Space>
        );
      },
    },
  ];

  const mergedColumns = columns.map((col) => {
    if (!col.editable) return col;
    return {
      ...col,
      onCell: (record: EditableTransaction) => ({
        record,
        dataIndex: col.dataIndex,
        title: col.title,
        editing: isEditing(record),
      }),
    };
  });

  return (
    <div>
      <Upload
        accept=".pdf"
        showUploadList={false}
        beforeUpload={(file) => {
          return false;
        }}
      >
        <Button icon={<UploadOutlined />} loading={loading}>
          Upload PDF
        </Button>
      </Upload>

      <Form form={form} component={false}>
        <Table
          components={{
            body: {
              cell: ({
                children,
                ...restProps
              }: {
                children: React.ReactNode;
                record: EditableTransaction;
                dataIndex: string;
                editing: boolean;
              }) => {
                const { record, dataIndex, editing } = restProps;
                const editable = ["date", "description", "amount"].includes(
                  dataIndex
                );
                return editable && editing ? (
                  <td>
                    <Form.Item
                      name={dataIndex}
                      style={{ margin: 0 }}
                      rules={[{ required: true, message: "Required" }]}
                    >
                      <Input />
                    </Form.Item>
                  </td>
                ) : (
                  <td {...restProps}>{children}</td>
                );
              },
            },
          }}
          dataSource={transactions}
          columns={mergedColumns}
          pagination={false}
          style={{ marginTop: 24 }}
        />
      </Form>

      {transactions.length > 0 && (
        <Button type="primary" style={{ marginTop: 16 }}>
          Import Transactions
        </Button>
      )}
    </div>
  );
};

export default EftPdfImporter;
