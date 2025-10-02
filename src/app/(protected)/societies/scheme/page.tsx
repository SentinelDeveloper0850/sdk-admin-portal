"use client";

import { useEffect, useState } from "react";

import { Col, Form, Row, Space, Spin, Statistic, Table } from "antd";
import Search from "antd/es/input/Search";

import PageHeader from "@/app/components/page-header";
import { ISchemeSociety } from "@/app/models/scheme/scheme-society.schema";

export default function SchemeSocietiesPage() {
  const [societies, setSocieties] = useState<ISchemeSociety[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | boolean>(false);
  const [stats, setStats] = useState<{ count: number }>({ count: 0 });

  const fetchSocieties = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/societies/scheme");
      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.message || "Failed to fetch scheme societies");
        return;
      }

      const data = await response.json();
      setSocieties(data.societies);
      setStats({ count: data.count });
    } catch (err) {
      console.log(err);
      setError("An error occurred while fetching scheme societies.");
    } finally {
      setLoading(false);
    }
  };

  const searchSocieties = async (value: string) => {
    try {
      const response = await fetch("/api/societies/scheme/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ searchText: value }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.message || "Failed to search scheme societies");
        return;
      }

      const data = await response.json();
      setSocieties(data.societies);
      setStats({ count: data.count });
    } catch (err) {
      console.log(err);
      setError("An error occurred while searching scheme societies.");
    }
  };

  useEffect(() => {
    fetchSocieties();
  }, []);

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
      <PageHeader title="Scheme Societies">
        <Row gutter={16} justify="space-between">
          <Col>
            <Space size={32}>
              <Statistic
                title="Total Societies"
                value={stats.count}
                className="dark:text-white"
              />
            </Space>
          </Col>
        </Row>
      </PageHeader>

      {error && (
        <div style={{ color: "red", marginBottom: "20px" }}>{error}</div>
      )}

      <Form
        layout="vertical"
        style={{ maxWidth: "400px", marginBottom: "20px" }}
      >
        <Form.Item label="Search Societies">
          <Search
            allowClear
            placeholder="Search by Society name, chairman, treasurer, secretary, etc..."
            onSearch={(value) => {
              if (value.length > 0) {
                searchSocieties(value);
              } else {
                fetchSocieties();
              }
            }}
          />
        </Form.Item>
      </Form>

      <Table
        rowKey="_id"
        dataSource={societies}
        columns={[
          { title: "ASSIT ID", dataIndex: "societyId" },
          {
            title: "Name",
            dataIndex: "name",
            render: (value: string, record: ISchemeSociety) => (
              <div>
                <p>{value}</p>
                <p>{record.phone}</p>
              </div>
            ),
          },
          {
            title: "Consultant",
            dataIndex: "consultantName",
          },
          { title: "Plan", dataIndex: "planName" },
          { title: "Address", dataIndex: "address" },
          {
            title: "Chairperson",
            dataIndex: "chairmanFullNames",
            render: (value: string, record: ISchemeSociety) => (
              <div>
                <p>{value}</p>
                <p>{record.chairmanPhone}</p>
              </div>
            ),
          },
          {
            title: "Secretary",
            dataIndex: "secretaryFullNames",
            render: (value: string, record: ISchemeSociety) => (
              <div>
                <p>{value}</p>
                <p>{record.secretaryPhone}</p>
              </div>
            ),
          },
          {
            title: "Treasurer",
            dataIndex: "treasurerFullNames",
            render: (value: string, record: ISchemeSociety) => (
              <div>
                <p>{value}</p>
                <p>{record.treasurerPhone}</p>
              </div>
            ),
          },
          {
            title: "Balance",
            dataIndex: "balance",
            render: (value: number) =>
              value ? `R ${(value / 100).toFixed(2)}` : "-",
          },
          {
            title: "Docs",
            render: (_, record: ISchemeSociety) =>
              record.documentLinks?.length ? (
                <a href={record.documentLinks[0]} target="_blank">
                  View
                </a>
              ) : (
                "-"
              ),
          },
        ]}
      />
    </div>
  );
}
