"use client";

import { LoadingOutlined, ReloadOutlined } from "@ant-design/icons";
import { Spin, Skeleton, Button, Space, Typography } from "antd";
import { useState } from "react";

const { Text } = Typography;

interface LoadingProps {
  type?: "spinner" | "skeleton" | "inline" | "fullscreen";
  message?: string;
  size?: "small" | "default" | "large";
  retry?: () => void;
  error?: string;
  children?: React.ReactNode;
}

export default function Loading({ 
  type = "spinner", 
  message = "Loading...", 
  size = "default",
  retry,
  error,
  children
}: LoadingProps) {
  const [isRetrying, setIsRetrying] = useState(false);

  const handleRetry = async () => {
    if (retry) {
      setIsRetrying(true);
      try {
        await retry();
      } finally {
        setIsRetrying(false);
      }
    }
  };

  // Error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <div className="mb-4 text-red-500">
          <ReloadOutlined style={{ fontSize: 32 }} />
        </div>
        <Text type="danger" className="mb-4 text-lg">
          {error}
        </Text>
        {retry && (
          <Button 
            type="primary" 
            onClick={handleRetry}
            loading={isRetrying}
            icon={<ReloadOutlined />}
          >
            Try Again
          </Button>
        )}
      </div>
    );
  }

  // Inline loading
  if (type === "inline") {
    return (
      <div className="flex items-center justify-center py-4">
        <Spin 
          size={size} 
          tip={message}
          indicator={<LoadingOutlined style={{ fontSize: 16 }} spin />}
        />
      </div>
    );
  }

  // Fullscreen loading
  if (type === "fullscreen") {
    return (
      <div className="flex flex-col min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <div className="text-center">
          <div className="mb-6">
            <Spin 
              size={size} 
              tip={message}
              indicator={<LoadingOutlined style={{ fontSize: 48, color: '#1890ff' }} spin />}
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

  // Skeleton loading
  if (type === "skeleton") {
    return <SkeletonLoading />;
  }

  // Default spinner
  return (
    <div className="flex items-center justify-center py-8">
      <Space direction="vertical" align="center">
        <Spin 
          size={size} 
          tip={message}
          indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />}
        />
        {children}
      </Space>
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
        <Space size={32}>
          <div>
            <Skeleton.Input active size="small" style={{ width: 120, height: 20, marginBottom: 8 }} />
            <Skeleton.Input active size="large" style={{ width: 80, height: 32 }} />
          </div>
          <div>
            <Skeleton.Input active size="small" style={{ width: 120, height: 20, marginBottom: 8 }} />
            <Skeleton.Input active size="large" style={{ width: 80, height: 32 }} />
          </div>
        </Space>
      </div>

      {/* Search Results Indicator Skeleton */}
      <div className="mb-4">
        <Skeleton.Input 
          active 
          size="large" 
          style={{ width: '100%', height: 48, borderRadius: 6 }} 
        />
      </div>

      {/* Filters Skeleton */}
      <div className="mb-4 p-4 border rounded-lg">
        <div className="grid grid-cols-6 gap-4">
          <Skeleton.Input active size="large" style={{ width: '100%', height: 40 }} />
          <Skeleton.Input active size="large" style={{ width: '100%', height: 40 }} />
          <Skeleton.Input active size="large" style={{ width: '100%', height: 40 }} />
          <Skeleton.Input active size="large" style={{ width: '100%', height: 40 }} />
          <Skeleton.Input active size="large" style={{ width: '100%', height: 40 }} />
          <Skeleton.Button active size="large" style={{ width: '100%', height: 40 }} />
        </div>
      </div>

      {/* Table Skeleton */}
      <div className="border rounded-lg p-4">
        {/* Table Header */}
        <div className="mb-4">
          <div className="grid grid-cols-7 gap-4">
            {Array.from({ length: 7 }).map((_, index) => (
              <Skeleton.Input key={index} active size="small" style={{ width: '100%', height: 20 }} />
            ))}
          </div>
        </div>
        
        {/* Table Rows */}
        {Array.from({ length: 8 }).map((_, rowIndex) => (
          <div key={rowIndex} className="mb-3">
            <div className="grid grid-cols-7 gap-4 items-center">
              {Array.from({ length: 7 }).map((_, colIndex) => (
                <div key={colIndex}>
                  <Skeleton.Input 
                    active 
                    size="small" 
                    style={{ 
                      width: colIndex === 0 ? '80%' : '60%', 
                      height: 16,
                      marginBottom: 4
                    }} 
                  />
                  {colIndex === 2 && (
                    <Skeleton.Input 
                      active 
                      size="small" 
                      style={{ width: '40%', height: 12 }} 
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 