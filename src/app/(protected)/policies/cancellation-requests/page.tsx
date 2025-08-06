"use client";

import {
  CheckOutlined,
  CloseOutlined,
  DeleteOutlined,
  EyeOutlined,
  MoreOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import {
  Button,
  Card,
  Col,
  Descriptions,
  Divider,
  Drawer,
  Dropdown,
  Form,
  Input,
  Row,
  Select,
  Space,
  Spin,
  Statistic,
  Table,
  Tag,
  Tooltip,
  Typography
} from "antd";
import dayjs from "dayjs";
import { useEffect, useState } from "react";
import sweetAlert from "sweetalert";

import PageHeader from "@/app/components/page-header";
import { withRoleGuard } from "@/utils/utils/with-role-guard";

const { TextArea } = Input;
const { Option } = Select;
const { Title, Text } = Typography;

interface CancellationRequest {
  _id: string;
  policyId: string;
  policyNumber: string;
  memberName: string;
  reason: string;
  cancellationType: "immediate" | "end_of_period";
  effectiveDate: string;
  additionalNotes?: string;
  status: "pending" | "approved" | "rejected";
  submittedBy: {
    _id: string;
    name: string;
    email: string;
  };
  submittedAt: string;
  reviewedBy?: {
    _id: string;
    name: string;
    email: string;
  };
  reviewedAt?: string;
  reviewNotes?: string;
}

function CancellationRequestsPage() {
  const [requests, setRequests] = useState<CancellationRequest[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | boolean>(false);
  const [selectedRequest, setSelectedRequest] = useState<CancellationRequest | null>(null);
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [reviewForm] = Form.useForm();
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
  });
  const [filters, setFilters] = useState({
    status: "",
    policyNumber: "",
    memberName: "",
  });

  const fetchRequests = async () => {
    try {
      setLoading(true);
      setError(false);

      const queryParams = new URLSearchParams();
      if (filters.status) queryParams.append("status", filters.status);
      if (filters.policyNumber) queryParams.append("policyNumber", filters.policyNumber);
      if (filters.memberName) queryParams.append("memberName", filters.memberName);

      const response = await fetch(`/api/policies/cancellation-request?${queryParams}`);
      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.message || "Failed to fetch cancellation requests");
        return;
      }

      const data = await response.json();
      if (data.success) {
        setRequests(data.data.requests);
        // Calculate stats
        const total = data.data.requests.length;
        const pending = data.data.requests.filter((r: CancellationRequest) => r.status === "pending").length;
        const approved = data.data.requests.filter((r: CancellationRequest) => r.status === "approved").length;
        const rejected = data.data.requests.filter((r: CancellationRequest) => r.status === "rejected").length;
        setStats({ total, pending, approved, rejected });
      } else {
        setError(data.message || "Failed to fetch cancellation requests");
      }
    } catch (err) {
      console.error("Error fetching requests:", err);
      setError("An error occurred while fetching cancellation requests.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [filters]);

  const handleReview = async (values: { action: string; reviewNotes: string }) => {
    if (!selectedRequest) return;

    try {
      const response = await fetch(`/api/policies/cancellation-request/${selectedRequest._id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: values.action,
          reviewNotes: values.reviewNotes,
        }),
      });

      const data = await response.json();

      if (data.success) {
        sweetAlert({
          title: `Cancellation request ${values.action}d successfully`,
          icon: "success",
          timer: 2000,
        });
        setReviewModalVisible(false);
        setSelectedRequest(null);
        reviewForm.resetFields();
        fetchRequests();
      } else {
        sweetAlert({
          title: "Failed to process request",
          text: data.message || "An error occurred while processing the request.",
          icon: "error",
        });
      }
    } catch (error) {
      console.error("Error processing request:", error);
      sweetAlert({
        title: "Error processing cancellation request",
        text: "Please try again later.",
        icon: "error",
      });
    }
  };

  const handleDelete = async (requestId: string) => {
    const result = await sweetAlert({
      title: "Are you sure?",
      text: "This action cannot be undone. The cancellation request will be permanently deleted.",
      icon: "warning",
      buttons: ["Cancel", "Yes, delete it!"],
      dangerMode: true,
    });

    if (result === "Yes, delete it!") {
      try {
        const response = await fetch(`/api/policies/cancellation-request/${requestId}`, {
          method: "DELETE",
        });

        const data = await response.json();

        if (data.success) {
          sweetAlert({
            title: "Cancellation request deleted successfully",
            icon: "success",
            timer: 2000,
          });
          fetchRequests();
        } else {
          sweetAlert({
            title: "Failed to delete request",
            text: data.message || "An error occurred while deleting the request.",
            icon: "error",
          });
        }
      } catch (error) {
        console.error("Error deleting request:", error);
        sweetAlert({
          title: "Error deleting cancellation request",
          text: "Please try again later.",
          icon: "error",
        });
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "orange";
      case "approved":
        return "green";
      case "rejected":
        return "red";
      default:
        return "default";
    }
  };

  const getCancellationTypeText = (type: string) => {
    return type === "immediate" ? "Immediate" : "End of Period";
  };

  const handleSearch = (value: string) => {
    setFilters(prev => ({ ...prev, policyNumber: value }));
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
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
      <PageHeader title="Policy Cancellation Requests">
        <Row gutter={16}>
          <Col span={12}>
            <Space size={32}>
              <Statistic title="Total Requests" value={stats.total} />
              <Statistic
                title="Pending Review"
                value={stats.pending}
                valueStyle={{ color: "#faad14" }}
              />
              <Statistic
                title="Approved"
                value={stats.approved}
                valueStyle={{ color: "#52c41a" }}
              />
              <Statistic
                title="Rejected"
                value={stats.rejected}
                valueStyle={{ color: "#ff4d4f" }}
              />
            </Space>
          </Col>
        </Row>
      </PageHeader>

      {error && (
        <div className="mb-5 p-3 border rounded-md" style={{
          color: '#ef4444',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          borderColor: 'rgba(239, 68, 68, 0.3)'
        }}>
          {error}
        </div>
      )}

      {/* Search Results Indicator */}
      {(filters.status || filters.policyNumber || filters.memberName) && (
        <div className="mb-5 p-3 border rounded-md flex justify-between items-center" style={{
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          borderColor: 'rgba(59, 130, 246, 0.3)'
        }}>
          <div style={{ color: '#3b82f6' }}>
            Search results for: "
            {filters.policyNumber && `Policy: ${filters.policyNumber}`}
            {filters.policyNumber && filters.memberName && " & "}
            {filters.memberName && `Member: ${filters.memberName}`}
            {filters.status && (filters.policyNumber || filters.memberName) && " & "}
            {filters.status && `Status: ${filters.status}`}
            " ({requests.length} results)
          </div>
          <Button
            type="text"
            danger
            size="small"
            onClick={() => {
              setFilters({ status: "", policyNumber: "", memberName: "" });
            }}
            style={{
              border: '1px solid #ef4444',
              color: '#ef4444'
            }}
          >
            CLEAR SEARCH
          </Button>
        </div>
      )}

      <Form layout="vertical" style={{ width: "100%" }}>
        <Row gutter={16}>
          <Col span={6}>
            <Form.Item label="Search">
              <Input.Search
                allowClear
                placeholder="Search by policy number..."
                onSearch={handleSearch}
              />
            </Form.Item>
          </Col>
          <Col span={4}>
            <Form.Item label="Status">
              <Select
                allowClear
                placeholder="All Statuses"
                value={filters.status || undefined}
                onChange={(value: string) => handleFilterChange("status", value)}
              >
                <Option value="pending">Pending</Option>
                <Option value="approved">Approved</Option>
                <Option value="rejected">Rejected</Option>
              </Select>
            </Form.Item>
          </Col>
          <Col span={4}>
            <Form.Item label="Member Name">
              <Input
                placeholder="Search by member name"
                value={filters.memberName}
                onChange={(e) => handleFilterChange("memberName", e.target.value)}
              />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item label="Actions">
              <Space>
                <Button
                  icon={<ReloadOutlined />}
                  onClick={fetchRequests}
                  loading={loading}
                >
                  Refresh
                </Button>
                <Button
                  onClick={() => {
                    setFilters({ status: "", policyNumber: "", memberName: "" });
                  }}
                >
                  Clear Filters
                </Button>
              </Space>
            </Form.Item>
          </Col>
        </Row>
      </Form>

      <Table
        rowKey="_id"
        bordered
        dataSource={requests}
        rowClassName="cursor-pointer"
        loading={loading}
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total, range) =>
            `${range[0]}-${range[1]} of ${total} requests`,
        }}
        columns={[
          {
            title: "Policy Number",
            dataIndex: "policyNumber",
            key: "policyNumber",
            sorter: (a: CancellationRequest, b: CancellationRequest) =>
              a.policyNumber.localeCompare(b.policyNumber),
            render: (policyNumber: string) => (
              <span className="font-mono font-semibold">{policyNumber}</span>
            ),
          },
          {
            title: "Member Name",
            dataIndex: "memberName",
            key: "memberName",
            sorter: (a: CancellationRequest, b: CancellationRequest) =>
              a.memberName.localeCompare(b.memberName),
          },
          {
            title: "Cancellation Type",
            dataIndex: "cancellationType",
            key: "cancellationType",
            render: (type: string) => (
              <Tag color="blue" className="w-fit">
                {getCancellationTypeText(type)}
              </Tag>
            ),
          },
          {
            title: "Effective Date",
            dataIndex: "effectiveDate",
            key: "effectiveDate",
            render: (date: string) => dayjs(date).format("DD/MM/YYYY"),
            sorter: (a: CancellationRequest, b: CancellationRequest) =>
              dayjs(a.effectiveDate).unix() - dayjs(b.effectiveDate).unix(),
          },
          {
            title: "Reason",
            dataIndex: "reason",
            key: "reason",
            ellipsis: true,
            render: (reason: string) => (
              <Tooltip title={reason}>
                <span>{reason.length > 30 ? `${reason.substring(0, 30)}...` : reason}</span>
              </Tooltip>
            ),
          },
          {
            title: "Status",
            dataIndex: "status",
            key: "status",
            render: (status: string) => (
              <Tag color={getStatusColor(status)}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </Tag>
            ),
            filters: [
              { text: "Pending", value: "pending" },
              { text: "Approved", value: "approved" },
              { text: "Rejected", value: "rejected" },
            ],
            onFilter: (value: any, record: CancellationRequest) => record.status === value,
          },
          {
            title: "Submitted By",
            dataIndex: ["submittedBy", "name"],
            key: "submittedBy",
          },
          {
            title: "Submitted At",
            dataIndex: "submittedAt",
            key: "submittedAt",
            render: (date: string) => dayjs(date).format("DD/MM/YYYY HH:mm"),
            sorter: (a: CancellationRequest, b: CancellationRequest) =>
              dayjs(a.submittedAt).unix() - dayjs(b.submittedAt).unix(),
          },
          {
            title: "Actions",
            key: "actions",
            render: (_: any, record: CancellationRequest) => (
              <Dropdown
                menu={{
                  items: [
                    {
                      key: "view",
                      icon: <EyeOutlined />,
                      label: "View Details",
                      onClick: () => {
                        setSelectedRequest(record);
                        setViewModalVisible(true);
                      },
                    },
                    ...(record.status === "pending" ? [
                      {
                        key: "approve",
                        icon: <CheckOutlined />,
                        label: "Approve",
                        onClick: () => {
                          setSelectedRequest(record);
                          setReviewModalVisible(true);
                          reviewForm.setFieldsValue({ action: "approve" });
                        },
                      },
                      {
                        key: "reject",
                        icon: <CloseOutlined />,
                        label: "Reject",
                        onClick: () => {
                          setSelectedRequest(record);
                          setReviewModalVisible(true);
                          reviewForm.setFieldsValue({ action: "reject" });
                        },
                      },
                      {
                        key: "delete",
                        icon: <DeleteOutlined />,
                        label: "Delete",
                        danger: true,
                        onClick: () => handleDelete(record._id),
                      },
                    ] : []),
                  ],
                }}
                trigger={["click"]}
              >
                <Button icon={<MoreOutlined />} />
              </Dropdown>
            ),
          },
        ]}
      />

      {/* Review Drawer */}
      <Drawer
        title={`Review Cancellation Request - ${selectedRequest?.policyNumber}`}
        placement="right"
        width="60%"
        onClose={() => {
          setReviewModalVisible(false);
          setSelectedRequest(null);
          reviewForm.resetFields();
        }}
        open={reviewModalVisible}
        destroyOnClose
        extra={
          <Space>
            <Button
              onClick={() => {
                setReviewModalVisible(false);
                setSelectedRequest(null);
                reviewForm.resetFields();
              }}
            >
              Cancel
            </Button>
            <Button
              type="primary"
              onClick={() => reviewForm.submit()}
              loading={loading}
            >
              Submit Review
            </Button>
          </Space>
        }
      >
        {selectedRequest && (
          <div className="space-y-6">
            {/* Request Information Card */}
            <Card
              title="Request Information"
              size="small"
            >
              <Row gutter={24}>
                <Col span={12}>
                  <Descriptions column={1} size="small">
                    <Descriptions.Item label="Member Name">
                      <Text strong>{selectedRequest.memberName}</Text>
                    </Descriptions.Item>
                    <Descriptions.Item label="Cancellation Type">
                      <Tag color="blue">{getCancellationTypeText(selectedRequest.cancellationType)}</Tag>
                    </Descriptions.Item>
                    <Descriptions.Item label="Effective Date">
                      <Text>{dayjs(selectedRequest.effectiveDate).format("DD/MM/YYYY")}</Text>
                    </Descriptions.Item>
                  </Descriptions>
                </Col>
                <Col span={12}>
                  <Descriptions column={1} size="small">
                    <Descriptions.Item label="Submitted By">
                      <Text strong>{selectedRequest.submittedBy.name}</Text>
                    </Descriptions.Item>
                    <Descriptions.Item label="Submitted At">
                      <Text>{dayjs(selectedRequest.submittedAt).format("DD/MM/YYYY HH:mm")}</Text>
                    </Descriptions.Item>
                    <Descriptions.Item label="Reason">
                      <Tag color="orange">{selectedRequest.reason}</Tag>
                    </Descriptions.Item>
                  </Descriptions>
                </Col>
              </Row>
            </Card>

            {/* Additional Notes Card */}
            {selectedRequest.additionalNotes && (
              <Card
                title="Additional Notes"
                size="small"
              >
                <Text>{selectedRequest.additionalNotes}</Text>
              </Card>
            )}

            <Divider />

            {/* Review Form Card */}
            <Card
              title="Review Decision"
              size="small"
            >
              <Form
                form={reviewForm}
                onFinish={handleReview}
                layout="vertical"
                className="mt-4"
              >
                <Row gutter={16}>
                  <Col span={12}>
                    <Form.Item
                      name="action"
                      label="Action"
                      rules={[{ required: true, message: "Please select an action" }]}
                    >
                      <Select placeholder="Select action">
                        <Option value="approve">Approve</Option>
                        <Option value="reject">Reject</Option>
                      </Select>
                    </Form.Item>
                  </Col>
                </Row>

                <Form.Item
                  name="reviewNotes"
                  label="Review Notes"
                  rules={[{ required: true, message: "Please provide review notes" }]}
                >
                  <TextArea
                    rows={4}
                    placeholder="Please provide detailed notes for your decision..."
                    maxLength={500}
                    showCount
                  />
                </Form.Item>
              </Form>
            </Card>
          </div>
        )}
      </Drawer>

      {/* View Details Drawer */}
      <Drawer
        title={`Cancellation Request Details - ${selectedRequest?.policyNumber}`}
        placement="right"
        width="60%"
        onClose={() => {
          setViewModalVisible(false);
          setSelectedRequest(null);
        }}
        open={viewModalVisible}
        destroyOnClose
      >
        {selectedRequest && (
          <div className="space-y-6">
            {/* Request Information Card */}
            <Card
              title="Request Information"
              size="small"
            >
              <Row gutter={24}>
                <Col span={12}>
                  <Descriptions column={1} size="small">
                    <Descriptions.Item label="Policy Number">
                      <Text strong className="font-mono">{selectedRequest.policyNumber}</Text>
                    </Descriptions.Item>
                    <Descriptions.Item label="Member Name">
                      <Text strong>{selectedRequest.memberName}</Text>
                    </Descriptions.Item>
                    <Descriptions.Item label="Cancellation Type">
                      <Tag color="blue">{getCancellationTypeText(selectedRequest.cancellationType)}</Tag>
                    </Descriptions.Item>
                    <Descriptions.Item label="Effective Date">
                      <Text>{dayjs(selectedRequest.effectiveDate).format("DD/MM/YYYY")}</Text>
                    </Descriptions.Item>
                    <Descriptions.Item label="Status">
                      <Tag color={getStatusColor(selectedRequest.status)}>
                        {selectedRequest.status.charAt(0).toUpperCase() + selectedRequest.status.slice(1)}
                      </Tag>
                    </Descriptions.Item>
                  </Descriptions>
                </Col>
                <Col span={12}>
                  <Descriptions column={1} size="small">
                    <Descriptions.Item label="Submitted By">
                      <Text strong>{selectedRequest.submittedBy.name}</Text>
                    </Descriptions.Item>
                    <Descriptions.Item label="Email">
                      <Text>{selectedRequest.submittedBy.email}</Text>
                    </Descriptions.Item>
                    <Descriptions.Item label="Submitted At">
                      <Text>{dayjs(selectedRequest.submittedAt).format("DD/MM/YYYY HH:mm")}</Text>
                    </Descriptions.Item>
                    {selectedRequest.reviewedBy && (
                      <>
                        <Descriptions.Item label="Reviewed By">
                          <Text strong>{selectedRequest.reviewedBy.name}</Text>
                        </Descriptions.Item>
                        <Descriptions.Item label="Reviewed At">
                          <Text>{dayjs(selectedRequest.reviewedAt).format("DD/MM/YYYY HH:mm")}</Text>
                        </Descriptions.Item>
                      </>
                    )}
                  </Descriptions>
                </Col>
              </Row>
            </Card>

            {/* Reason Card */}
            <Card
              title="Reason for Cancellation"
              size="small"
            >
              <Tag
                color="orange"
                style={{ fontSize: '16px', padding: '8px 12px' }}
              >
                {selectedRequest.reason}
              </Tag>
            </Card>

            {/* Additional Notes Card */}
            {selectedRequest.additionalNotes && (
              <Card
                title="Additional Notes"
                size="small"
              >
                <Text>{selectedRequest.additionalNotes}</Text>
              </Card>
            )}

            {/* Review Notes Card */}
            {selectedRequest.reviewNotes && (
              <Card
                title="Review Notes"
                size="small"
              >
                <Text>{selectedRequest.reviewNotes}</Text>
              </Card>
            )}
          </div>
        )}
      </Drawer>
    </div>
  );
}

export default withRoleGuard(CancellationRequestsPage, ["admin"]); 