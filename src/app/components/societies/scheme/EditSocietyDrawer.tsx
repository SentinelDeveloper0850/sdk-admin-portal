"use client";

import { ISchemeSociety } from "@/app/models/scheme/scheme-society.schema";
import { Button, Collapse, Drawer, Flex, Form, Input } from "antd";
import React, { useEffect } from "react";

interface EditSocietyDrawerProps {
  open: boolean;
  society: ISchemeSociety | null;
  onClose: () => void;
  onUpdated: (society: ISchemeSociety) => void;
}

const formItemStyles = "w-full";

export default function EditSocietyDrawer({ open, society, onClose, onUpdated }: EditSocietyDrawerProps) {
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = React.useState(false);

  useEffect(() => {
    if (open && society) {
      form.setFieldsValue(society as any);
    } else {
      form.resetFields();
    }
  }, [open, society, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      if (!society?._id) return;
      setSubmitting(true);

      const response = await fetch(`/api/societies/scheme`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: society._id, ...values }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        await sweetAlert({
          title: errorData.message || "Failed to update society",
          icon: "error",
          timer: 2000,
        });
        return;
      }

      const data = await response.json();
      await sweetAlert({
        title: "Society updated successfully",
        icon: "success",
        timer: 2000,
      });
      onUpdated(data);
      onClose();
    } catch (err) {
      await sweetAlert({ title: "Failed to update society", icon: "error", timer: 2000 });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Drawer
      title="Edit Society"
      open={open}
      width="40%"
      onClose={onClose}
      destroyOnClose
      footer={
        <div className="flex justify-end gap-2">
          <Button onClick={onClose}>Cancel</Button>
          <Button type="primary" className="text-black" loading={submitting} onClick={handleSubmit}>Save Changes</Button>
        </div>
      }
    >
      <Form layout="vertical" form={form} className="space-y-2">
        <Flex gap={16}>
          <Form.Item className={formItemStyles} label="Society Name" name="name" rules={[{ required: true, message: "Please enter society name" }]}>
            <Input />
          </Form.Item>

          <Form.Item className={formItemStyles} label="ID on ASSIT" name="assitID">
            <Input />
          </Form.Item>
          <Form.Item className={formItemStyles} label="Plan" name="planName" rules={[{ required: true, message: "Please enter plan" }]}>
            <Input />
          </Form.Item>
        </Flex>
        <Collapse accordion>
          <Collapse.Panel header="Chairman" key="1">
            <Flex gap={16}>
              <Form.Item className={formItemStyles} label="Name" name="chairman">
                <Input />
              </Form.Item>
              <Form.Item className={formItemStyles} label="Email" name="chairmanEmail">
                <Input />
              </Form.Item>
              <Form.Item className={formItemStyles} label="Phone" name="chairmanPhone">
                <Input />
              </Form.Item>
            </Flex>
          </Collapse.Panel>
          <Collapse.Panel header="Secretary" key="2">
            <Flex gap={16}>
              <Form.Item className={formItemStyles} label="Name" name="secretary">
                <Input />
              </Form.Item>
              <Form.Item className={formItemStyles} label="Email" name="secretaryEmail">
                <Input />
              </Form.Item>
              <Form.Item className={formItemStyles} label="Phone" name="secretaryPhone">
                <Input />
              </Form.Item>
            </Flex>
          </Collapse.Panel>
          <Collapse.Panel header="Treasurer" key="3">
            <Flex gap={16}>
              <Form.Item className={formItemStyles} label="Name" name="treasurer">
                <Input />
              </Form.Item>
              <Form.Item className={formItemStyles} label="Email" name="treasurerEmail">
                <Input />
              </Form.Item>
              <Form.Item className={formItemStyles} label="Phone" name="treasurerPhone">
                <Input />
              </Form.Item>
            </Flex>
          </Collapse.Panel>
        </Collapse>
      </Form>
    </Drawer>
  );
}


