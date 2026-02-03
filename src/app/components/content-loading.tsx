"use client";

import React from "react";

import { LoadingOutlined } from "@ant-design/icons";
import { Spin } from "antd";

const ContentLoading = ({
  message = "Loading...",
  description = "Please wait while we load the content...",
}: {
  message?: string;
  description?: string;
}) => {
  return (
    <div className="pt-24 text-center">
      <div className="mb-6">
        <Spin
          size="default"
          indicator={
            <LoadingOutlined style={{ fontSize: 48, color: "#FF6B00" }} spin />
          }
        />
      </div>
      <h1 className="mb-4 text-center text-2xl font-bold text-gray-800 dark:text-white">
        {message}
      </h1>
      <p className="w-full text-center text-base text-gray-600 dark:text-gray-300">
        {description}
      </p>
    </div>
  );
};

export default ContentLoading;
