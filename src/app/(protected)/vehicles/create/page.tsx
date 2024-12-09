"use client";

import { useRouter } from "next/navigation";
import React from "react";

import {
  Button,
  Col,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Row,
  Select,
  message,
} from "antd";

import PageHeader from "@/app/components/page-header";

const { Option } = Select;

const CreateVehiclePage: React.FC = () => {
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
        {/* Identification Row */}
        <Row gutter={16}>
          <Col span={8}>
            {/* Registration Number */}
            <Form.Item
              label="Registration Number"
              name="registrationNumber"
              rules={[
                {
                  required: true,
                  message: "Please enter the vehicle registration number",
                },
              ]}
            >
              <Input placeholder="Enter registration number" />
            </Form.Item>
          </Col>
          <Col span={8}>
            {/* VIN */}
            <Form.Item label="VIN" name="vin">
              <Input placeholder="Enter VIN (Vehicle Identification Number)" />
            </Form.Item>
          </Col>
          <Col span={8}>
            {/* Owner */}
            <Form.Item label="Owner" name="owner">
              <Input placeholder="Enter owner name" />
            </Form.Item>
          </Col>
        </Row>

        {/* Vehicle Details Row */}
        <Row gutter={16}>
          <Col span={8}>
            {/* Type */}
            <Form.Item
              label="Type"
              name="type"
              rules={[
                { required: true, message: "Please select the vehicle type" },
              ]}
            >
              <Select placeholder="Select vehicle type">
                <Option value="Truck">Truck</Option>
                <Option value="Van">Van</Option>
                <Option value="Car">Car</Option>
              </Select>
            </Form.Item>
          </Col>
          <Col span={8}>
            {/* Make */}
            <Form.Item
              label="Make"
              name="make"
              rules={[
                { required: true, message: "Please enter the vehicle make" },
              ]}
            >
              <Input placeholder="Enter vehicle make (e.g., Toyota)" />
            </Form.Item>
          </Col>
          <Col span={8}>
            {/* Model */}
            <Form.Item
              label="Model"
              name="model"
              rules={[
                { required: true, message: "Please enter the vehicle model" },
              ]}
            >
              <Input placeholder="Enter vehicle model (e.g., Corolla)" />
            </Form.Item>
          </Col>
        </Row>

        {/* Technical Details Row */}
        <Row gutter={16}>
          <Col span={8}>
            {/* Year */}
            <Form.Item
              label="Year"
              name="year"
              rules={[
                {
                  required: true,
                  message: "Please enter the manufacturing year",
                },
              ]}
            >
              <InputNumber
                placeholder="Enter manufacturing year"
                min={1900}
                max={2100}
                style={{ width: "100%" }}
              />
            </Form.Item>
          </Col>
          <Col span={8}>
            {/* Engine Type */}
            <Form.Item label="Engine Type" name="engineType">
              <Select placeholder="Select engine type">
                <Option value="Diesel">Diesel</Option>
                <Option value="Petrol">Petrol</Option>
                <Option value="Electric">Electric</Option>
                <Option value="Hybrid">Hybrid</Option>
              </Select>
            </Form.Item>
          </Col>
          <Col span={8}>
            {/* Fuel Capacity */}
            <Form.Item label="Fuel Capacity (Liters)" name="fuelCapacity">
              <InputNumber
                placeholder="Enter fuel capacity"
                min={0}
                style={{ width: "100%" }}
              />
            </Form.Item>
          </Col>
        </Row>

        {/* Status and Performance Row */}
        <Row gutter={16}>
          <Col span={8}>
            {/* Status */}
            <Form.Item
              label="Status"
              name="status"
              rules={[
                { required: true, message: "Please select the vehicle status" },
              ]}
            >
              <Select placeholder="Select vehicle status">
                <Option value="Active">Active</Option>
                <Option value="Maintenance">Maintenance</Option>
                <Option value="Inactive">Inactive</Option>
              </Select>
            </Form.Item>
          </Col>
          <Col span={8}>
            {/* Mileage */}
            <Form.Item label="Mileage (km)" name="mileage">
              <InputNumber
                placeholder="Enter current mileage"
                min={0}
                style={{ width: "100%" }}
              />
            </Form.Item>
          </Col>
          <Col span={8}>
            {/* Load Capacity */}
            <Form.Item label="Load Capacity (kg)" name="loadCapacity">
              <InputNumber
                placeholder="Enter load capacity"
                min={0}
                style={{ width: "100%" }}
              />
            </Form.Item>
          </Col>
        </Row>

        {/* Date and Submit Row */}
        <Row gutter={16} justify="center">
          <Col span={8}>
            {/* Purchase Date */}
            <Form.Item label="Purchase Date" name="purchaseDate">
              <DatePicker style={{ width: "100%" }} />
            </Form.Item>
          </Col>
          <Col span={8}>
            {/* Car Alias */}
            <Form.Item
              label="Car Alias"
              name="alias"
              rules={[{ required: true, message: "Please enter a car alias" }]}
            >
              <Input placeholder="Enter car alias (e.g., 'Project Car', 'Fleet X')" />
            </Form.Item>
          </Col>
        </Row>
        <Row justify="center">
          <Col>
            <Form.Item>
              <Button type="primary" htmlType="submit">
                Create Vehicle
              </Button>
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </div>
  );
};

export default CreateVehiclePage;
