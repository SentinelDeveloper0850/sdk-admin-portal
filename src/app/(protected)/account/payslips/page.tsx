"use client";

import React, { useEffect, useState } from "react";

import { DownloadOutlined } from "@ant-design/icons";
import { Button, Table, message } from "antd";
import dayjs from "dayjs";

import PageHeader from "@/app/components/page-header";

const PayslipsPage = () => {
  const [payslips, setPayslips] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchPayslips = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/hr/payslips");
      const json = await res.json();
      if (json.success) {
        setPayslips(json.data);
      } else {
        throw new Error(json.message);
      }
    } catch (err: any) {
      message.error(err.message || "Failed to load payslips");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayslips();
  }, []);

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title="My Payslips"
        subtitle="Securely view and download your salary slips"
      />

      <Table
        rowKey="_id"
        dataSource={payslips}
        loading={loading}
        columns={[
          {
            title: "Month",
            dataIndex: "month",
            render: (month: string) => dayjs(month).format("MMMM YYYY"),
          },
          {
            title: "Net Pay",
            dataIndex: "netPay",
            render: (amount) => (amount ? `R ${amount.toFixed(2)}` : "--"),
          },
          {
            title: "Issued",
            dataIndex: "createdAt",
            render: (date) => dayjs(date).format("DD MMM YYYY"),
          },
          {
            title: "Actions",
            dataIndex: "downloadUrl",
            render: (url: string) =>
              url ? (
                <Button
                  type="link"
                  href={url}
                  icon={<DownloadOutlined />}
                  target="_blank"
                >
                  Download
                </Button>
              ) : (
                <span className="italic text-gray-400">Unavailable</span>
              ),
          },
        ]}
        pagination={false}
      />
    </div>
  );
};

export default PayslipsPage;
