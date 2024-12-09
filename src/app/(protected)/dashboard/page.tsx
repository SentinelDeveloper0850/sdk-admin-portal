"use client";

import React from "react";

import { Card, Col, Row, Statistic } from "antd";

const DashboardPage: React.FC = () => {
  return (
    <div style={{ padding: "20px" }}>
      <h1 style={{ marginBottom: "20px" }}>Dashboard</h1>
      <Row gutter={[16, 16]}>
        {/* General Stats */}
        <Col span={6}>
          <Card>
            <Statistic title="Total Trips" value={45} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="Active Trips" value={10} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="Completed Trips" value={30} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="Cancelled Trips" value={5} />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: "20px" }}></Row>

      <Row gutter={[16, 16]} style={{ marginTop: "20px" }}>
        {/* Fleet Information */}
        <Col span={6}>
          <Card>
            <Statistic title="Vehicles in Use" value={8} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="Available Vehicles" value={12} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="Total Distance Traveled" value={"12,500 km"} />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: "20px" }}>
        {/* Driver Information */}
        <Col span={6}>
          <Card>
            <Statistic title="Active Drivers" value={6} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="Available Drivers" value={4} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="Maintenance Alerts" value={3} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="Overdue Trips" value={2} />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default DashboardPage;
