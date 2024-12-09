"use client";

import { useRouter } from "next/navigation";
import React from "react";

import { Button, Col, Form, Input, Row, message } from "antd";

import PageHeader from "@/app/components/page-header";

const CreateUser: React.FC = () => {
  const router = useRouter();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleSubmit = async (values: any) => {
    try {
      // Simulate API call (Replace with actual API integration)
      console.log("Vehicle Data:", values);

      message.success("Vehicle created successfully!");
      router.push("/vehicles"); // Navigate back to the Vehicles page
    } catch (error) {
      console.error(error);
      message.error("Failed to create vehicle.");
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <PageHeader
        title="Create Vehicle"
        subtitle="Add a new vehicle to your fleet"
        actions={[]}
      />
      <Form layout="vertical" onFinish={handleSubmit}>
        <Row gutter={16}>
          <Col span={8}>
            <Form.Item
              label="Enter name"
              name="fname"
              rules={[
                {
                  required: true,
                  message: "Please enter user name",
                },
              ]}
            >
              <Input placeholder="Enter name" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              label="Enter last name"
              name="lname"
              rules={[
                {
                  required: true,
                  message: "Please enter user last name",
                },
              ]}
            >
              <Input placeholder="Enter last name" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item
              label="Enter user role"
              name="role"
              rules={[
                {
                  required: true,
                  message: "Please enter user role",
                },
              ]}
            >
              <Input placeholder="Enter user role" />
            </Form.Item>
          </Col>
        </Row>

        <Row justify="center">
          <Col>
            <Form.Item>
              <Button type="primary" htmlType="submit">
                Send Invite
              </Button>
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </div>
  );
};

export default CreateUser;
