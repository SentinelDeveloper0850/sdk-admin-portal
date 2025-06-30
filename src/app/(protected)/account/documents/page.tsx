"use client";

import { useEffect, useState } from "react";

import { InboxOutlined } from "@ant-design/icons";
import { Button, Table, Tag, Upload, UploadProps, message } from "antd";
import dayjs from "dayjs";

import PageHeader from "@/app/components/page-header";

const { Dragger } = Upload;

const DocumentsPage = () => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/hr/documents");
      const json = await res.json();
      if (json.success) {
        setDocuments(json.data);
      } else {
        throw new Error(json.message);
      }
    } catch (err: any) {
      message.error(err.message || "Failed to load documents");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const uploadProps: UploadProps = {
    name: "file",
    action: "/api/hr/documents/upload",
    multiple: false,
    onChange(info) {
      const { status } = info.file;
      if (status === "done") {
        message.success(`${info.file.name} uploaded successfully`);
        fetchDocuments();
      } else if (status === "error") {
        message.error(`${info.file.name} upload failed.`);
      }
    },
    showUploadList: false,
  };

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title="My Documents"
        subtitle="Upload and manage your personal HR-related documents"
      />

      <Dragger {...uploadProps} accept="application/pdf,image/*">
        <p className="ant-upload-drag-icon">
          <InboxOutlined />
        </p>
        <p className="text-sm">Click or drag file to upload</p>
        <p className="text-xs text-gray-400">
          Supports PDF, JPG, PNG. Max 5MB.
        </p>
      </Dragger>

      <Table
        rowKey="_id"
        dataSource={documents}
        loading={loading}
        columns={[
          {
            title: "Document",
            dataIndex: "name",
          },
          {
            title: "Type",
            dataIndex: "type",
          },
          {
            title: "Status",
            dataIndex: "status",
            render: (status: string) => {
              let color = "gold";
              if (status === "Verified") color = "green";
              else if (status === "Rejected") color = "red";
              return <Tag color={color}>{status}</Tag>;
            },
          },
          {
            title: "Uploaded",
            dataIndex: "uploadedAt",
            render: (date) => dayjs(date).format("DD MMM YYYY"),
          },
          {
            title: "File",
            dataIndex: "fileUrl",
            render: (url: string) =>
              url ? (
                <Button type="link" href={url} target="_blank">
                  View
                </Button>
              ) : (
                <span className="italic text-gray-400">Missing</span>
              ),
          },
        ]}
        pagination={false}
      />
    </div>
  );
};

export default DocumentsPage;
