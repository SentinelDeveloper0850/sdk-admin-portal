"use client";

import { CloseOutlined, SaveOutlined } from "@ant-design/icons";
import { Button, Drawer, Form, Input, Select, Space, message } from "antd";
import { useEffect, useState } from "react";
import sweetAlert from "sweetalert";

const { TextArea } = Input;

interface Props {
  open: boolean;
  onClose: () => void;
  policyId: string | null;
  policyNumber?: string;
  memberName?: string;
}

interface CancellationRequest {
  policyId: string;
  policyNumber: string;
  memberName: string;
  reason: string;
  cancellationType: string;
  effectiveDate: string;
  additionalNotes?: string;
}

const PolicyCancellationDrawer: React.FC<Props> = ({
  open,
  onClose,
  policyId,
  policyNumber,
  memberName
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && policyId) {
      form.setFieldsValue({
        policyId,
        policyNumber,
        memberName,
        cancellationType: "immediate",
        effectiveDate: new Date().toISOString().split('T')[0]
      });
    }
  }, [open, policyId, policyNumber, memberName, form]);

  const handleSubmit = async (values: CancellationRequest) => {
    try {
      // Show confirmation dialog
      const confirmed = await sweetAlert({
        title: "Confirm Cancellation Request",
        text: `Are you sure you want to submit a cancellation request for policy ${values.policyNumber}? This action cannot be undone.`,
        icon: "warning",
        buttons: ["Cancel", "Yes, submit request"],
        dangerMode: true,
      });

      if (!confirmed) return;

      setLoading(true);

      const response = await fetch("/api/policies/easipol/cancellation-request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to submit cancellation request");
      }

      const data = await response.json();

      if (data.success) {
        await sweetAlert({
          title: "Cancellation Request Submitted",
          text: "Your policy cancellation request has been submitted successfully. You will receive a confirmation email shortly.",
          icon: "success",
          timer: 3000,
        });

        form.resetFields();
        onClose();
      } else {
        throw new Error(data.message || "Failed to submit cancellation request");
      }
    } catch (error) {
      console.error("Cancellation request error:", error);
      message.error(error instanceof Error ? error.message : "Failed to submit cancellation request");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    form.resetFields();
    onClose();
  };

  return (
    <Drawer
      title="Policy Cancellation Request"
      placement="right"
      width="60%"
      onClose={handleClose}
      open={open}
      destroyOnClose
      extra={
        <Space>
          <Button icon={<CloseOutlined />} onClick={handleClose}>
            Cancel
          </Button>
          <Button
            type="primary"
            icon={<SaveOutlined />}
            onClick={() => form.submit()}
            loading={loading}
          >
            Submit Request
          </Button>
        </Space>
      }
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        className="space-y-4"
      >
        <Form.Item
          name="policyId"
          label="Policy ID"
          rules={[{ required: true, message: "Policy ID is required" }]}
        >
          <Input disabled aria-describedby="policy-id-help" />
        </Form.Item>
        <div id="policy-id-help" className="text-xs text-gray-500 mb-4">
          This is the unique identifier for the policy being cancelled.
        </div>

        <Form.Item
          name="policyNumber"
          label="Policy Number"
          rules={[{ required: true, message: "Policy number is required" }]}
        >
          <Input disabled aria-describedby="policy-number-help" />
        </Form.Item>
        <div id="policy-number-help" className="text-xs text-gray-500 mb-4">
          This is the policy number that will be cancelled.
        </div>

        <Form.Item
          name="memberName"
          label="Member Name"
          rules={[{ required: true, message: "Member name is required" }]}
        >
          <Input disabled aria-describedby="member-name-help" />
        </Form.Item>
        <div id="member-name-help" className="text-xs text-gray-500 mb-4">
          This is the name of the policy holder.
        </div>

        <Form.Item
          name="cancellationType"
          label="Cancellation Type"
          rules={[{ required: true, message: "Please select cancellation type" }]}
        >
          <Select aria-describedby="cancellation-type-help">
            <Select.Option value="immediate">Immediate Cancellation</Select.Option>
            <Select.Option value="end_of_period">End of Current Period</Select.Option>
            <Select.Option value="specific_date">Specific Date</Select.Option>
          </Select>
        </Form.Item>
        <div id="cancellation-type-help" className="text-xs text-gray-500 mb-4">
          Choose when the cancellation should take effect. Immediate means right away, End of Period means at the end of the current billing cycle, and Specific Date allows you to choose a custom date.
        </div>

        <Form.Item
          name="effectiveDate"
          label="Effective Date"
          rules={[
            { required: true, message: "Effective date is required" },
            {
              validator: async (_, value) => {
                if (!value) return;

                const selectedDate = new Date(value);
                const today = new Date(new Date().setHours(0, 0, 0, 0));
                const cancellationType = form.getFieldValue("cancellationType");

                if (cancellationType === "immediate" && selectedDate < today) {
                  throw new Error("Immediate cancellation effective date must be today or in the future");
                }

                if (cancellationType !== "immediate" && selectedDate <= new Date()) {
                  throw new Error("Effective date must be in the future for non-immediate cancellations");
                }
              }
            }
          ]}
        >
          <Input
            type="date"
            aria-describedby="effective-date-help"
            min={new Date().toISOString().split('T')[0]}
          />
        </Form.Item>
        <div id="effective-date-help" className="text-xs text-gray-500 mb-4">
          For immediate cancellation, select today or a future date. For other types, select a future date.
        </div>

        <Form.Item
          name="reason"
          label="Reason for Cancellation"
          rules={[{ required: true, message: "Please provide a reason for cancellation" }]}
        >
          <Select placeholder="Select a reason" aria-describedby="reason-help">
            <Select.Option value="financial_hardship">Financial Hardship</Select.Option>
            <Select.Option value="found_better_cover">Found Better Cover</Select.Option>
            <Select.Option value="no_longer_needed">No Longer Needed</Select.Option>
            <Select.Option value="dissatisfied_service">Dissatisfied with Service</Select.Option>
            <Select.Option value="moving_abroad">Moving Abroad</Select.Option>
            <Select.Option value="deceased">Deceased</Select.Option>
            <Select.Option value="other">Other</Select.Option>
          </Select>
        </Form.Item>
        <div id="reason-help" className="text-xs text-gray-500 mb-4">
          Please select the primary reason for requesting cancellation. This helps us process your request more efficiently.
        </div>

        <Form.Item
          name="additionalNotes"
          label="Additional Notes"
        >
          <TextArea
            rows={4}
            placeholder="Please provide any additional information that might help us process your request..."
            aria-describedby="additional-notes-help"
            maxLength={1000}
            showCount
          />
        </Form.Item>
        <div id="additional-notes-help" className="text-xs text-gray-500 mb-4">
          Optional: Provide any additional context or information that might help us process your cancellation request. Maximum 1000 characters.
        </div>
      </Form>
    </Drawer>
  );
};

export default PolicyCancellationDrawer; 