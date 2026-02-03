"use client";

import { LoadingOutlined } from "@ant-design/icons";
import { Card, Col, Row, Skeleton, Space, Spin } from "antd";

interface LoadingProps {
  type?: "fullscreen" | "inline" | "skeleton";
  message?: string;
  size?: "small" | "default" | "large";
}

export default function Loading({
  type = "fullscreen",
  message = "Loading...",
  size = "large",
}: LoadingProps) {
  if (type === "skeleton") {
    return <SkeletonLoading />;
  }

  if (type === "inline") {
    return (
      <div className="flex items-center justify-center py-8">
        <Spin
          size={size}
          tip={message}
          indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />}
        />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="text-center">
        <div className="mb-6">
          <Spin
            size={size}
            tip={message}
            indicator={
              <LoadingOutlined
                style={{ fontSize: 48, color: "#1890ff" }}
                spin
              />
            }
          />
        </div>
        <h1 className="mb-4 text-3xl font-bold text-gray-800 dark:text-white">
          {message}
        </h1>
        <p className="max-w-md text-base text-gray-600 dark:text-gray-300">
          Please wait while we prepare your content...
        </p>
      </div>
    </div>
  );
}

function SkeletonLoading() {
  return (
    <div style={{ padding: "20px" }}>
      {/* Page Header Skeleton */}
      <div className="mb-6">
        <Skeleton.Input
          active
          size="large"
          style={{ width: 200, height: 32, marginBottom: 16 }}
        />
        <Row gutter={16}>
          <Col span={12}>
            <Space size={32}>
              <div>
                <Skeleton.Input
                  active
                  size="small"
                  style={{ width: 120, height: 20, marginBottom: 8 }}
                />
                <Skeleton.Input
                  active
                  size="large"
                  style={{ width: 80, height: 32 }}
                />
              </div>
              <div>
                <Skeleton.Input
                  active
                  size="small"
                  style={{ width: 120, height: 20, marginBottom: 8 }}
                />
                <Skeleton.Input
                  active
                  size="large"
                  style={{ width: 80, height: 32 }}
                />
              </div>
            </Space>
          </Col>
        </Row>
      </div>

      {/* Search Results Indicator Skeleton */}
      <div className="mb-4">
        <Skeleton.Input
          active
          size="large"
          style={{ width: "100%", height: 48, borderRadius: 6 }}
        />
      </div>

      {/* Filters Skeleton */}
      <Card className="mb-4">
        <Row gutter={16}>
          <Col span={6}>
            <Skeleton.Input
              active
              size="large"
              style={{ width: "100%", height: 40 }}
            />
          </Col>
          <Col span={4}>
            <Skeleton.Input
              active
              size="large"
              style={{ width: "100%", height: 40 }}
            />
          </Col>
          <Col span={4}>
            <Skeleton.Input
              active
              size="large"
              style={{ width: "100%", height: 40 }}
            />
          </Col>
          <Col span={4}>
            <Skeleton.Input
              active
              size="large"
              style={{ width: "100%", height: 40 }}
            />
          </Col>
          <Col span={6}>
            <Skeleton.Button
              active
              size="large"
              style={{ width: "100%", height: 40 }}
            />
          </Col>
        </Row>
      </Card>

      {/* Table Skeleton */}
      <Card>
        <div className="mb-4">
          <Row gutter={16}>
            {Array.from({ length: 7 }).map((_, index) => (
              <Col key={index} span={24 / 7}>
                <Skeleton.Input
                  active
                  size="small"
                  style={{ width: "100%", height: 20 }}
                />
              </Col>
            ))}
          </Row>
        </div>

        {/* Table Rows */}
        {Array.from({ length: 8 }).map((_, rowIndex) => (
          <div key={rowIndex} className="mb-3">
            <Row gutter={16} align="middle">
              {Array.from({ length: 7 }).map((_, colIndex) => (
                <Col key={colIndex} span={24 / 7}>
                  <Skeleton.Input
                    active
                    size="small"
                    style={{
                      width: colIndex === 0 ? "80%" : "60%",
                      height: 16,
                      marginBottom: 4,
                    }}
                  />
                  {colIndex === 2 && (
                    <Skeleton.Input
                      active
                      size="small"
                      style={{ width: "40%", height: 12 }}
                    />
                  )}
                </Col>
              ))}
            </Row>
          </div>
        ))}
      </Card>
    </div>
  );
}
