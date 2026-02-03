// src/app/(protected)/funerals/new/page.tsx
"use client";

import { useRouter } from "next/navigation";

import { ArrowLeftOutlined } from "@ant-design/icons";
import { Button, Space } from "antd";

import FuneralForm from "@/app/components/funerals/FuneralForm";
import PageHeader from "@/app/components/page-header";

// src/app/(protected)/funerals/new/page.tsx

// src/app/(protected)/funerals/new/page.tsx

export default function NewFuneralPage() {
  const router = useRouter();

  return (
    <div className="p-4">
      <PageHeader
        title="New Funeral"
        noDivider
        subtitle="Create a new funeral case file"
        actions={[
          <Space key="actions">
            <Button
              icon={<ArrowLeftOutlined />}
              onClick={() => router.push("/funerals")}
            >
              Back
            </Button>
          </Space>,
        ]}
      />

      <FuneralForm mode="create" onDone={() => router.push("/funerals")} />
    </div>
  );
}
