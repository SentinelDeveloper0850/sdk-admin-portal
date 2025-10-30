"use client";

import { LoadingOutlined } from '@ant-design/icons'
import { Spin } from 'antd'
import React from 'react'

const ContentLoading = ({ message = "Loading...", description = "Please wait while we load the content..." }: { message?: string, description?: string }) => {
  return (
    <div className="text-center pt-24">
      <div className="mb-6">
        <Spin size="default" indicator={<LoadingOutlined style={{ fontSize: 48, color: '#FF6B00' }} spin />} />
      </div>
      <h1 className="mb-4 text-2xl font-bold text-center text-gray-800 dark:text-white">
        {message}
      </h1>
      <p className="w-full text-center text-base text-gray-600 dark:text-gray-300">
        {description}
      </p>
    </div>
  )
}

export default ContentLoading