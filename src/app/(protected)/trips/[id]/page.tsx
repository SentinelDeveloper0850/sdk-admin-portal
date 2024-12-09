"use client";

import { useParams, useRouter } from "next/navigation";
import React, { useState } from "react";

import { Button, Col, Form, Input, InputNumber, Row, message } from "antd";

const EndTripForm: React.FC = () => {
  const { id } = useParams(); // Extract 'id' from route parameters
  const router = useRouter(); // Next.js router for navigation
  const [loading, setLoading] = useState(false);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleEndTrip = async (values: any) => {
    setLoading(true);
    try {
      console.log("Trip End Data:", { ...values, tripId: id });
      message.success("Trip ended successfully!");
      router.push("/trips"); // Navigate back to the Trips page
    } catch (error) {
      console.error(error);
      message.error("Failed to end the trip.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-lg rounded-md bg-white p-6 shadow-md">
      <h1 className="mb-4 text-2xl font-bold">End Trip</h1>
      <p className="mb-6 text-gray-500">
        Please enter the final mileage and upload pictures of the vehicle to end
        the trip.
      </p>
      <Form layout="vertical" onFinish={handleEndTrip}>
        <Row gutter={16}>
          <Col span={24}>
            <Form.Item
              label="Final Mileage (km)"
              name="endMileage"
              rules={[
                { required: true, message: "Please enter the final mileage" },
              ]}
            >
              <InputNumber
                min={0}
                placeholder="Enter final mileage"
                style={{ width: "100%" }}
              />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col span={24}>
            <Form.Item
              label="Vehicle Pictures (End of Trip)"
              name="endVehiclePictures"
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
        <Row>
          <Col span={24}>
            <Form.Item>
              <Button type="primary" htmlType="submit" loading={loading}>
                End Trip
              </Button>
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </div>
  );
};

export default EndTripForm;
