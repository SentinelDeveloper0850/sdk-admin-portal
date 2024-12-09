"use client";

import React, { useState } from "react";

import {
  Button,
  Col,
  Form,
  Input,
  InputNumber,
  Row,
  Select,
  message,
} from "antd";

interface StartTripFormValues {
  vehicleId: string;
  startLocation: string;
  startTime: string;
  driverName: string;
  vehicleCondition: string;
  startMileage: number;
}

const StartTripForm: React.FC = () => {
  const [loading, setLoading] = useState(false);

  const handleStartTrip = async (values: StartTripFormValues) => {
    setLoading(true);
    try {
      console.log("Trip Start Data:", values);
      message.success("Trip started successfully!");
    } catch (error) {
      console.error(error);
      message.error("Failed to start the trip.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-lg rounded-md bg-white p-6 shadow-md">
      <h1 className="mb-4 text-2xl font-bold">Start a Trip</h1>
      <p className="mb-6 text-gray-500">
        Please provide the details below to start your trip.
      </p>
      <Form<StartTripFormValues> layout="vertical" onFinish={handleStartTrip}>
        <Row gutter={16}>
          <Col span={24}>
            <Form.Item
              label="Vehicle Selection"
              name="vehicleId"
              rules={[{ required: true, message: "Please select a vehicle" }]}
            >
              <Select placeholder="Select a vehicle">
                <Select.Option value="Car A">Car A</Select.Option>
                <Select.Option value="Van B">Van B</Select.Option>
                <Select.Option value="Truck C">Truck C</Select.Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="Start Location"
              name="startLocation"
              rules={[
                { required: true, message: "Please enter the start location" },
              ]}
            >
              <Input placeholder="Enter start location" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="Start Time"
              name="startTime"
              initialValue={new Date().toLocaleString()}
              rules={[
                { required: true, message: "Start time is automatically set" },
              ]}
            >
              <Input readOnly />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="Driver"
              name="driverName"
              rules={[{ required: true, message: "Please select the driver" }]}
            >
              <Select placeholder="Select the driver">
                <Select.Option value="user">User (Self)</Select.Option>
                <Select.Option value="Driver 1">Driver 1</Select.Option>
                <Select.Option value="Driver 2">Driver 2</Select.Option>
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="Vehicle Pictures"
              name="vehiclePictures"
              rules={[
                {
                  required: true,
                  message: "Please upload pictures of the vehicle",
                },
              ]}
            >
              <Input type="file" accept="image/*" multiple />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="Starting Mileage (km)"
              name="startMileage"
              rules={[
                {
                  required: true,
                  message: "Please enter the starting mileage",
                },
              ]}
            >
              <InputNumber
                min={0}
                placeholder="Enter start mileage"
                style={{ width: "100%" }}
              />
            </Form.Item>
          </Col>
        </Row>
        <Row>
          <Col span={24}>
            <Form.Item>
              <Button type="primary" htmlType="submit" loading={loading}>
                Start Trip
              </Button>
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </div>
  );
};

export default StartTripForm;
