// src/app/(protected)/funerals/[id]/page.tsx
"use client";

import FuneralForm from "@/app/components/funerals/FuneralForm";
import PageHeader from "@/app/components/page-header";
import { ArrowLeftOutlined, DeleteOutlined } from "@ant-design/icons";
import { Button, Popconfirm, Space } from "antd";
import { useParams, useRouter } from "next/navigation";
import sweetAlert from "sweetalert";

export default function FuneralDetailsPage() {
    const router = useRouter();
    const params = useParams<{ id: string }>();
    const id = params?.id;

    const onDelete = async () => {
        try {
            const res = await fetch(`/api/funerals/${id}?deleteCalendar=true`, { method: "DELETE" });
            const json = await res.json();
            if (!res.ok || !json?.success) throw new Error(json?.message || "Delete failed");
            sweetAlert({ title: "Success", text: "Funeral deleted", icon: "success" });
            router.push("/funerals");
        } catch (e: any) {
            console.error(e);
            sweetAlert({ title: "Error", text: e?.message || "Failed to delete", icon: "error" });
        }
    };

    return (
        <div className="p-4">
            <PageHeader
                title="Funeral"
                noDivider
                subtitle="Edit funeral case file"
                actions={[
                    <Space key="actions">
                        <Button icon={<ArrowLeftOutlined />} onClick={() => router.push("/funerals")}>
                            Back
                        </Button>
                        <Popconfirm title="Delete this funeral?" onConfirm={onDelete}>
                            <Button danger icon={<DeleteOutlined />}>
                                Delete
                            </Button>
                        </Popconfirm>
                    </Space>,
                ]}
            />

            <FuneralForm mode="edit" funeralId={id} onDone={() => router.push("/funerals")} />
        </div>
    );
}
