"use client";

import { IPolicySignUp } from "@/app/models/scheme/policy-signup-request.schema";
import { Card, Collapse, Descriptions, Image, Modal, Space, Tag, Timeline, Typography } from "antd";
import { useState } from "react";

const { Text, Title } = Typography;
const { Panel } = Collapse;

interface PolicySignupViewModalProps {
  visible: boolean;
  onClose: () => void;
  record: IPolicySignUp | null;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case "submitted":
      return "blue";
    case "reviewed":
      return "orange";
    case "approved":
      return "green";
    case "rejected":
      return "red";
    case "pending_info":
      return "purple";
    case "escalated":
      return "volcano";
    case "archived":
      return "default";
    default:
      return "default";
  }
};

const getStatusText = (status: string) => {
  switch (status) {
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
    default:
      return status;
  }
};

export const PolicySignupViewModal = ({
  visible,
  onClose,
  record
}: PolicySignupViewModalProps) => {
  // File preview modal state
  const [filePreviewVisible, setFilePreviewVisible] = useState(false);
  const [previewFile, setPreviewFile] = useState<{ url: string; name: string; type: string } | null>(null);

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

  if (!record || !visible) return null;

  return (
    <>
      <Collapse
        defaultActiveKey={['basic-info']}
        bordered
        size="small"
        style={{ width: "100%" }}
      >
        {/* Basic Information */}
        <Panel
          header={
            <span style={{ fontWeight: 'bold', fontSize: '16px' }}>
              📋 Basic Information
            </span>
          }
          key="basic-info"
        >
          <Descriptions column={2} size="small">
            <Descriptions.Item label="Request ID">
              <Text code>{record.requestId}</Text>
            </Descriptions.Item>
            <Descriptions.Item label="Status">
              <Tag color={getStatusColor(record.currentStatus || "submitted")}>
                {getStatusText(record.currentStatus || "submitted")}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Full Names">
              {record.fullNames} {record.surname}
            </Descriptions.Item>
            <Descriptions.Item label="ID Number">
              {record.identificationNumber}
            </Descriptions.Item>
            <Descriptions.Item label="Email">
              {record.email || "Not provided"}
            </Descriptions.Item>
            <Descriptions.Item label="Phone">
              {record.phone}
            </Descriptions.Item>
            <Descriptions.Item label="Address" span={2}>
              {record.address || "Not provided"}
            </Descriptions.Item>
            <Descriptions.Item label="Plan">
              {record.plan?.name || record.plan?.id || "Unknown Plan"}
            </Descriptions.Item>
            <Descriptions.Item label="Dependents">
              {record.numberOfDependents}
            </Descriptions.Item>
            <Descriptions.Item label="Submitted">
              {new Date(record.created_at).toLocaleDateString()}
            </Descriptions.Item>
          </Descriptions>
        </Panel>

        {/* Dependents Information */}
        {record.dependents && record.dependents.length > 0 && (
          <Panel
            header={
              <span style={{ fontWeight: 'bold', fontSize: '16px' }}>
                👥 Dependents ({record.dependents.length})
              </span>
            }
            key="dependents"
          >
            <Space direction="vertical" style={{ width: "100%" }}>
              {record.dependents.map((dependent, index) => (
                <Card key={dependent.id || index} size="small" style={{ backgroundColor: '#fafafa' }}>
                  <Descriptions column={2} size="small">
                    <Descriptions.Item label="Name">
                      <Text strong>{dependent.fullNames} {dependent.surname}</Text>
                    </Descriptions.Item>
                    <Descriptions.Item label="Type">
                      <Tag color={dependent.isChild ? "blue" : "green"}>
                        {dependent.isChild ? "Child" : "Adult"}
                      </Tag>
                    </Descriptions.Item>
                    {dependent.identificationNumber && (
                      <Descriptions.Item label="ID Number">
                        {dependent.identificationNumber}
                      </Descriptions.Item>
                    )}
                    {dependent.dateOfBirth && (
                      <Descriptions.Item label="Date of Birth">
                        {dependent.dateOfBirth}
                      </Descriptions.Item>
                    )}
                  </Descriptions>
                </Card>
              ))}
            </Space>
          </Panel>
        )}

        {/* Uploaded Files */}
        {record.uploadedFiles && record.uploadedFiles.length > 0 && (
          <Panel
            header={
              <span style={{ fontWeight: 'bold', fontSize: '16px' }}>
                📎 Uploaded Files ({record.uploadedFiles.length})
              </span>
            }
            key="uploaded-files"
          >
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
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
          </Panel>
        )}

        {/* Assignment Information */}
        {record.assignedConsultantName && (
          <Panel
            header={
              <span style={{ fontWeight: 'bold', fontSize: '16px' }}>
                👤 Assignment
              </span>
            }
            key="assignment"
          >
            <Descriptions column={2} size="small">
              <Descriptions.Item label="Assigned Consultant">
                {record.assignedConsultantName}
              </Descriptions.Item>
              <Descriptions.Item label="Assigned Date">
                {record.assignedAt ? new Date(record.assignedAt).toLocaleDateString() : "N/A"}
              </Descriptions.Item>
            </Descriptions>
          </Panel>
        )}

        {/* Policy Information (if approved) */}
        {record.generatedPolicyNumber && (
          <Panel
            header={
              <span style={{ fontWeight: 'bold', fontSize: '16px' }}>
                📋 Policy Information
              </span>
            }
            key="policy-info"
          >
            <Descriptions column={2} size="small">
              <Descriptions.Item label="Policy Number">
                <Text strong style={{ fontFamily: 'monospace' }}>{record.generatedPolicyNumber}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Created Date">
                {record.policyCreatedAt ? new Date(record.policyCreatedAt).toLocaleDateString() : "N/A"}
              </Descriptions.Item>
            </Descriptions>
          </Panel>
        )}

        {/* Rejection Information (if rejected) */}
        {record.rejectionReason && (
          <Panel
            header={
              <span style={{ fontWeight: 'bold', fontSize: '16px' }}>
                ❌ Rejection Details
              </span>
            }
            key="rejection"
          >
            <Descriptions column={1} size="small">
              <Descriptions.Item label="Reason">
                {record.rejectionReason}
              </Descriptions.Item>
              {record.rejectionNotes && (
                <Descriptions.Item label="Notes">
                  {record.rejectionNotes}
                </Descriptions.Item>
              )}
            </Descriptions>
          </Panel>
        )}

        {/* Escalation Information (if escalated) */}
        {record.escalatedToName && (
          <Panel
            header={
              <span style={{ fontWeight: 'bold', fontSize: '16px' }}>
                ⚠️ Escalation Details
              </span>
            }
            key="escalation"
          >
            <Descriptions column={2} size="small">
              <Descriptions.Item label="Escalated To">
                {record.escalatedToName}
              </Descriptions.Item>
              <Descriptions.Item label="Escalated Date">
                {record.escalatedAt ? new Date(record.escalatedAt).toLocaleDateString() : "N/A"}
              </Descriptions.Item>
              {record.escalationReason && (
                <Descriptions.Item label="Reason" span={2}>
                  {record.escalationReason}
                </Descriptions.Item>
              )}
            </Descriptions>
          </Panel>
        )}

        {/* Requested Information */}
        {record.requestedInfo && record.requestedInfo.length > 0 && (
          <Panel
            header={
              <span style={{ fontWeight: 'bold', fontSize: '16px' }}>
                ❓ Requested Information ({record.requestedInfo.length})
              </span>
            }
            key="requested-info"
          >
            <Timeline>
              {record.requestedInfo.map((info, index) => (
                <Timeline.Item key={index}>
                  <div>
                    <Text strong>{info.field}</Text>
                    <br />
                    <Text type="secondary">{info.description}</Text>
                    <br />
                    <Text type="secondary">
                      Requested: {new Date(info.requestedAt).toLocaleDateString()}
                    </Text>
                    {info.providedValue && (
                      <>
                        <br />
                        <Text type="success">
                          Provided: {info.providedValue}
                          {info.providedAt && ` (${new Date(info.providedAt).toLocaleDateString()})`}
                        </Text>
                      </>
                    )}
                  </div>
                </Timeline.Item>
              ))}
            </Timeline>
          </Panel>
        )}

        {/* Internal Notes */}
        {record.internalNotes && record.internalNotes.length > 0 && (
          <Panel
            header={
              <span style={{ fontWeight: 'bold', fontSize: '16px' }}>
                📝 Internal Notes ({record.internalNotes.length})
              </span>
            }
            key="internal-notes"
          >
            <Timeline>
              {record.internalNotes.map((note, index) => (
                <Timeline.Item key={index}>
                  <div>
                    <Text strong>{note.authorName}</Text>
                    <br />
                    <Text>{note.text}</Text>
                    <br />
                    <Text type="secondary">
                      {new Date(note.createdAt).toLocaleDateString()}
                    </Text>
                  </div>
                </Timeline.Item>
              ))}
            </Timeline>
          </Panel>
        )}

        {/* Status History */}
        {record.statusHistory && record.statusHistory.length > 0 && (
          <Panel
            header={
              <span style={{ fontWeight: 'bold', fontSize: '16px' }}>
                📊 Status History ({record.statusHistory.length})
              </span>
            }
            key="status-history"
          >
            <Timeline>
              {record.statusHistory.map((status, index) => (
                <Timeline.Item key={index}>
                  <div>
                    <Tag color={getStatusColor(status.status)}>
                      {getStatusText(status.status)}
                    </Tag>
                    <br />
                    <Text type="secondary">
                      By: {status.changedBy} on {new Date(status.changedAt).toLocaleDateString()}
                    </Text>
                    {status.notes && (
                      <>
                        <br />
                        <Text>{status.notes}</Text>
                      </>
                    )}
                  </div>
                </Timeline.Item>
              ))}
            </Timeline>
          </Panel>
        )}

        {/* Original Message */}
        {record.message && (
          <Panel
            header={
              <span style={{ fontWeight: 'bold', fontSize: '16px' }}>
                💬 Original Message
              </span>
            }
            key="original-message"
          >
            <Text>{record.message}</Text>
          </Panel>
        )}
      </Collapse>

      {/* File Preview Modal */}
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
    </>
  );
};