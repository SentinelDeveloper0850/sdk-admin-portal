"use client";

import { Button, Drawer, Form, Input, InputNumber, Space } from "antd";
import axios from "axios";
import { useState } from "react";
import swal from "sweetalert";

export default function SupplierFormDrawer({
    open,
    onClose,
    onSaved,
}: {
    open: boolean;
    onClose: () => void;
    onSaved: () => void;
}) {
    const [form] = Form.useForm();
    const [saving, setSaving] = useState(false);

    const submit = async () => {
        try {
            const values = await form.validateFields();
            setSaving(true);

            const res = await axios.post("/api/ams/suppliers", values);
            if (!res.data?.success) throw new Error(res.data?.error || "Failed");

            swal({
                title: "Success",
                text: "Supplier created successfully",
                icon: "success",
            });

            form.resetFields();
            onSaved();
        } catch (err: any) {
            swal({
                title: "Error",
                text: err?.message || "Failed to save supplier",
                icon: "error",
            })
        } finally {
            setSaving(false);
        }
    };

    return (
        <Drawer
            title="Add Supplier"
            open={open}
            onClose={onClose}
            width={520}
            destroyOnClose
            extra={
                <Space>
                    <Button onClick={onClose}>Cancel</Button>
                    <Button type="primary" onClick={submit} loading={saving}>
                        Save
                    </Button>
                </Space>
            }
        >
            <Form layout="vertical" form={form}>
                <Form.Item label="Supplier Name" name="name" rules={[{ required: true }]}>
                    <Input placeholder="e.g. PC International" />
                </Form.Item>

                <Form.Item label="Default Warranty (months)" name="defaultWarrantyMonths">
                    <InputNumber min={0} style={{ width: "100%" }} placeholder="e.g. 12" />
                </Form.Item>

                <Form.Item label="Contact Name" name="contactName">
                    <Input />
                </Form.Item>
                <Form.Item label="Contact Email" name="contactEmail">
                    <Input />
                </Form.Item>
                <Form.Item label="Contact Phone" name="contactPhone">
                    <Input />
                </Form.Item>
            </Form>
        </Drawer>
    );
}
