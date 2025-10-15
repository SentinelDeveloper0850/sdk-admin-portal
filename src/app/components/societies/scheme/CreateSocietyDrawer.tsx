"use client";

import { ISchemeSociety } from "@/app/models/scheme/scheme-society.schema";
import { Button, Collapse, Drawer, Flex, Form, Input } from "antd";
import React from "react";

interface CreateSocietyDrawerProps {
  open: boolean;
  onClose: () => void;
  onCreated: (society: ISchemeSociety) => void;
}

const formItemStyles = "w-full";

export default function CreateSocietyDrawer({ open, onClose, onCreated }: CreateSocietyDrawerProps) {
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = React.useState(false);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);

      const response = await fetch("/api/societies/scheme", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        const errorData = await response.json();
        await sweetAlert({
          title: errorData.message || "Failed to create society",
          icon: "error",
          timer: 2000,
        });
        return;
      }

      const data = await response.json();
      await sweetAlert({
        title: "Society created successfully",
        icon: "success",
        timer: 2000,
      });
      form.resetFields();
      onClose();
      onCreated(data);
    } catch (err) {
      // validation or network error
      await sweetAlert({
        title: "Failed to create society",
        icon: "error",
        timer: 2000,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Drawer
      title="Create Society"
      open={open}
      width="40%"
      onClose={onClose}
      destroyOnClose
      footer={
        <div className="flex justify-end gap-2">
          <Button onClick={onClose}>Cancel</Button>
          <Button type="primary" className="text-black" loading={submitting} onClick={handleSubmit}>Create Society</Button>
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


