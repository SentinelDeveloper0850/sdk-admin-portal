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
} from "antd";
import Search from "antd/es/input/Search";

import PageHeader from "@/app/components/page-header";

interface IPolicy {
  _id: string;
  memberID: string;
  policyNumber: string;
  fullname: string;
  productName: string;
  cellNumber?: string;
  emailAddress?: string;
  paymentMethod?: string;
  currstatus?: string;
  paymentHistoryFile?: string;
}

export default function PoliciesPage() {
  const [policies, setPolicies] = useState<IPolicy[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | boolean>(false);
  const [stats, setStats] = useState<{ count: number }>({ count: 0 });
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const fetchPolicies = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/policies");
      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.message || "Failed to fetch policies");
        return;
      }

      const data = await response.json();
      setPolicies(data.policies);
      setStats({ count: data.count });
    } catch (err) {
      console.log(err);
      setError("An error occurred while fetching policies.");
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
        setError(errorData.message || "Failed to search policies");
        return;
      }

      const data = await response.json();
      setPolicies(data);
    } catch (err) {
      console.log(err);
      setError("An error occurred while searching policies.");
    }
  };

  useEffect(() => {
    fetchPolicies();
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
      <PageHeader title="Policies">
        <Row gutter={16}>
          <Col span={12}>
            <Space size={32}>
              <Statistic title="Total Policies" value={stats.count} />
              <Statistic
                title="Listed Policies"
                value={policies ? policies.length : 0}
              />
            </Space>
          </Col>
        </Row>
      </PageHeader>
      {error && (
        <div style={{ color: "red", marginBottom: "20px" }}>{error}</div>
      )}
      <Form layout="vertical" style={{ width: "100%" }}>
        <Form.Item>
          <p>Search Policies</p>
          <Search
            allowClear
            placeholder="Search by Member ID, Policy Number, or Name..."
            onSearch={(value) => {
              if (value.length > 0) {
                searchPolicies(value);
              } else {
                fetchPolicies();
              }
            }}
          />
        </Form.Item>
      </Form>
      <Table
        rowKey="_id"
        bordered
        dataSource={policies}
        columns={[
          {
            title: "Easipol Member ID",
            dataIndex: "memberId",
            key: "memberId",
          },
          {
            title: "Policy Number",
            dataIndex: "policyNumber",
            key: "policyNumber",
          },
          {
            title: "Easypay Number",
            dataIndex: "easypayNumber",
            key: "easypayNumber",
          },
          { title: "Main Member", dataIndex: "fullName", key: "fullName" },
          { title: "Product", dataIndex: "productName", key: "productName" },
          {
            title: "Payment History",
            dataIndex: "paymentHistoryFile",
            key: "paymentHistoryFile",
            render: (text) =>
              text ? (
                <Button
                  onClick={() =>
                    setPreviewImage(`data:image/png;base64,${text}`)
                  }
                >
                  View
                </Button>
              ) : (
                "No Image"
              ),
          },
        ]}
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
