"use client";

import { useEffect, useState } from "react";

import { Col, Row, Space, Spin, Statistic, Table, message, Collapse, Popconfirm, Tag } from "antd";

import { withRoleGuard } from "@/utils/utils/with-role-guard";

import PageHeader from "@/app/components/page-header";
import { PolicySignupActions } from "@/app/components/policy-signup-actions";
import { PolicySignupViewModal } from "@/app/components/policy-signup-view-modal";
import { PolicySignupActionModals } from "@/app/components/policy-signup-action-modals";
import { IPolicySignUp } from "@/app/models/scheme/policy-signup-request.schema";
import { useAuth } from "@/context/auth-context";

import { ERoles } from "../../../../../types/roles.enum";

const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case "submitted":
      return "blue";
    case "reviewed":
      return "green";
    case "approved":
      return "green";
    case "rejected":
      return "red";
    case "archived":
      return "gray";
    case "deleted":
      return "gray";
    default:
      return "gray";
  }
};

const getStatusText = (status: string) => {
  switch (status.toLowerCase()) {
    case "submitted":
      return "Submitted";
    case "reviewed":
      return "Reviewed";
    case "approved":
      return "Approved";
    case "rejected":
      return "Rejected";
    case "archived":
      return "Archived";
    case "deleted":
      return "Deleted";
    default:
      return "Unknown";
  }
};

