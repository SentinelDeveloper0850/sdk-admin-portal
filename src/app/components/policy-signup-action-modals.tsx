"use client";

import { useEffect, useState } from "react";

import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  EditOutlined,
  ExclamationCircleOutlined,
  InboxOutlined,
  QuestionCircleOutlined,
  UserAddOutlined,
} from "@ant-design/icons";
import {
  Button,
  Divider,
  Form,
  Input,
  Select,
  Space,
  Typography,
  message,
} from "antd";

import { IPolicySignUp } from "@/app/models/scheme/policy-signup-request.schema";
import { useAuth } from "@/context/auth-context";

const { TextArea } = Input;
const { Option } = Select;
const { Title } = Typography;

interface ActionModalProps {
  visible: boolean;
  action: string | null;
  record: IPolicySignUp | null;
  onClose: () => void;
  onSuccess: () => void;
}

interface Consultant {
  _id: string;
  name: string;
  email: string;
}

interface User {
  _id: string;
  name: string;
  email: string;
  roles: string[];
}

export const PolicySignupActionModals = ({
  visible,
  action,
  record,
  onClose,
  onSuccess,
}: ActionModalProps) => {
  const [form] = Form.useForm();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [consultants, setConsultants] = useState<Consultant[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [messageApi, contextHolder] = message.useMessage();

  useEffect(() => {
    if (visible) {
      loadConsultants();
      loadUsers();
      form.resetFields();
    }
  }, [visible]);

  const loadConsultants = async () => {
    try {
      const response = await fetch("/api/users?type=consultants&slim=true");
      const data = await response.json();
      if (data) {
        setConsultants(data);
      }
    } catch (error) {
      console.error("Failed to load consultants:", error);
    }
  };

  const loadUsers = async () => {
    try {
      const response = await fetch("/api/users?type=escalation&slim=true");
      const data = await response.json();
      if (data) {
        setUsers(data);
      }
    } catch (error) {
      console.error("Failed to load users:", error);
    }
  };

  const handleSubmit = async (values: any) => {
    if (!record || !user) return;

    setLoading(true);
    try {
      const userId = user._id || user.id || user.email;

      let response = null;

      console.log("🚀 ~ handleSubmit ~ action:", action, values);

      if (action === "assign_consultant") {
        response = await fetch(
          `/api/policies/assit/signup-requests/assign/${record._id}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ consultantId: values.consultantId }),
          }
        );
      } else {
        response = await fetch(
          `/api/policies/easipol/signup-requests/${record._id}`,
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              action,
              ...values,
              userId,
              authorName: user.name || user.email || "Unknown",
            }),
          }
        );

        const data = await response.json();

        if (data.success) {
          messageApi.success(
            `${getActionTitle(action)} completed successfully`
          );
          onSuccess();
          onClose();
        } else {
          messageApi.error(data.error || "Action failed");
        }
      }
    } catch (error) {
      console.error("Action failed:", error);
      messageApi.error("An error occurred while performing the action");
    } finally {
      setLoading(false);
    }
  };

  const getActionTitle = (action: string | null) => {
    switch (action) {
      case "assign_consultant":
        return "Assign Consultant";
      case "mark_as_reviewed":
        return "Mark as Reviewed";
      case "approve":
        return "Approve Request";
      case "reject":
        return "Reject Request";
      case "request_more_info":
        return "Request More Information";
      case "add_notes":
        return "Add Notes";
      case "escalate":
        return "Escalate Request";
      case "archive":
        return "Archive Request";
      default:
        return "Action";
    }
  };

  const getActionIcon = (action: string | null) => {
    switch (action) {
      case "assign_consultant":
        return <UserAddOutlined />;
      case "mark_as_reviewed":
        return <CheckCircleOutlined />;
      case "approve":
        return <CheckCircleOutlined />;
      case "reject":
        return <CloseCircleOutlined />;
      case "request_more_info":
        return <QuestionCircleOutlined />;
      case "add_notes":
        return <EditOutlined />;
      case "escalate":
        return <ExclamationCircleOutlined />;
      case "archive":
        return <InboxOutlined />;
      default:
        return null;
    }
  };

  const renderForm = () => {
    if (!record) return null;

    switch (action) {
      case "assign_consultant":
        return (
          <Form.Item
            name="consultantId"
            label="Select Consultant"
            rules={[{ required: true, message: "Please select a consultant" }]}
          >
            <Select placeholder="Choose a consultant">
              {consultants.map((consultant) => (
                <Option key={consultant._id} value={consultant._id}>
                  {consultant.name} ({consultant.email})
                </Option>
              ))}
            </Select>
          </Form.Item>
        );

      case "mark_as_reviewed":
        return (
          <Form.Item name="notes" label="Review Notes (Optional)">
            <TextArea
              rows={3}
              placeholder="Add any notes about the review..."
            />
          </Form.Item>
        );

      case "approve":
        return (
          <>
            <Form.Item name="policyNumber" label="Policy Number (Optional)">
              <Input placeholder="Leave blank to auto-generate" />
            </Form.Item>
            <div style={{ marginBottom: 16 }}>
              <TextArea
                rows={4}
                value={`Approving signup request for ${record.fullNames} ${record.surname} (ID: ${record.identificationNumber})`}
                disabled
              />
            </div>
          </>
        );

      case "reject":
        return (
          <>
            <Form.Item
              name="reason"
              label="Rejection Reason"
              rules={[
                {
                  required: true,
                  message: "Please provide a rejection reason",
                },
              ]}
            >
              <Select placeholder="Select a reason">
                <Option value="Incomplete Information">
                  Incomplete Information
                </Option>
                <Option value="Invalid Documentation">
                  Invalid Documentation
                </Option>
                <Option value="Does Not Meet Requirements">
                  Does Not Meet Requirements
                </Option>
                <Option value="Duplicate Application">
                  Duplicate Application
                </Option>
                <Option value="Other">Other</Option>
              </Select>
            </Form.Item>
            <Form.Item name="notes" label="Additional Notes">
              <TextArea rows={3} placeholder="Provide additional details..." />
            </Form.Item>
          </>
        );

      case "request_more_info":
        return (
          <>
            <Form.Item
              name="field"
              label="Information Field"
              rules={[
                {
                  required: true,
                  message: "Please specify what information is needed",
                },
              ]}
            >
              <Select placeholder="Select the type of information needed">
                <Option value="Additional Documentation">
                  Additional Documentation
                </Option>
                <Option value="Proof of Income">Proof of Income</Option>
                <Option value="Bank Details">Bank Details</Option>
                <Option value="Employment Verification">
                  Employment Verification
                </Option>
                <Option value="Address Verification">
                  Address Verification
                </Option>
                <Option value="Medical Information">Medical Information</Option>
                <Option value="Other">Other</Option>
              </Select>
            </Form.Item>
            <Form.Item
              name="description"
              label="Description"
              rules={[
                { required: true, message: "Please provide a description" },
              ]}
            >
              <TextArea
                rows={3}
                placeholder="Describe what specific information is needed..."
              />
            </Form.Item>
          </>
        );

      case "add_notes":
        return (
          <>
            <Form.Item
              name="text"
              label="Notes"
              rules={[{ required: true, message: "Please enter notes" }]}
            >
              <TextArea rows={4} placeholder="Enter your notes..." />
            </Form.Item>
            <Form.Item
              name="isPrivate"
              label="Private Notes"
              valuePropName="checked"
            >
              <Select defaultValue={true}>
                <Option value={true}>Private (Internal only)</Option>
                <Option value={false}>Public (Visible to applicant)</Option>
              </Select>
            </Form.Item>
          </>
        );

      case "escalate":
        return (
          <>
            <Form.Item
              name="escalatedTo"
              label="Escalate To"
              rules={[
                { required: true, message: "Please select who to escalate to" },
              ]}
            >
              <Select placeholder="Choose a user to escalate to">
                {users.map((user) => (
                  <Option key={user._id} value={user._id}>
                    {user.name} ({user.roles.join(", ")})
                  </Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item
              name="reason"
              label="Escalation Reason"
              rules={[
                {
                  required: true,
                  message: "Please provide a reason for escalation",
                },
              ]}
            >
              <TextArea
                rows={3}
                placeholder="Explain why this request needs to be escalated..."
              />
            </Form.Item>
          </>
        );

      case "archive":
        return (
          <Form.Item name="reason" label="Archive Reason (Optional)">
            <TextArea
              rows={3}
              placeholder="Reason for archiving (optional)..."
            />
          </Form.Item>
        );

      default:
        return null;
    }
  };

  if (!action || !record || !visible) return null;

  return (
    <>
      {contextHolder}
      <div style={{ padding: "16px" }}>
        <div style={{ marginBottom: 16 }}>
          <Title level={5}>
            <Space>
              {getActionIcon(action)}
              <span>{getActionTitle(action)}</span>
            </Space>
          </Title>
          <div style={{ marginBottom: 16 }}>
            <p>
              <strong>Applicant:</strong> {record.fullNames} {record.surname}
            </p>
            <p>
              <strong>ID Number:</strong> {record.identificationNumber}
            </p>
            <p>
              <strong>Plan:</strong> {record.plan?.name || "Unknown Plan"}
            </p>
            <p>
              <strong>Request ID:</strong> {record.requestId}
            </p>
          </div>
        </div>

        <Divider />

        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          {renderForm()}

          <Form.Item style={{ marginTop: 24 }}>
            <Space>
              <Button type="primary" htmlType="submit" loading={loading}>
                {getActionTitle(action)}
              </Button>
              <Button onClick={onClose}>Cancel</Button>
            </Space>
          </Form.Item>
        </Form>
      </div>
    </>
  );
};
