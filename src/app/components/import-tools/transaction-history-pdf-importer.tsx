"use client";

import { useState } from "react";

import {
  Button,
  Table,
  Upload,
  message,
  Form,
  Input,
  Popconfirm,
  Space,
} from "antd";

import {
  UploadOutlined,
  EditOutlined,
  DeleteOutlined,
  SaveOutlined,
  CloseOutlined,
} from "@ant-design/icons";

import * as pdfjsLib from "pdfjs-dist";
import "pdfjs-dist/build/pdf.worker.entry";

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

  const parsePdf = async (file: File) => {
    console.log("🚀 ~ parsePdf: starting...");
    setLoading(true);

    try {
      const buffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
      let fullText = "";

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const text = await page.getTextContent();
        fullText += text.items.map((item: any) => item.str).join(" ") + "\n";
      }

      const crTransactions: ExtractedTransaction[] = fullText
        .split(/(?=\d{2} \w{3} \d{4})/) // split when line starts with a date
        .map((line) => line.trim())
        .filter((line) => line.includes("CR"))
        .map((line) => {
          const regex =
            /^(\d{2} \w{3} \d{4})\s+(.+?)\s+[\d,]+\.\d{2}\s+([\d,]+\.\d{2})\s+CR$/;
          const match = line.match(regex);
          if (match) {
            const [, date, description, amountStr] = match;
            return {
              date,
              description: description.trim(),
              amount: parseFloat(amountStr.replace(/,/g, "")),
            };
          }

          const dateMatch = line.match(/^(\d{2} \w{3} \d{4})/);
          const amountMatch = line.match(/([\d,]+\.\d{2})\s+CR\b/);

          if (dateMatch && amountMatch) {
            const date = dateMatch[1];
            const amount = parseFloat(amountMatch[1].replace(/,/g, ""));
            const description = line
              .replace(date, "")
              .replace(amountMatch[0], "")
              .trim();
            return {
              date,
              description,
              amount,
            };
          }

          return null;
        })
        .filter(Boolean) as ExtractedTransaction[];

      setTransactions(
        crTransactions.map((t, i) => ({ ...t, key: `${i}-${t.date}` }))
      );
      message.success(`Extracted ${crTransactions.length} CR transactions`);
    } catch (err) {
      console.error("Error parsing PDF:", err);
      message.error("Failed to parse PDF");
    } finally {
      setLoading(false);
    }
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
          parsePdf(file);
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