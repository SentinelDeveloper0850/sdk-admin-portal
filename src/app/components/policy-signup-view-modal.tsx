"use client";

import { Modal, Descriptions, Timeline, Card, Tag, Space, Typography } from "antd";
import { IPolicySignUp } from "@/app/models/scheme/policy-signup-request.schema";

const { Text, Title } = Typography;

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
  if (!record) return null;

  return (
    <Modal
      title="Signup Request Details"
      open={visible}
      onCancel={onClose}
      footer={null}
      width={800}
    >
      <Space direction="vertical" size="large" style={{ width: "100%" }}>
        {/* Basic Information */}
        <Card title="Basic Information" size="small">
          <Descriptions column={2} size="small">
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
              {record.plan}
            </Descriptions.Item>
            <Descriptions.Item label="Dependents">
              {record.numberOfDependents}
            </Descriptions.Item>
            <Descriptions.Item label="Status">
              <Tag color={getStatusColor(record.currentStatus || "submitted")}>
                {getStatusText(record.currentStatus || "submitted")}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Submitted">
              {new Date(record.created_at).toLocaleDateString()}
            </Descriptions.Item>
          </Descriptions>
        </Card>

        {/* Assignment Information */}
        {record.assignedConsultantName && (
          <Card title="Assignment" size="small">
            <Descriptions column={2} size="small">
              <Descriptions.Item label="Assigned Consultant">
                {record.assignedConsultantName}
              </Descriptions.Item>
              <Descriptions.Item label="Assigned Date">
                {record.assignedAt ? new Date(record.assignedAt).toLocaleDateString() : "N/A"}
              </Descriptions.Item>
            </Descriptions>
          </Card>
        )}

        {/* Policy Information (if approved) */}
        {record.generatedPolicyNumber && (
          <Card title="Policy Information" size="small">
            <Descriptions column={2} size="small">
              <Descriptions.Item label="Policy Number">
                <Text strong>{record.generatedPolicyNumber}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Created Date">
                {record.policyCreatedAt ? new Date(record.policyCreatedAt).toLocaleDateString() : "N/A"}
              </Descriptions.Item>
            </Descriptions>
          </Card>
        )}

        {/* Rejection Information (if rejected) */}
        {record.rejectionReason && (
          <Card title="Rejection Details" size="small">
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
          </Card>
        )}

        {/* Escalation Information (if escalated) */}
        {record.escalatedToName && (
          <Card title="Escalation Details" size="small">
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
          </Card>
        )}

        {/* Requested Information */}
        {record.requestedInfo && record.requestedInfo.length > 0 && (
          <Card title="Requested Information" size="small">
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
          </Card>
        )}

        {/* Internal Notes */}
        {record.internalNotes && record.internalNotes.length > 0 && (
          <Card title="Internal Notes" size="small">
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
          </Card>
        )}

        {/* Status History */}
        {record.statusHistory && record.statusHistory.length > 0 && (
          <Card title="Status History" size="small">
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
          </Card>
        )}

        {/* Original Message */}
        {record.message && (
          <Card title="Original Message" size="small">
            <Text>{record.message}</Text>
          </Card>
        )}
      </Space>
    </Modal>
  );
};