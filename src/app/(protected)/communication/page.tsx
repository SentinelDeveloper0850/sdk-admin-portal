"use client";

import { useEffect, useState } from "react";



import {
  Button,
  Col,
  Form,
  Modal,
  Row,
  Space,
  Spin,
  Statistic,
  Table,
  Tag,
} from "antd";

import { getDateTime } from "@/utils/formatters";

import whatsappIcon from "@/app/components/icons/Whatsapp.svg";

import PageHeader from "@/app/components/page-header";
import { useAuth } from "@/context/auth-context";


interface IExternalComm {
  _id: string;
  name: string;
  email: string;
  phone: string;
  contactType: string;
  message: string;
  status: string;
  ipAddress: string;
  userAgent: string;
  createdAt: string;
}

export default function CommunicationPage() {
  const [comms, setComms] = useState<IExternalComm[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | boolean>(false);
  const [stats, setStats] = useState<{ count: number }>({ count: 0 });
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const { user } = useAuth();

  const fetchComms = async () => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:5008/api/contact`);
      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.message || "Failed to fetch external communication");
        return;
      }

      const data = await response.json();
      console.log("🚀 ~ fetchComms ~ data:", data.data);
      setComms(data.data);
      setStats({ count: data.data.count });
    } catch (err) {
      console.log(err);
      setError("An error occurred while fetching external communication.");
    } finally {
      setLoading(false);
    }
  };

  const searchPolicies = async (value: string) => {
    try {
      const response = await fetch("/api/policies/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ searchText: value }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        setError(
          errorData.message || "Failed to search external communication"
        );
        return;
      }

      const data = await response.json();
      setComms(data);
    } catch (err) {
      console.log(err);
      setError("An error occurred while searching external communication");
    }
  };

  useEffect(() => {
    fetchComms();
  }, []);

  const handleDownload = () => {
    if (previewImage) {
      const link = document.createElement("a");
      link.href = previewImage;
      link.download = "payment-history.png";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleEmailShare = () => {
    if (previewImage) {
      const email =
        "?subject=Payment History&body=See attached payment history image.";
      const mailtoLink = `mailto:${email}`;
      window.location.href = mailtoLink;
    }
  };

  if (loading) {
    return (
      <div
        className="h-[80vh]"
        style={{ padding: "20px", textAlign: "center" }}
      >
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div style={{ padding: "20px" }}>
      <PageHeader
        title="Communication"
        subtitle="Manage external communication from the public here."
      >
        <Row gutter={16}>
          <Col span={12}>
            <Space size={32}>
              <Statistic
                title="Website Comms"
                value={comms ? comms.length : 0}
              />
            </Space>
          </Col>
        </Row>
      </PageHeader>
      {error && (
        <div style={{ color: "red", marginBottom: "20px" }}>{error}</div>
      )}
      
      <Table
        rowKey="_id"
        bordered
        dataSource={comms}
        columns={[
          {
            title: "Contact name",
            dataIndex: "name",
            key: "name",
          },
          {
            title: "Email address",
            dataIndex: "email",
            key: "email",
          },
          { title: "Phone number", dataIndex: "phone", key: "phone", render(value: string) {
            return <><span>{value}</span> <span>{whatsappIcon}</span></>
          } },
          {
            title: "Status",
            dataIndex: "status",
            key: "status",
            render(value: string, record, index) {
              return <Tag color="blue">{value.toUpperCase()}</Tag>;
            },
          },
          {
            title: "Date created",
            dataIndex: "createdAt",
            key: "createdAt",
            render(value: string, record, index) {
              return <span>{getDateTime(value)}</span>;
            },
          },
        ]}
        expandable={{
          expandedRowRender: (record) => (
            <p style={{ margin: 0 }}>
              <strong>Message: </strong>
              {record.message}
            </p>
          ),
          rowExpandable: (record) => record.name !== "Not Expandable",
        }}
      />

      {/* Modal to preview payment history image */}
      <Modal
        open={!!previewImage}
        footer={[
          <Button key="download" onClick={handleDownload}>
            Download
          </Button>,
          // <Button key="email" onClick={handleEmailShare}>
          //   Share via Email
          // </Button>,
          <Button key="close" onClick={() => setPreviewImage(null)}>
            Close
          </Button>,
        ]}
        onCancel={() => setPreviewImage(null)}
        width="80vw"
      >
        {previewImage && (
          <img
            src={previewImage}
            alt="Payment History"
            style={{ width: "100%", height: "100%", objectFit: "contain" }}
          />
        )}
      </Modal>
    </div>
  );
}