"use client";

import { useEffect, useState } from "react";

import { Col, Row, Space, Spin, Statistic, Table } from "antd";

import { withRoleGuard } from "@/utils/utils/with-role-guard";

import PageHeader from "@/app/components/page-header";
import { IPolicySignUp } from "@/app/models/scheme/policy-signup-request.schema";
import { useAuth } from "@/context/auth-context";
import { getPolicySignups } from "@/server/actions/policy-signup";

import { ERoles } from "../../../../../types/roles.enum";

const SignupRequestsPage = () => {
  const [requests, setRequests] = useState<IPolicySignUp[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | boolean>(false);
  const [stats, setStats] = useState<{ count: number }>({ count: 0 });
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const { user } = useAuth();

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const response = await getPolicySignups();

      if (response.success && response.data) {
        const { requests = [], count = 0 } = response.data;
        setRequests(requests);
        setStats({ count: count });
        return;
      } else {
        const errorData = response.error;
        setError(errorData.message || "Failed to fetch signup requests");
        return;
      }
    } catch (err) {
      console.log(err);
      setError("An error occurred while fetching policy signup requests.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
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
      <PageHeader title="Signup Requests">
        <Row gutter={16}>
          <Col span={12}>
            <Space size={32}>
              <Statistic title="Total Requests" value={stats.count} />
              <Statistic
                title="Listed Requests"
                value={requests ? requests.length : 0}
              />
            </Space>
          </Col>
        </Row>
      </PageHeader>
      {error && (
        <div style={{ color: "red", marginBottom: "20px" }}>{error}</div>
      )}
      {/* <Form layout="vertical" style={{ width: "100%" }}>
        <Form.Item>
          <p>Search Policies</p>
          <Search
            allowClear
            placeholder="Search by Member ID, Policy Number, or Name..."
            onSearch={(value) => {
              if (value.length > 0) {
                searchRequests(value);
              } else {
                fetchRequests();
              }
            }}
          />
        </Form.Item>
      </Form> */}
      <Table
        rowKey="_id"
        bordered
        dataSource={requests}
        columns={[
          {
            title: "Main Member",
            dataIndex: "fullNames",
            key: "fullNames",
            render: (value, record) => (
              <>
                <p>
                  {record.fullNames} {record.surname}
                </p>
                <p>{record.identificationNumber}</p>
              </>
            ),
          },
          {
            title: "Contact",
            dataIndex: "email",
            key: "email",
            render: (value, record) => (
              <>
                <p>{record.email}</p>
                <p>{record.phone}</p>
              </>
            ),
          },
          {
            title: "Cover",
            dataIndex: "plan",
            key: "plan",
            render: (value, record) => (
              <>
                <p>{record.plan}</p>
                <p>{record.numberOfDependents} Dependents</p>
              </>
            ),
          },
          {
            title: "Address",
            dataIndex: "address",
            key: "address",
            render: (value: string, record) => {
              const addressLines = value.split(",");
              return (
                <>
                  {addressLines.map((line: string) => (
                    <div>{line}</div>
                  ))}
                </>
              );
            },
          },
          {
            title: "Phone",
            dataIndex: "phone",
            key: "phone",
          },
        ]}
        expandable={{
          expandedRowRender: (record: any) =>
            record.message ? (
              <div className="ml-0 whitespace-pre-wrap p-0 text-gray-700 dark:text-gray-400">
                💬<strong className="ml-1">Message:</strong> {record.message}
              </div>
            ) : (
              <i className="text-gray-400">No comments provided.</i>
            ),
          rowExpandable: (record) => !!record.message,
        }}
      />
    </div>
  );
};

export default withRoleGuard(SignupRequestsPage, [
  ERoles.Admin,
  ERoles.SchemeConsultantOnline,
]);
