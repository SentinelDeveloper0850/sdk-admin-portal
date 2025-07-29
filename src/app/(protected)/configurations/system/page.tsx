"use client";

import {
  Button,
  Card,
  Col,
  Form,
  Input,
  InputNumber,
  message,
  Modal,
  Popconfirm,
  Row,
  Select,
  Space,
  Spin,
  Switch,
  Table,
  Tabs,
  Tag,
  Tooltip
} from "antd";
import {
  Bell,
  Delete,
  Edit,
  FileText,
  Save,
  Settings,
  Shield
} from "lucide-react";
import { useEffect, useState } from "react";

import PageHeader from "@/app/components/page-header";
import { useAuth } from "@/context/auth-context";
import { withRoleGuard } from "@/utils/utils/with-role-guard";
import { ERoles } from "../../../../../types/roles.enum";

const { TabPane } = Tabs;
const { Option } = Select;
const { TextArea } = Input;

interface ConfigurationItem {
  _id: string;
  key: string;
  value: string | number | boolean;
  category: string;
  description: string;
  isActive: boolean;
  updatedAt: string;
  updatedBy: string;
}

interface PolicyConfig {
  _id: string;
  name: string;
  type: string;
  value: string | number | boolean;
  description: string;
  isActive: boolean;
}

const ConfigurationsPage = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [configurations, setConfigurations] = useState<ConfigurationItem[]>([]);
  const [policies, setPolicies] = useState<PolicyConfig[]>([]);
  const [form] = Form.useForm();
  const [policyForm] = Form.useForm();
  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<ConfigurationItem | null>(null);
  const [policyModalVisible, setPolicyModalVisible] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState<PolicyConfig | null>(null);

  const { user } = useAuth();

  const fetchConfigurations = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/configurations');
      const data = await response.json();

      if (data.success && data.data) {
        setConfigurations(data.data);
      } else {
        message.error(data.error || "Failed to fetch configurations");
      }
    } catch (error) {
      console.error('Error fetching configurations:', error);
      message.error('An error occurred while fetching configurations');
    } finally {
      setLoading(false);
    }
  };

  const fetchPolicies = async () => {
    try {
      const response = await fetch('/api/configurations/policies');
      const data = await response.json();

      if (data.success && data.data) {
        setPolicies(data.data);
      } else {
        message.error(data.error || "Failed to fetch policies");
      }
    } catch (error) {
      console.error('Error fetching policies:', error);
      message.error('An error occurred while fetching policies');
    }
  };

  useEffect(() => {
    fetchConfigurations();
    fetchPolicies();
  }, []);

  const handleSaveConfiguration = async (values: any) => {
    try {
      setSaving(true);
      const response = await fetch('/api/configurations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...values,
          updatedBy: user?._id
        }),
      });

      const data = await response.json();

      if (data.success) {
        message.success('Configuration saved successfully');
        form.resetFields();
        fetchConfigurations();
      } else {
        message.error(data.error || 'Failed to save configuration');
      }
    } catch (error) {
      console.error('Error saving configuration:', error);
      message.error('An error occurred while saving configuration');
    } finally {
      setSaving(false);
    }
  };

  const handleEditConfiguration = (item: ConfigurationItem) => {
    setEditingItem(item);
    form.setFieldsValue({
      key: item.key,
      value: item.value,
      category: item.category,
      description: item.description,
      isActive: item.isActive
    });
    setModalVisible(true);
  };

  const handleUpdateConfiguration = async (values: any) => {
    if (!editingItem) return;

    try {
      setSaving(true);
      const response = await fetch(`/api/configurations/${editingItem._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...values,
          updatedBy: user?._id
        }),
      });

      const data = await response.json();

      if (data.success) {
        message.success('Configuration updated successfully');
        setModalVisible(false);
        setEditingItem(null);
        form.resetFields();
        fetchConfigurations();
      } else {
        message.error(data.error || 'Failed to update configuration');
      }
    } catch (error) {
      console.error('Error updating configuration:', error);
      message.error('An error occurred while updating configuration');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteConfiguration = async (id: string) => {
    try {
      const response = await fetch(`/api/configurations/${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        message.success('Configuration deleted successfully');
        fetchConfigurations();
      } else {
        message.error(data.error || 'Failed to delete configuration');
      }
    } catch (error) {
      console.error('Error deleting configuration:', error);
      message.error('An error occurred while deleting configuration');
    }
  };

  const handleSavePolicy = async (values: any) => {
    try {
      setSaving(true);
      const response = await fetch('/api/configurations/policies', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...values,
          createdBy: user?._id
        }),
      });

      const data = await response.json();

      if (data.success) {
        message.success('Policy saved successfully');
        policyForm.resetFields();
        fetchPolicies();
      } else {
        message.error(data.error || 'Failed to save policy');
      }
    } catch (error) {
      console.error('Error saving policy:', error);
      message.error('An error occurred while saving policy');
    } finally {
      setSaving(false);
    }
  };

  const handleEditPolicy = (policy: PolicyConfig) => {
    setEditingPolicy(policy);
    policyForm.setFieldsValue({
      name: policy.name,
      type: policy.type,
      value: policy.value,
      description: policy.description,
      isActive: policy.isActive
    });
    setPolicyModalVisible(true);
  };

  const handleUpdatePolicy = async (values: any) => {
    if (!editingPolicy) return;

    try {
      setSaving(true);
      const response = await fetch(`/api/configurations/policies/${editingPolicy._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...values,
          updatedBy: user?._id
        }),
      });

      const data = await response.json();

      if (data.success) {
        message.success('Policy updated successfully');
        setPolicyModalVisible(false);
        setEditingPolicy(null);
        policyForm.resetFields();
        fetchPolicies();
      } else {
        message.error(data.error || 'Failed to update policy');
      }
    } catch (error) {
      console.error('Error updating policy:', error);
      message.error('An error occurred while updating policy');
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePolicy = async (id: string) => {
    try {
      const response = await fetch(`/api/configurations/policies/${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        message.success('Policy deleted successfully');
        fetchPolicies();
      } else {
        message.error(data.error || 'Failed to delete policy');
      }
    } catch (error) {
      console.error('Error deleting policy:', error);
      message.error('An error occurred while deleting policy');
    }
  };

  const configurationColumns = [
    {
      title: 'Key',
      dataIndex: 'key',
      key: 'key',
      render: (text: string) => <code className="bg-gray-100 px-2 py-1 rounded">{text}</code>,
    },
    {
      title: 'Value',
      dataIndex: 'value',
      key: 'value',
      render: (value: any) => {
        if (typeof value === 'boolean') {
          return <Switch checked={value} disabled />;
        }
        return <span>{String(value)}</span>;
      },
    },
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
      render: (category: string) => (
        <Tag color={getCategoryColor(category)}>{category}</Tag>
      ),
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: 'Status',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (isActive: boolean) => (
        <Tag color={isActive ? 'green' : 'red'}>
          {isActive ? 'Active' : 'Inactive'}
        </Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: ConfigurationItem) => (
        <Space>
          <Tooltip title="Edit">
            <Button
              type="text"
              icon={<Edit size={16} />}
              onClick={() => handleEditConfiguration(record)}
            />
          </Tooltip>
          <Popconfirm
            title="Are you sure you want to delete this configuration?"
            onConfirm={() => handleDeleteConfiguration(record._id)}
            okText="Yes"
            cancelText="No"
          >
            <Tooltip title="Delete">
              <Button
                type="text"
                danger
                icon={<Delete size={16} />}
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const policyColumns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => (
        <Tag color={getPolicyTypeColor(type)}>{type}</Tag>
      ),
    },
    {
      title: 'Value',
      dataIndex: 'value',
      key: 'value',
      render: (value: any) => {
        if (typeof value === 'boolean') {
          return <Switch checked={value} disabled />;
        }
        return <span>{String(value)}</span>;
      },
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: 'Status',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (isActive: boolean) => (
        <Tag color={isActive ? 'green' : 'red'}>
          {isActive ? 'Active' : 'Inactive'}
        </Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: PolicyConfig) => (
        <Space>
          <Tooltip title="Edit">
            <Button
              type="text"
              icon={<Edit size={16} />}
              onClick={() => handleEditPolicy(record)}
            />
          </Tooltip>
          <Popconfirm
            title="Are you sure you want to delete this policy?"
            onConfirm={() => handleDeletePolicy(record._id)}
            okText="Yes"
            cancelText="No"
          >
            <Tooltip title="Delete">
              <Button
                type="text"
                danger
                icon={<Delete size={16} />}
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      'system': 'blue',
      'security': 'red',
      'email': 'green',
      'notification': 'orange',
      'payment': 'purple',
      'policy': 'cyan',
      'default': 'gray'
    };
    return colors[category.toLowerCase()] || colors.default;
  };

  const getPolicyTypeColor = (type: string) => {
    const colors: { [key: string]: string } = {
      'string': 'blue',
      'number': 'green',
      'boolean': 'orange',
      'json': 'purple',
      'default': 'gray'
    };
    return colors[type.toLowerCase()] || colors.default;
  };

  if (loading) {
    return (
      <div className="h-[80vh] flex items-center justify-center">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div style={{ padding: "20px" }}>
      <PageHeader title="System Configurations" subtitle="Manage system settings and configurations" />

      <Tabs defaultActiveKey="1" className="mt-6">
        <TabPane
          tab={
            <span className="flex items-center gap-2 px-2">
              <Settings size={16} />
              General
            </span>
          }
          key="1"
        >
          <Row gutter={[16, 16]}>
            <Col span={12}>
              <Card title="Add New Configuration" className="h-fit">
                <Form
                  form={form}
                  layout="vertical"
                  onFinish={handleSaveConfiguration}
                >
                  <Form.Item
                    name="key"
                    label="Configuration Key"
                    rules={[{ required: true, message: 'Please enter configuration key' }]}
                  >
                    <Input placeholder="e.g., MAX_LOGIN_ATTEMPTS" />
                  </Form.Item>

                  <Form.Item
                    name="value"
                    label="Value"
                    rules={[{ required: true, message: 'Please enter value' }]}
                  >
                    <Input placeholder="Enter value" />
                  </Form.Item>

                  <Form.Item
                    name="category"
                    label="Category"
                    rules={[{ required: true, message: 'Please select category' }]}
                  >
                    <Select placeholder="Select category">
                      <Option value="system">System</Option>
                      <Option value="security">Security</Option>
                      <Option value="email">Email</Option>
                      <Option value="notification">Notification</Option>
                      <Option value="payment">Payment</Option>
                      <Option value="policy">Policy</Option>
                    </Select>
                  </Form.Item>

                  <Form.Item
                    name="description"
                    label="Description"
                    rules={[{ required: true, message: 'Please enter description' }]}
                  >
                    <TextArea rows={3} placeholder="Enter description" />
                  </Form.Item>

                  <Form.Item
                    name="isActive"
                    label="Active"
                    valuePropName="checked"
                    initialValue={true}
                  >
                    <Switch />
                  </Form.Item>

                  <Form.Item>
                    <Button
                      type="primary"
                      htmlType="submit"
                      loading={saving}
                      icon={<Save size={16} />}
                    >
                      Save Configuration
                    </Button>
                  </Form.Item>
                </Form>
              </Card>
            </Col>

            <Col span={12}>
              <Card title="Configuration Statistics">
                <Row gutter={[16, 16]}>
                  <Col span={12}>
                    <Card size="small">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">
                          {configurations.length}
                        </div>
                        <div className="text-sm text-gray-600">Total Configurations</div>
                      </div>
                    </Card>
                  </Col>
                  <Col span={12}>
                    <Card size="small">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">
                          {configurations.filter(c => c.isActive).length}
                        </div>
                        <div className="text-sm text-gray-600">Active Configurations</div>
                      </div>
                    </Card>
                  </Col>
                </Row>
              </Card>
            </Col>
          </Row>

          <Card title="All Configurations" className="mt-6">
            <Table
              dataSource={configurations}
              columns={configurationColumns}
              rowKey="_id"
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showQuickJumper: true,
              }}
            />
          </Card>
        </TabPane>

        <TabPane
          tab={
            <span className="flex items-center gap-2 px-2">
              <FileText size={16} />
              Policy
            </span>
          }
          key="2"
        >
          <Row gutter={[16, 16]}>
            <Col span={12}>
              <Card title="Add New Policy" className="h-fit">
                <Form
                  form={policyForm}
                  layout="vertical"
                  onFinish={handleSavePolicy}
                >
                  <Form.Item
                    name="name"
                    label="Policy Name"
                    rules={[{ required: true, message: 'Please enter policy name' }]}
                  >
                    <Input placeholder="e.g., Max Claims Per Month" />
                  </Form.Item>

                  <Form.Item
                    name="type"
                    label="Type"
                    rules={[{ required: true, message: 'Please select type' }]}
                  >
                    <Select placeholder="Select type">
                      <Option value="string">String</Option>
                      <Option value="number">Number</Option>
                      <Option value="boolean">Boolean</Option>
                      <Option value="json">JSON</Option>
                    </Select>
                  </Form.Item>

                  <Form.Item
                    name="value"
                    label="Value"
                    rules={[{ required: true, message: 'Please enter value' }]}
                  >
                    <Input placeholder="Enter value" />
                  </Form.Item>

                  <Form.Item
                    name="description"
                    label="Description"
                    rules={[{ required: true, message: 'Please enter description' }]}
                  >
                    <TextArea rows={3} placeholder="Enter description" />
                  </Form.Item>

                  <Form.Item
                    name="isActive"
                    label="Active"
                    valuePropName="checked"
                    initialValue={true}
                  >
                    <Switch />
                  </Form.Item>

                  <Form.Item>
                    <Button
                      type="primary"
                      htmlType="submit"
                      loading={saving}
                      icon={<Save size={16} />}
                    >
                      Save Policy
                    </Button>
                  </Form.Item>
                </Form>
              </Card>
            </Col>

            <Col span={12}>
              <Card title="Policy Statistics">
                <Row gutter={[16, 16]}>
                  <Col span={12}>
                    <Card size="small">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">
                          {policies.length}
                        </div>
                        <div className="text-sm text-gray-600">Total Policies</div>
                      </div>
                    </Card>
                  </Col>
                  <Col span={12}>
                    <Card size="small">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">
                          {policies.filter(p => p.isActive).length}
                        </div>
                        <div className="text-sm text-gray-600">Active Policies</div>
                      </div>
                    </Card>
                  </Col>
                </Row>
              </Card>
            </Col>
          </Row>

          <Card title="All Policies" className="mt-6">
            <Table
              dataSource={policies}
              columns={policyColumns}
              rowKey="_id"
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showQuickJumper: true,
              }}
            />
          </Card>
        </TabPane>

        <TabPane
          tab={
            <span className="flex items-center gap-2 px-2">
              <Shield size={16} />
              Security
            </span>
          }
          key="3"
        >
          <Card title="Security Configuration">
            <Row gutter={[16, 16]}>
              <Col span={8}>
                <Card size="small" title="Authentication">
                  <Space direction="vertical" className="w-full">
                    <div className="flex justify-between items-center">
                      <span>Two-Factor Authentication</span>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Session Timeout (minutes)</span>
                      <InputNumber min={5} max={480} defaultValue={30} />
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Max Login Attempts</span>
                      <InputNumber min={3} max={10} defaultValue={5} />
                    </div>
                  </Space>
                </Card>
              </Col>

              <Col span={8}>
                <Card size="small" title="Password Policy">
                  <Space direction="vertical" className="w-full">
                    <div className="flex justify-between items-center">
                      <span>Minimum Length</span>
                      <InputNumber min={6} max={20} defaultValue={8} />
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Require Uppercase</span>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Require Numbers</span>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Require Special Characters</span>
                      <Switch />
                    </div>
                  </Space>
                </Card>
              </Col>

              <Col span={8}>
                <Card size="small" title="Access Control">
                  <Space direction="vertical" className="w-full">
                    <div className="flex justify-between items-center">
                      <span>IP Whitelist</span>
                      <Switch />
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Audit Logging</span>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Rate Limiting</span>
                      <Switch defaultChecked />
                    </div>
                  </Space>
                </Card>
              </Col>
            </Row>
          </Card>
        </TabPane>

        <TabPane
          tab={
            <span className="flex items-center gap-2 px-2">
              <Bell size={16} />
              Notifications
            </span>
          }
          key="4"
        >
          <Card title="Notification Configuration">
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Card size="small" title="Email Notifications">
                  <Space direction="vertical" className="w-full">
                    <div className="flex justify-between items-center">
                      <span>New Signup Requests</span>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Policy Approvals</span>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Claim Submissions</span>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex justify-between items-center">
                      <span>System Alerts</span>
                      <Switch defaultChecked />
                    </div>
                  </Space>
                </Card>
              </Col>

              <Col span={12}>
                <Card size="small" title="SMS Notifications">
                  <Space direction="vertical" className="w-full">
                    <div className="flex justify-between items-center">
                      <span>Policy Status Updates</span>
                      <Switch />
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Payment Confirmations</span>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Claim Status Updates</span>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Emergency Alerts</span>
                      <Switch defaultChecked />
                    </div>
                  </Space>
                </Card>
              </Col>
            </Row>
          </Card>
        </TabPane>
      </Tabs>

      {/* Configuration Edit Modal */}
      <Modal
        title="Edit Configuration"
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          setEditingItem(null);
          form.resetFields();
        }}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleUpdateConfiguration}
        >
          <Form.Item
            name="key"
            label="Configuration Key"
            rules={[{ required: true, message: 'Please enter configuration key' }]}
          >
            <Input placeholder="e.g., MAX_LOGIN_ATTEMPTS" />
          </Form.Item>

          <Form.Item
            name="value"
            label="Value"
            rules={[{ required: true, message: 'Please enter value' }]}
          >
            <Input placeholder="Enter value" />
          </Form.Item>

          <Form.Item
            name="category"
            label="Category"
            rules={[{ required: true, message: 'Please select category' }]}
          >
            <Select placeholder="Select category">
              <Option value="system">System</Option>
              <Option value="security">Security</Option>
              <Option value="email">Email</Option>
              <Option value="notification">Notification</Option>
              <Option value="payment">Payment</Option>
              <Option value="policy">Policy</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="description"
            label="Description"
            rules={[{ required: true, message: 'Please enter description' }]}
          >
            <TextArea rows={3} placeholder="Enter description" />
          </Form.Item>

          <Form.Item
            name="isActive"
            label="Active"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button
                type="primary"
                htmlType="submit"
                loading={saving}
                icon={<Save size={16} />}
              >
                Update Configuration
              </Button>
              <Button
                onClick={() => {
                  setModalVisible(false);
                  setEditingItem(null);
                  form.resetFields();
                }}
              >
                Cancel
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Policy Edit Modal */}
      <Modal
        title="Edit Policy"
        open={policyModalVisible}
        onCancel={() => {
          setPolicyModalVisible(false);
          setEditingPolicy(null);
          policyForm.resetFields();
        }}
        footer={null}
        width={600}
      >
        <Form
          form={policyForm}
          layout="vertical"
          onFinish={handleUpdatePolicy}
        >
          <Form.Item
            name="name"
            label="Policy Name"
            rules={[{ required: true, message: 'Please enter policy name' }]}
          >
            <Input placeholder="e.g., Max Claims Per Month" />
          </Form.Item>

          <Form.Item
            name="type"
            label="Type"
            rules={[{ required: true, message: 'Please select type' }]}
          >
            <Select placeholder="Select type">
              <Option value="string">String</Option>
              <Option value="number">Number</Option>
              <Option value="boolean">Boolean</Option>
              <Option value="json">JSON</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="value"
            label="Value"
            rules={[{ required: true, message: 'Please enter value' }]}
          >
            <Input placeholder="Enter value" />
          </Form.Item>

          <Form.Item
            name="description"
            label="Description"
            rules={[{ required: true, message: 'Please enter description' }]}
          >
            <TextArea rows={3} placeholder="Enter description" />
          </Form.Item>

          <Form.Item
            name="isActive"
            label="Active"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button
                type="primary"
                htmlType="submit"
                loading={saving}
                icon={<Save size={16} />}
              >
                Update Policy
              </Button>
              <Button
                onClick={() => {
                  setPolicyModalVisible(false);
                  setEditingPolicy(null);
                  policyForm.resetFields();
                }}
              >
                Cancel
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default withRoleGuard(ConfigurationsPage, [ERoles.Admin]);