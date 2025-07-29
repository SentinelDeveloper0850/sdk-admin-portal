"use client";

import { useEffect, useState } from "react";

import { Badge, Col, Drawer, Image, Modal, Row, Space, Spin, Statistic, Table, Tag, message } from "antd";

import { withRoleGuard } from "@/utils/utils/with-role-guard";

import PageHeader from "@/app/components/page-header";
import { PolicySignupActionModals } from "@/app/components/policy-signup-action-modals";
import { PolicySignupActions } from "@/app/components/policy-signup-actions";
import { PolicySignupViewModal } from "@/app/components/policy-signup-view-modal";
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
    case "pending_info":
      return "orange";
    case "escalated":
      return "purple";
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
    case "pending_info":
      return "Pending Info";
    case "escalated":
      return "Escalated";
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

  // Drawer states
  const [viewDrawerVisible, setViewDrawerVisible] = useState(false);
  const [actionDrawerVisible, setActionDrawerVisible] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<IPolicySignUp | null>(null);
  const [currentAction, setCurrentAction] = useState<string | null>(null);

  // File preview modal state (only modal)
  const [filePreviewVisible, setFilePreviewVisible] = useState(false);
  const [previewFile, setPreviewFile] = useState<{ url: string; name: string; type: string } | null>(null);

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
    setViewDrawerVisible(true);
  };

  const handleAssignConsultant = (record: IPolicySignUp) => {
    setSelectedRecord(record);
    setCurrentAction("assign_consultant");
    setActionDrawerVisible(true);
  };

  const handleMarkAsReviewed = (record: IPolicySignUp) => {
    setSelectedRecord(record);
    setCurrentAction("mark_as_reviewed");
    setActionDrawerVisible(true);
  };

  const handleApprove = (record: IPolicySignUp) => {
    setSelectedRecord(record);
    setCurrentAction("approve");
    setActionDrawerVisible(true);
  };

  const handleReject = (record: IPolicySignUp) => {
    setSelectedRecord(record);
    setCurrentAction("reject");
    setActionDrawerVisible(true);
  };

  const handleRequestMoreInfo = (record: IPolicySignUp) => {
    setSelectedRecord(record);
    setCurrentAction("request_more_info");
    setActionDrawerVisible(true);
  };

  const handleAddNotes = (record: IPolicySignUp) => {
    setSelectedRecord(record);
    setCurrentAction("add_notes");
    setActionDrawerVisible(true);
  };

  const handleEscalate = (record: IPolicySignUp) => {
    setSelectedRecord(record);
    setCurrentAction("escalate");
    setActionDrawerVisible(true);
  };

  const handleArchive = (record: IPolicySignUp) => {
    setSelectedRecord(record);
    setCurrentAction("archive");
    setActionDrawerVisible(true);
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

  const closeViewDrawer = () => {
    setViewDrawerVisible(false);
    setSelectedRecord(null);
  };

  const closeActionDrawer = () => {
    setActionDrawerVisible(false);
    setSelectedRecord(null);
    setCurrentAction(null);
  };

  // File preview handlers
  const handleFilePreview = (file: any) => {
    if (file.cloudinaryUrl) {
      setPreviewFile({
        url: file.cloudinaryUrl,
        name: file.originalName,
        type: file.type
      });
      setFilePreviewVisible(true);
    }
  };

  const closeFilePreview = () => {
    setFilePreviewVisible(false);
    setPreviewFile(null);
  };

  // Helper function to get file extension
  const getFileExtension = (filename: string) => {
    return filename.split('.').pop()?.toLowerCase() || '';
  };

  // Helper function to check if file is image
  const isImageFile = (filename: string) => {
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'];
    return imageExtensions.includes(getFileExtension(filename));
  };

  // Helper function to get file icon
  const getFileIcon = (filename: string, type: string) => {
    const ext = getFileExtension(filename);

    if (isImageFile(filename)) {
      return '🖼️';
    }

    switch (ext) {
      case 'pdf':
        return '📄';
      case 'doc':
      case 'docx':
        return '📝';
      case 'xls':
      case 'xlsx':
        return '📊';
      case 'txt':
        return '📄';
      default:
        return '📎';
    }
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
            title: "Request ID",
            dataIndex: "requestId",
            key: "requestId",
            width: 150,
            render: (value) => (
              <span style={{ fontFamily: 'monospace', fontSize: '12px' }}>
                {value}
              </span>
            ),
          },
          {
            title: "Main Member",
            dataIndex: "fullNames",
            key: "fullNames",
            render: (value, record) => (
              <>
                <p style={{ fontWeight: 'bold' }}>
                  {record.fullNames} {record.surname}
                </p>
                <p style={{ fontSize: '12px', color: '#666' }}>
                  ID: {record.identificationNumber}
                </p>
              </>
            ),
          },
          {
            title: "Contact",
            dataIndex: "email",
            key: "email",
            render: (value, record) => (
              <>
                <p>{record.email || 'No email'}</p>
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
                <p style={{ fontWeight: 'bold' }}>
                  {record.plan?.name || 'Unknown Plan'}
                </p>
                <p>
                  <Badge
                    count={record.numberOfDependents}
                    style={{ backgroundColor: '#52c41a' }}
                  />
                  {' '}Dependents
                </p>
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
                    <div key={index}>{line.trim()}</div>
                  ))}
                </>
              );
            },
          },
          {
            title: "Status",
            dataIndex: "currentStatus",
            key: "currentStatus",
            render: (value, record) => (
              <Tag color={getStatusColor(value || record.status)}>
                {getStatusText(value || record.status)}
              </Tag>
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
          expandedRowRender: (record: IPolicySignUp) => (
            <div style={{ padding: '16px' }}>
              {/* Message */}
              {record.message && (
                <div style={{ marginBottom: '16px' }}>
                  <h4>💬 Message:</h4>
                  <div className="whitespace-pre-wrap text-gray-700 dark:text-gray-400">
                    {record.message}
                  </div>
                </div>
              )}

              {/* Dependents */}
              {record.dependents && record.dependents.length > 0 && (
                <div style={{ marginBottom: '16px' }}>
                  <h4>👥 Dependents ({record.dependents.length}):</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '8px' }}>
                    {record.dependents.map((dependent, index) => (
                      <div key={dependent.id || index} style={{
                        border: '1px solid #d9d9d9',
                        borderRadius: '6px',
                        padding: '8px',
                        backgroundColor: '#fafafa'
                      }}>
                        <div><strong>{dependent.fullNames} {dependent.surname}</strong></div>
                        <div style={{ fontSize: '12px', color: '#666' }}>
                          {dependent.isChild ? 'Child' : 'Adult'}
                          {dependent.identificationNumber && ` • ID: ${dependent.identificationNumber}`}
                          {dependent.dateOfBirth && ` • DOB: ${dependent.dateOfBirth}`}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Uploaded Files */}
              {record.uploadedFiles && record.uploadedFiles.length > 0 && (
                <div style={{ marginBottom: '16px' }}>
                  <h4>📎 Uploaded Files ({record.uploadedFiles.length}):</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '12px' }}>
                    {record.uploadedFiles.map((file, index) => (
                      <div key={index} style={{
                        border: '1px solid #d9d9d9',
                        borderRadius: '8px',
                        padding: '12px',
                        backgroundColor: '#fafafa',
                        cursor: file.cloudinaryUrl ? 'pointer' : 'default',
                        transition: 'all 0.2s ease'
                      }}
                        onClick={() => file.cloudinaryUrl && handleFilePreview(file)}
                        onMouseEnter={(e) => {
                          if (file.cloudinaryUrl) {
                            e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
                            e.currentTarget.style.transform = 'translateY(-1px)';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (file.cloudinaryUrl) {
                            e.currentTarget.style.boxShadow = 'none';
                            e.currentTarget.style.transform = 'translateY(0)';
                          }
                        }}
                      >
                        {/* File Thumbnail */}
                        <div style={{
                          width: '100%',
                          aspectRatio: '1 / 1',
                          backgroundColor: '#fff',
                          borderRadius: '6px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginBottom: '8px',
                          border: '1px solid #e8e8e8',
                          overflow: 'hidden',
                          position: 'relative'
                        }}>
                          {isImageFile(file.originalName) && file.cloudinaryUrl ? (
                            <Image
                              src={file.cloudinaryUrl}
                              alt={file.originalName}
                              style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                                objectPosition: 'center'
                              }}
                              preview={false}
                            />
                          ) : (
                            <div style={{
                              fontSize: '48px',
                              color: '#666',
                              textAlign: 'center',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              width: '100%',
                              height: '100%'
                            }}>
                              {getFileIcon(file.originalName, file.type)}
                            </div>
                          )}
                        </div>

                        {/* File Info */}
                        <div style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>
                          {file.originalName}
                        </div>
                        <div style={{ fontSize: '11px', color: '#666', marginBottom: '4px' }}>
                          {file.type} • {file.personType} • {file.personName}
                        </div>
                        {file.cloudinaryUrl && (
                          <div style={{ fontSize: '11px' }}>
                            <span style={{ color: '#1890ff', cursor: 'pointer' }}>
                              👁️ Preview
                            </span>
                            {' • '}
                            <a
                              href={file.cloudinaryUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{ color: '#1890ff' }}
                              onClick={(e) => e.stopPropagation()}
                            >
                              📥 Download
                            </a>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Assigned Consultant */}
              {record.assignedConsultantName && (
                <div style={{ marginBottom: '16px' }}>
                  <h4>👤 Assigned Consultant:</h4>
                  <div>{record.assignedConsultantName}</div>
                  {record.assignedAt && (
                    <div style={{ fontSize: '12px', color: '#666' }}>
                      Assigned on: {new Date(record.assignedAt).toLocaleDateString()}
                    </div>
                  )}
                </div>
              )}

              {/* Generated Policy Number */}
              {record.generatedPolicyNumber && (
                <div style={{ marginBottom: '16px' }}>
                  <h4>📋 Policy Number:</h4>
                  <div style={{ fontFamily: 'monospace', fontWeight: 'bold', color: '#52c41a' }}>
                    {record.generatedPolicyNumber}
                  </div>
                  {record.policyCreatedAt && (
                    <div style={{ fontSize: '12px', color: '#666' }}>
                      Created on: {new Date(record.policyCreatedAt).toLocaleDateString()}
                    </div>
                  )}
                </div>
              )}

              {/* No additional info message */}
              {!record.message && (!record.dependents || record.dependents.length === 0) &&
                (!record.uploadedFiles || record.uploadedFiles.length === 0) &&
                !record.assignedConsultantName && !record.generatedPolicyNumber && (
                  <i className="text-gray-400">No additional information available.</i>
                )}
            </div>
          ),
          rowExpandable: (record: IPolicySignUp) =>
            !!record.message ||
            (record.dependents && record.dependents.length > 0) ||
            (record.uploadedFiles && record.uploadedFiles.length > 0) ||
            !!record.assignedConsultantName ||
            !!record.generatedPolicyNumber,
        }}
      />

      {/* View Drawer */}
      <Drawer
        title="Signup Request Details"
        placement="right"
        width="60%"
        onClose={closeViewDrawer}
        open={viewDrawerVisible}
        bodyStyle={{ paddingBottom: 80 }}
      >
        {selectedRecord && (
          <PolicySignupViewModal
            visible={viewDrawerVisible}
            onClose={closeViewDrawer}
            record={selectedRecord}
          />
        )}
      </Drawer>

      {/* Action Drawer */}
      <Drawer
        title="Action"
        placement="right"
        width="40%"
        onClose={closeActionDrawer}
        open={actionDrawerVisible}
        bodyStyle={{ paddingBottom: 80 }}
      >
        <PolicySignupActionModals
          visible={actionDrawerVisible}
          action={currentAction}
          record={selectedRecord}
          onClose={closeActionDrawer}
          onSuccess={handleActionSuccess}
        />
      </Drawer>

      {/* File Preview Modal (only modal) */}
      <Modal
        title={`File Preview: ${previewFile?.name}`}
        open={filePreviewVisible}
        onCancel={closeFilePreview}
        footer={[
          <a
            key="download"
            href={previewFile?.url}
            target="_blank"
            rel="noopener noreferrer"
            style={{ marginRight: '8px' }}
          >
            Download
          </a>
        ]}
        width={800}
        centered
      >
        {previewFile && (
          <div style={{ textAlign: 'center' }}>
            {isImageFile(previewFile.name) ? (
              <Image
                src={previewFile.url}
                alt={previewFile.name}
                style={{ maxWidth: '100%', maxHeight: '500px' }}
                preview={false}
              />
            ) : (
              <div style={{
                padding: '40px',
                backgroundColor: '#f5f5f5',
                borderRadius: '8px',
                margin: '20px 0'
              }}>
                <div style={{ fontSize: '64px', marginBottom: '16px' }}>
                  {getFileIcon(previewFile.name, previewFile.type)}
                </div>
                <div style={{ fontSize: '16px', color: '#666' }}>
                  {previewFile.name}
                </div>
                <div style={{ fontSize: '14px', color: '#999', marginTop: '8px' }}>
                  Click "Download" to view this file
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default withRoleGuard(SignupRequestsPage, [
  ERoles.Admin,
  ERoles.SchemeConsultantOnline,
]);
