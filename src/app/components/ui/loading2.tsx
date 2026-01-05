"use client";

import { LoadingOutlined } from "@ant-design/icons";
import { Spin } from "antd";

interface LoadingProps {
  text?: string;
  subtext?: string;
}

export default function Loading2({
  text = "Loading...", subtext,
}: LoadingProps) {
  return (
    <div className="flex flex-col min-[calc(h-screen/2)] items-center justify-center">
      <div className="text-center">
        <div className="mb-6">
          <Spin size="large" indicator={<LoadingOutlined style={{ fontSize: 60, color: '#ffac00' }} spin />} />
        </div>
        <h1 className="mb-4 text-2xl font-medium text-gray-800 dark:text-white">
          {text}
        </h1>
        {subtext && <p className="max-w-md text-base text-gray-600 dark:text-gray-300">
          {subtext}
        </p>}
      </div>
    </div>
  );
}