const SignupRequestsPage = () => {
  const [requests, setRequests] = useState<IPolicySignUp[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | boolean>(false);
  const [stats, setStats] = useState<{ count: number }>({ count: 0 });
  
  // Modal states
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [actionModalVisible, setActionModalVisible] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<IPolicySignUp | null>(null);
  const [currentAction, setCurrentAction] = useState<string | null>(null);

  const { user } = useAuth();

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/policies/signup-requests');
      const data = await response.json();

      if (data.success && data.data) {
        const { requests = [], count = 0 } = data.data;
        setRequests(requests);
        setStats({ count: count });
        return;
      } else {
        const errorData = data.error;
        setError(errorData.message || "Failed to fetch signup requests");
        return;
      }
    } catch (err) {
      console.log(err);
      setError("An error occurred while fetching policy signup requests.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  // Action handlers
  const handleView = (record: IPolicySignUp) => {
    setSelectedRecord(record);
    setViewModalVisible(true);
  };

  const handleAssignConsultant = (record: IPolicySignUp) => {
    setSelectedRecord(record);
    setCurrentAction("assign_consultant");
    setActionModalVisible(true);
  };

  const handleMarkAsReviewed = (record: IPolicySignUp) => {
    setSelectedRecord(record);
    setCurrentAction("mark_as_reviewed");
    setActionModalVisible(true);
  };

  const handleApprove = (record: IPolicySignUp) => {
    setSelectedRecord(record);
    setCurrentAction("approve");
    setActionModalVisible(true);
  };

  const handleReject = (record: IPolicySignUp) => {
    setSelectedRecord(record);
    setCurrentAction("reject");
    setActionModalVisible(true);
  };

  const handleRequestMoreInfo = (record: IPolicySignUp) => {
    setSelectedRecord(record);
    setCurrentAction("request_more_info");
    setActionModalVisible(true);
  };

  const handleAddNotes = (record: IPolicySignUp) => {
    setSelectedRecord(record);
    setCurrentAction("add_notes");
    setActionModalVisible(true);
  };

  const handleEscalate = (record: IPolicySignUp) => {
    setSelectedRecord(record);
    setCurrentAction("escalate");
    setActionModalVisible(true);
  };

  const handleArchive = (record: IPolicySignUp) => {
    setSelectedRecord(record);
    setCurrentAction("archive");
    setActionModalVisible(true);
  };

  const handleDelete = async (record: IPolicySignUp) => {
    try {
      const response = await fetch('/api/policies/signup-requests', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: record._id,
          deletedBy: user?._id
        }),
      });

      const data = await response.json();

      if (data.success) {
        message.success('Request deleted successfully');
        // Remove from local state
        setRequests(prev => prev.filter(req => req._id !== record._id));
        // Update stats
        setStats(prev => ({ count: prev.count - 1 }));
      } else {
        message.error(data.error || 'Failed to delete request');
      }
    } catch (error) {
      console.error('Error deleting request:', error);
      message.error('An error occurred while deleting the request');
    }
  };

  const handleActionSuccess = () => {
    fetchRequests();
    message.success("Action completed successfully");
  };

  const closeViewModal = () => {
    setViewModalVisible(false);
    setSelectedRecord(null);
  };

  const closeActionModal = () => {
    setActionModalVisible(false);
    setSelectedRecord(null);
    setCurrentAction(null);
  };

  if (loading) {
    return (
      <div
        className="h-[80vh]"
        style={{ padding: "20px", textAlign: "center" }}
      >
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div style={{ padding: "20px" }}>
      <PageHeader title="Signup Requests">
        <Row gutter={16}>
          <Col span={12}>
            <Space size={32}>
              <Statistic title="Total Requests" value={stats.count} />
              <Statistic
                title="Listed Requests"
                value={requests ? requests.length : 0}
              />
            </Space>
          </Col>
        </Row>
      </PageHeader>
      
      {error && (
        <div style={{ color: "red", marginBottom: "20px" }}>{error}</div>
      )}
      
      <Table
        rowKey="_id"
        bordered
        dataSource={requests}
        columns={[
          {
            title: "Main Member",
            dataIndex: "fullNames",
            key: "fullNames",
            render: (value, record) => (
              <>
                <p>
                  {record.fullNames} {record.surname}
                </p>
                <p>{record.identificationNumber}</p>
              </>
            ),
          },
          {
            title: "Contact",
            dataIndex: "email",
            key: "email",
            render: (value, record) => (
              <>
                <p>{record.email}</p>
                <p>{record.phone}</p>
              </>
            ),
          },
          {
            title: "Cover",
            dataIndex: "plan",
            key: "plan",
            render: (value, record) => (
              <>
                <p>{record.plan}</p>
                <p>{record.numberOfDependents} Dependents</p>
              </>
            ),
          },
          {
            title: "Address",
            dataIndex: "address",
            key: "address",
            render: (value: string, record) => {
              if (!value) return <span style={{ color: "#999" }}>Not provided</span>;
              const addressLines = value.split(",");
              return (
                <>
                  {addressLines.map((line: string, index: number) => (
                    <div key={index}>{line}</div>
                  ))}
                </>
              );
            },
          },
          {
            title: "Status",
            dataIndex: "status",
            key: "status",
            render: (value, record) => (
              <Tag color={getStatusColor(value)}>{getStatusText(value)}</Tag>
            ),
          },
          {
            title: "Actions",
            key: "actions",
            width: 200,
            render: (_, record) => (
              <PolicySignupActions
                record={record}
                onView={handleView}
                onAssignConsultant={handleAssignConsultant}
                onMarkAsReviewed={handleMarkAsReviewed}
                onApprove={handleApprove}
                onReject={handleReject}
                onRequestMoreInfo={handleRequestMoreInfo}
                onAddNotes={handleAddNotes}
                onEscalate={handleEscalate}
                onArchive={handleArchive}
                onDelete={handleDelete}
              />
            ),
          },
        ]}
        expandable={{
          expandedRowRender: (record: any) =>
            record.message ? (
              <div className="ml-0 whitespace-pre-wrap p-0 text-gray-700 dark:text-gray-400">
                💬<strong className="ml-1">Message:</strong> {record.message}
              </div>
            ) : (
              <i className="text-gray-400">No comments provided.</i>
            ),
          rowExpandable: (record) => !!record.message,
        }}
      />

      {/* View Modal */}
      <PolicySignupViewModal
        visible={viewModalVisible}
        onClose={closeViewModal}
        record={selectedRecord}
      />

      {/* Action Modals */}
      <PolicySignupActionModals
        visible={actionModalVisible}
        action={currentAction}
        record={selectedRecord}
        onClose={closeActionModal}
        onSuccess={handleActionSuccess}
      />
    </div>
  );
};

export default withRoleGuard(SignupRequestsPage, [
  ERoles.Admin,
  ERoles.SchemeConsultantOnline,
]);
