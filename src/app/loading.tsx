"use client";

import { Spin } from "antd";

export default function Loading() {
  return (
    <div className="flex flex-col min-h-screen items-center justify-center bg-white dark:bg-[#212121]">
      <div className="flex items-center justify-center">
        <Spin size="large" tip="Loading..." />
      </div>
      <h1 className="mb-4 text-4xl font-bold text-gray-800 dark:text-white">
        Loading
      </h1>
      <p className="max-w-xl text-lg text-gray-500 dark:text-gray-300">
        Please wait...
      </p>
    </div>
  );
}
