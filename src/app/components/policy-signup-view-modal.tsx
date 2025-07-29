"use client";

import { IPolicySignUp } from "@/app/models/scheme/policy-signup-request.schema";
import { Card, Collapse, Descriptions, Image, Modal, Space, Tag, Timeline, Typography } from "antd";
import { useState } from "react";

const { Text, Title } = Typography;

interface PolicySignupViewModalProps {
  visible: boolean;
  onClose: () => void;
  record: IPolicySignUp | null;
}

export const PolicySignupViewModal = ({
  visible,
  onClose,
  record
}: PolicySignupViewModalProps) => {
  const [filePreviewVisible, setFilePreviewVisible] = useState(false);
  const [previewFile, setPreviewFile] = useState<{ url: string; name: string; type: string } | null>(null);

  const handleFilePreview = (file: any) => {
    setPreviewFile({
      url: file.cloudinaryUrl,
      name: file.originalName,
      type: file.type
    });
    setFilePreviewVisible(true);
  };

  const closeFilePreview = () => {
    setFilePreviewVisible(false);
    setPreviewFile(null);
  };

  const getFileExtension = (filename: string) => {
    return filename.split('.').pop()?.toLowerCase() || '';
  };

  const isImageFile = (filename: string) => {
    const ext = getFileExtension(filename);
    return ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(ext);
  };

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
      default:
        return '📎';
    }
  };

  if (!record || !visible) return null;

  // Prepare collapse items
  const collapseItems = [
    {
      key: 'basic-info',
      label: (
        <span style={{ fontWeight: 'bold', fontSize: '16px' }}>
          📋 Basic Information
        </span>
      ),
      children: (
        <Descriptions column={2} size="small">
          <Descriptions.Item label="Request ID">
            <Tag color="blue">{record.requestId}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Status">
            <Tag color={
              record.currentStatus === 'approved' ? 'green' :
                record.currentStatus === 'rejected' ? 'red' :
                  record.currentStatus === 'escalated' ? 'orange' :
                    'default'
            }>
              {record.currentStatus?.toUpperCase()}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Full Names">
            {record.fullNames}
          </Descriptions.Item>
          <Descriptions.Item label="Surname">
            {record.surname}
          </Descriptions.Item>
          <Descriptions.Item label="Email">
            {record.email || 'Not provided'}
          </Descriptions.Item>
          <Descriptions.Item label="Phone">
            {record.phone}
          </Descriptions.Item>
          <Descriptions.Item label="Address">
            {record.address || 'Not provided'}
          </Descriptions.Item>
          <Descriptions.Item label="ID Number">
            {record.identificationNumber}
          </Descriptions.Item>
          <Descriptions.Item label="Plan">
            <Tag color="purple">{record.plan?.name || 'Unknown Plan'}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Number of Dependents">
            {record.numberOfDependents}
          </Descriptions.Item>
          <Descriptions.Item label="Created At">
            {new Date(record.created_at).toLocaleString()}
          </Descriptions.Item>
        </Descriptions>
      )
    }
  ];

  // Add dependents section if exists
  if (record.dependents && record.dependents.length > 0) {
    collapseItems.push({
      key: 'dependents',
      label: (
        <span style={{ fontWeight: 'bold', fontSize: '16px' }}>
          👥 Dependents ({record.dependents.length})
        </span>
      ),
      children: (
        <Space direction="vertical" style={{ width: "100%" }}>
          {record.dependents.map((dependent, index) => (
            <Card key={index} size="small" title={`Dependent ${index + 1}`}>
              <Descriptions column={2} size="small">
                <Descriptions.Item label="Full Names">
                  {dependent.fullNames}
                </Descriptions.Item>
                <Descriptions.Item label="Surname">
                  {dependent.surname}
                </Descriptions.Item>
                <Descriptions.Item label="ID Number">
                  {dependent.identificationNumber || 'Not provided'}
                </Descriptions.Item>
                <Descriptions.Item label="Date of Birth">
                  {dependent.dateOfBirth || 'Not provided'}
                </Descriptions.Item>
                <Descriptions.Item label="Type">
                  <Tag color={dependent.isChild ? 'green' : 'blue'}>
                    {dependent.isChild ? 'Child' : 'Adult'}
                  </Tag>
                </Descriptions.Item>
              </Descriptions>
            </Card>
          ))}
        </Space>
      )
    });
  }

  // Add uploaded files section if exists
  if (record.uploadedFiles && record.uploadedFiles.length > 0) {
    collapseItems.push({
      key: 'uploaded-files',
      label: (
        <span style={{ fontWeight: 'bold', fontSize: '16px' }}>
          📎 Uploaded Files ({record.uploadedFiles.length})
        </span>
      ),
      children: (
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
                <span style={{ textTransform: 'capitalize' }}>
                  {file.personType.replace('-', ' ')}
                </span>
                {' • '}
                <span style={{ textTransform: 'capitalize' }}>
                  {file.type.replace('-', ' ')}
                </span>
              </div>
              {file.cloudinaryUrl && (
                <div style={{ fontSize: '11px', color: '#666' }}>
                  <span style={{ color: '#52c41a' }}>
                    ✓ Uploaded
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
      )
    });
  }

  // Add assignment section if exists
  if (record.assignedConsultantName) {
    collapseItems.push({
      key: 'assignment',
      label: (
        <span style={{ fontWeight: 'bold', fontSize: '16px' }}>
          👤 Assignment
        </span>
      ),
      children: (
        <Descriptions column={2} size="small">
          <Descriptions.Item label="Assigned Consultant">
            {record.assignedConsultantName}
          </Descriptions.Item>
          <Descriptions.Item label="Assigned At">
            {record.assignedAt ? new Date(record.assignedAt).toLocaleString() : 'Unknown'}
          </Descriptions.Item>
        </Descriptions>
      )
    });
  }

  // Add policy information section if exists
  if (record.generatedPolicyNumber) {
    collapseItems.push({
      key: 'policy-info',
      label: (
        <span style={{ fontWeight: 'bold', fontSize: '16px' }}>
          📋 Policy Information
        </span>
      ),
      children: (
        <Descriptions column={2} size="small">
          <Descriptions.Item label="Policy Number">
            <Tag color="green">{record.generatedPolicyNumber}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Created At">
            {record.policyCreatedAt ? new Date(record.policyCreatedAt).toLocaleString() : 'Unknown'}
          </Descriptions.Item>
          <Descriptions.Item label="Created By">
            {record.policyCreatedBy || 'Unknown'}
          </Descriptions.Item>
        </Descriptions>
      )
    });
  }

  // Add rejection information section if exists
  if (record.rejectionReason) {
    collapseItems.push({
      key: 'rejection',
      label: (
        <span style={{ fontWeight: 'bold', fontSize: '16px' }}>
          ❌ Rejection Details
        </span>
      ),
      children: (
        <Descriptions column={1} size="small">
          <Descriptions.Item label="Reason">
            <Tag color="red">{record.rejectionReason}</Tag>
          </Descriptions.Item>
          {record.rejectionNotes && (
            <Descriptions.Item label="Notes">
              <Text>{record.rejectionNotes}</Text>
            </Descriptions.Item>
          )}
        </Descriptions>
      )
    });
  }

  // Add escalation information section if exists
  if (record.escalatedToName) {
    collapseItems.push({
      key: 'escalation',
      label: (
        <span style={{ fontWeight: 'bold', fontSize: '16px' }}>
          ⚠️ Escalation Details
        </span>
      ),
      children: (
        <Descriptions column={2} size="small">
          <Descriptions.Item label="Escalated To">
            {record.escalatedToName}
          </Descriptions.Item>
          <Descriptions.Item label="Escalated At">
            {record.escalatedAt ? new Date(record.escalatedAt).toLocaleString() : 'Unknown'}
          </Descriptions.Item>
          {record.escalationReason && (
            <Descriptions.Item label="Reason" span={2}>
              <Text>{record.escalationReason}</Text>
            </Descriptions.Item>
          )}
        </Descriptions>
      )
    });
  }

  // Add requested information section if exists
  if (record.requestedInfo && record.requestedInfo.length > 0) {
    const timelineItems = record.requestedInfo.map((info, index) => ({
      key: index,
      children: (
        <div>
          <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
            {info.field}
          </div>
          <div style={{ color: '#666', marginBottom: '4px' }}>
            {info.description}
          </div>
          <div style={{ fontSize: '12px', color: '#999' }}>
            Requested on {new Date(info.requestedAt).toLocaleDateString()}
          </div>
          {info.providedAt && (
            <div style={{ fontSize: '12px', color: '#52c41a', marginTop: '4px' }}>
              ✓ Provided on {new Date(info.providedAt).toLocaleDateString()}
            </div>
          )}
        </div>
      )
    }));

    collapseItems.push({
      key: 'requested-info',
      label: (
        <span style={{ fontWeight: 'bold', fontSize: '16px' }}>
          ❓ Requested Information ({record.requestedInfo.length})
        </span>
      ),
      children: (
        <Timeline items={timelineItems} />
      )
    });
  }

  // Add internal notes section if exists
  if (record.internalNotes && record.internalNotes.length > 0) {
    const timelineItems = record.internalNotes.map((note, index) => ({
      key: index,
      children: (
        <div>
          <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
            {note.authorName}
            {note.isPrivate && (
              <Tag color="orange" style={{ marginLeft: '8px' }}>Private</Tag>
            )}
          </div>
          <div style={{ color: '#666', marginBottom: '4px' }}>
            {note.text}
          </div>
          <div style={{ fontSize: '12px', color: '#999' }}>
            {new Date(note.createdAt).toLocaleString()}
          </div>
        </div>
      )
    }));

    collapseItems.push({
      key: 'internal-notes',
      label: (
        <span style={{ fontWeight: 'bold', fontSize: '16px' }}>
          📝 Internal Notes ({record.internalNotes.length})
        </span>
      ),
      children: (
        <Timeline items={timelineItems} />
      )
    });
  }

  // Add status history section if exists
  if (record.statusHistory && record.statusHistory.length > 0) {
    const timelineItems = record.statusHistory.map((status, index) => ({
      key: index,
      children: (
        <div>
          <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
            <Tag color={
              status.status === 'approved' ? 'green' :
                status.status === 'rejected' ? 'red' :
                  status.status === 'escalated' ? 'orange' :
                    'default'
            }>
              {status.status.toUpperCase()}
            </Tag>
          </div>
          <div style={{ color: '#666', marginBottom: '4px' }}>
            Changed by: {status.changedBy}
          </div>
          {status.notes && (
            <div style={{ color: '#666', marginBottom: '4px' }}>
              {status.notes}
            </div>
          )}
          <div style={{ fontSize: '12px', color: '#999' }}>
            {new Date(status.changedAt).toLocaleString()}
          </div>
        </div>
      )
    }));

    collapseItems.push({
      key: 'status-history',
      label: (
        <span style={{ fontWeight: 'bold', fontSize: '16px' }}>
          📊 Status History ({record.statusHistory.length})
        </span>
      ),
      children: (
        <Timeline items={timelineItems} />
      )
    });
  }

  // Add original message section if exists
  if (record.message) {
    collapseItems.push({
      key: 'original-message',
      label: (
        <span style={{ fontWeight: 'bold', fontSize: '16px' }}>
          💬 Original Message
        </span>
      ),
      children: (
        <Text>{record.message}</Text>
      )
    });
  }

  return (
    <>
      <Collapse
        defaultActiveKey={['basic-info']}
        bordered
        size="small"
        style={{ width: "100%" }}
        items={collapseItems}
      />

      {/* File Preview Modal */}
      <Modal
        title={`File Preview: ${previewFile?.name}`}
        open={filePreviewVisible}
        onCancel={closeFilePreview}
        footer={null}
        width={800}
        centered
      >
        {previewFile && (
          <div style={{ textAlign: 'center' }}>
            {isImageFile(previewFile.name) ? (
              <Image
                src={previewFile.url}
                alt={previewFile.name}
                style={{ maxWidth: '100%', maxHeight: '60vh' }}
                preview={false}
              />
            ) : (
              <div style={{ padding: '40px' }}>
                <div style={{ fontSize: '64px', marginBottom: '16px' }}>
                  {getFileIcon(previewFile.name, previewFile.type)}
                </div>
                <div style={{ fontSize: '18px', marginBottom: '8px' }}>
                  {previewFile.name}
                </div>
                <div style={{ color: '#666' }}>
                  This file type cannot be previewed
                </div>
                <div style={{ marginTop: '16px' }}>
                  <a
                    href={previewFile.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: '#1890ff' }}
                  >
                    📥 Download File
                  </a>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </>
  );
};