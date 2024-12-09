"use client";

import React, { useState } from "react";

import { Button, Col, DatePicker, Form, Row, Select, message } from "antd";

interface BookingFormValues {
  vehicleId: string;
  tripDate: string;
  endDate: string;
  driverName: string;
}

const BookingForm: React.FC = () => {
  const [loading, setLoading] = useState(false);

  const handleBooking = async (values: BookingFormValues) => {
    setLoading(true);
    try {
      console.log("Booking Data:", values);
      message.success("Booking created successfully!");
    } catch (error) {
      console.error(error);
      message.error("Failed to create booking.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-lg rounded-md bg-white p-6 shadow-md">
      <h1 className="mb-4 text-2xl font-bold">Book a Vehicle</h1>
      <p className="mb-6 text-gray-500">
        Please provide the details below to book a vehicle.
      </p>
      <Form<BookingFormValues> layout="vertical" onFinish={handleBooking}>
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
              label="Trip Date"
              name="tripDate"
              rules={[
                { required: true, message: "Please select the trip date" },
              ]}
            >
              <DatePicker format="YYYY-MM-DD" style={{ width: "100%" }} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="End Date"
              name="endDate"
              rules={[
                { required: true, message: "Please select the end date" },
              ]}
            >
              <DatePicker format="YYYY-MM-DD" style={{ width: "100%" }} />
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
        </Row>
        <Row>
          <Col span={24}>
            <Form.Item>
              <Button type="primary" htmlType="submit" loading={loading}>
                Book Vehicle
              </Button>
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </div>
  );
};

export default BookingForm;
