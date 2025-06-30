"use client";

import React from "react";

import { PlusOutlined } from "@ant-design/icons";
import {
  Button,
  Drawer,
  Form,
  Input,
  InputNumber,
  Select,
  Upload,
  message,
} from "antd";
import sweetAlert from "sweetalert";

const { TextArea } = Input;

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmitted: () => void;
}

const NewClaimDrawer: React.FC<Props> = ({ open, onClose, onSubmitted }) => {
  const [form] = Form.useForm();
  const [uploading, setUploading] = React.useState(false);
  const [documents, setDocuments] = React.useState<
    { name: string; url: string }[]
  >([]);

  const handleFileUpload = async (file: File) => {
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/api/upload/claim-documents", {
      method: "POST",
      body: formData,
    });

    const json = await res.json();
    setUploading(false);

    if (json.success) {
      const doc = { name: file.name, url: json.url };
      setDocuments((prev) => [...prev, doc]);
      message.success("File uploaded successfully");
      return false; // prevent default upload behavior
    } else {
      message.error("Upload failed");
      return Upload.LIST_IGNORE;
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const payload = { ...values, documents };

      const res = await fetch("/api/claims", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (res.ok) {
        sweetAlert({
          icon: "success",
          title: "Claim Submitted!",
          text: "Your claim has been successfully submitted.",
          timer: 2000,
        });
        resetForm();
        onClose();
        onSubmitted();
      } else {
        message.error(json.message || "Error submitting claim");
      }
    } catch (error) {
      message.error("Please correct the errors in the form.");
    }
  };

  const resetForm = () => {
    form.resetFields();
    setDocuments([]);
  };

  return (
    <Drawer
      title="Submit a New Claim"
      width={600}
      onClose={() => {
        resetForm();
        onClose();
      }}
      open={open}
      destroyOnClose
      footer={
        <div className="flex justify-end gap-2">
          <Button onClick={resetForm}>Reset</Button>
          <Button type="primary" onClick={handleSubmit} loading={uploading}>
            Submit Claim
          </Button>
        </div>
      }
    >
      <Form layout="vertical" form={form}>
        <Form.Item
          name="claimantName"
          label="Claimant Name"
          rules={[{ required: true }]}
        >
          <Input />
        </Form.Item>

        <Form.Item
          name="schemeType"
          label="Scheme Type"
          rules={[{ required: true }]}
        >
          <Select options={[{ value: "Individual" }, { value: "Society" }]} />
        </Form.Item>

        {form.getFieldValue("schemeType") === "Society" && (
          <Form.Item
            name="societyName"
            label="Society Name"
            rules={[{ required: true }]}
          >
            <Input />
          </Form.Item>
        )}

        <Form.Item
          name="policyId"
          label="Policy Number"
          rules={[{ required: true }]}
        >
          <Input />
        </Form.Item>

        <Form.Item
          name="policyPlan"
          label="Policy Plan"
          rules={[{ required: true }]}
        >
          <Input />
        </Form.Item>

        <Form.Item
          name="claimType"
          label="Claim Type"
          rules={[{ required: true }]}
        >
          <Select options={[{ value: "Cash" }, { value: "Service" }]} />
        </Form.Item>

        <Form.Item
          name="claimNumber"
          label="Claim Number"
          rules={[{ required: true }]}
        >
          <Input />
        </Form.Item>

        {form.getFieldValue("claimType") === "Cash" && (
          <Form.Item
            name="claimAmount"
            label="Claim Amount"
            rules={[{ required: true }]}
          >
            <InputNumber min={0} step={500} style={{ width: "100%" }} />
          </Form.Item>
        )}

        <Form.Item name="reason" label="Reason" rules={[{ required: true }]}>
          <TextArea rows={3} />
        </Form.Item>

        <Form.Item label="Supporting Documents">
          <Upload
            beforeUpload={handleFileUpload}
            showUploadList={false}
            multiple={false}
            accept=".pdf,.jpg,.png"
          >
            <Button icon={<PlusOutlined />} loading={uploading}>
              Upload File
            </Button>
          </Upload>
          <ul className="mt-2 list-disc pl-5 text-sm text-green-600">
            {documents.map((doc) => (
              <li key={doc.url}>{doc.name}</li>
            ))}
          </ul>
        </Form.Item>
      </Form>
    </Drawer>
  );
};

export default NewClaimDrawer;
