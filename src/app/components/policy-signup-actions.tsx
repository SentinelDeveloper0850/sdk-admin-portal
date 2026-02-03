"use client";

import { useState } from "react";

import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  DeleteOutlined,
  EditOutlined,
  ExclamationCircleOutlined,
  EyeOutlined,
  InboxOutlined,
  MoreOutlined,
  QuestionCircleOutlined,
  UserAddOutlined,
} from "@ant-design/icons";
import { Button, Dropdown, Popconfirm, Space, Tooltip, message } from "antd";

import { IPolicySignUp } from "@/app/models/scheme/policy-signup-request.schema";
import { useAuth } from "@/context/auth-context";

interface PolicySignupActionsProps {
  record: IPolicySignUp;
  onView: (record: IPolicySignUp) => void;
  onAssignConsultant: (record: IPolicySignUp) => void;
  onMarkAsReviewed: (record: IPolicySignUp) => void;
  onApprove: (record: IPolicySignUp) => void;
  onReject: (record: IPolicySignUp) => void;
  onRequestMoreInfo: (record: IPolicySignUp) => void;
  onAddNotes: (record: IPolicySignUp) => void;
  onEscalate: (record: IPolicySignUp) => void;
  onArchive: (record: IPolicySignUp) => void;
  onDelete: (record: IPolicySignUp) => void;
}

export const PolicySignupActions = ({
  record,
  onView,
  onAssignConsultant,
  onMarkAsReviewed,
  onApprove,
  onReject,
  onRequestMoreInfo,
  onAddNotes,
  onEscalate,
  onArchive,
  onDelete,
}: PolicySignupActionsProps) => {
  const { user, isAdmin } = useAuth();
  const [loading, setLoading] = useState<string | null>(null);

  const handleAction = async (
    action: string,
    callback: (record: IPolicySignUp) => void
  ) => {
    setLoading(action);
    try {
      callback(record);
    } finally {
      setLoading(null);
    }
  };

  const handleDelete = async () => {
    try {
      setLoading("delete");
      onDelete(record);
    } catch (error) {
      message.error("Failed to delete request");
    } finally {
      setLoading(null);
    }
  };

  const canDelete = () => {
    // Only admin users can delete
    if (!user || !isAdmin) {
      return false;
    }

    // Only allow deletion of certain statuses
    const deletableStatuses = ["submitted", "rejected", "archived"];
    return deletableStatuses.includes(record.currentStatus || "submitted");
  };

  const getActionItems = () => {
    const items = [
      {
        key: "view",
        label: "View Details",
        icon: <EyeOutlined />,
        onClick: () => handleAction("view", onView),
        danger: false,
      },
      {
        key: "assign",
        label: "Assign Consultant",
        icon: <UserAddOutlined />,
        onClick: () => handleAction("assign", onAssignConsultant),
        disabled:
          record.currentStatus === "approved" ||
          record.currentStatus === "rejected" ||
          record.currentStatus === "archived",
        danger: false,
      },
      {
        key: "review",
        label: "Mark as Reviewed",
        icon: <CheckCircleOutlined />,
        onClick: () => handleAction("review", onMarkAsReviewed),
        disabled:
          record.currentStatus === "approved" ||
          record.currentStatus === "rejected" ||
          record.currentStatus === "archived",
        danger: false,
      },
      {
        key: "approve",
        label: "Approve",
        icon: <CheckCircleOutlined />,
        onClick: () => handleAction("approve", onApprove),
        disabled:
          record.currentStatus === "approved" ||
          record.currentStatus === "rejected" ||
          record.currentStatus === "archived",
        danger: false,
      },
      {
        key: "reject",
        label: "Reject",
        icon: <CloseCircleOutlined />,
        onClick: () => handleAction("reject", onReject),
        disabled:
          record.currentStatus === "approved" ||
          record.currentStatus === "rejected" ||
          record.currentStatus === "archived",
        danger: false,
      },
      {
        key: "request_info",
        label: "Request More Info",
        icon: <QuestionCircleOutlined />,
        onClick: () => handleAction("request_info", onRequestMoreInfo),
        disabled:
          record.currentStatus === "approved" ||
          record.currentStatus === "rejected" ||
          record.currentStatus === "archived",
        danger: false,
      },
      {
        key: "notes",
        label: "Add Notes",
        icon: <EditOutlined />,
        onClick: () => handleAction("notes", onAddNotes),
        danger: false,
      },
      {
        key: "escalate",
        label: "Escalate",
        icon: <ExclamationCircleOutlined />,
        onClick: () => handleAction("escalate", onEscalate),
        disabled:
          record.currentStatus === "approved" ||
          record.currentStatus === "rejected" ||
          record.currentStatus === "archived",
        danger: false,
      },
      {
        key: "archive",
        label: "Archive",
        icon: <InboxOutlined />,
        onClick: () => handleAction("archive", onArchive),
        disabled:
          record.currentStatus === "submitted" ||
          record.currentStatus === "pending_info",
        danger: false,
      },
    ];

    // Add delete action for admin users
    if (canDelete()) {
      items.push({
        key: "delete",
        label: "Delete Request",
        icon: <DeleteOutlined style={{ color: "red" }} />,
        onClick: () => handleDelete(),
        danger: true,
      });
    }

    return items;
  };

  return (
    <Space direction="vertical" size="small" style={{ width: "100%" }}>
      {/* Assigned Consultant */}
      {record.assignedConsultantName && (
        <div style={{ fontSize: "12px", color: "#666" }}>
          Assigned: {record.assignedConsultantName}
        </div>
      )}

      {/* Action Buttons */}
      <Space size="small">
        {/* Primary Actions */}
        {record.currentStatus === "submitted" && (
          <>
            <Tooltip title="View Details">
              <Button
                type="text"
                size="small"
                icon={<EyeOutlined />}
                loading={loading === "view"}
                onClick={() => handleAction("view", onView)}
              />
            </Tooltip>
            <Tooltip title="Assign Consultant">
              <Button
                type="text"
                size="small"
                icon={<UserAddOutlined />}
                loading={loading === "assign"}
                onClick={() => handleAction("assign", onAssignConsultant)}
              />
            </Tooltip>
          </>
        )}

        {record.currentStatus === "reviewed" && (
          <Space size="small">
            <Tooltip title="Approve">
              <Button
                type="primary"
                size="small"
                icon={<CheckCircleOutlined />}
                loading={loading === "approve"}
                onClick={() => handleAction("approve", onApprove)}
              />
            </Tooltip>
            <Tooltip title="Reject">
              <Button
                danger
                size="small"
                icon={<CloseCircleOutlined />}
                loading={loading === "reject"}
                onClick={() => handleAction("reject", onReject)}
              />
            </Tooltip>
          </Space>
        )}

        {/* Delete Button for Admin Users */}
        {canDelete() && (
          <Popconfirm
            title="Delete this request?"
            description="This action cannot be undone. The request will be permanently deleted."
            onConfirm={handleDelete}
            okText="Yes, delete it"
            cancelText="Cancel"
            okType="danger"
          >
            <Tooltip title="Delete Request">
              <Button
                type="text"
                size="small"
                icon={<DeleteOutlined style={{ color: "red" }} />}
                loading={loading === "delete"}
                danger
              />
            </Tooltip>
          </Popconfirm>
        )}

        {/* More Actions Dropdown */}
        <Dropdown
          menu={{
            items: getActionItems(),
          }}
          trigger={["click"]}
        >
          <Button
            type="text"
            size="small"
            icon={<MoreOutlined />}
            loading={loading !== null}
          />
        </Dropdown>
      </Space>
    </Space>
  );
};
