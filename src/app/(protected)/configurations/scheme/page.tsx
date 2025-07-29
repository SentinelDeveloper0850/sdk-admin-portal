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
  Building2,
  Delete,
  Edit,
  FileText,
  Save
} from "lucide-react";
import { useEffect, useState } from "react";

import PageHeader from "@/app/components/page-header";
import { useAuth } from "@/context/auth-context";
import { withRoleGuard } from "@/utils/utils/with-role-guard";
import { ERoles } from "../../../../../types/roles.enum";

const { TabPane } = Tabs;
const { Option } = Select;
const { TextArea } = Input;

interface SchemeConfig {
  _id: string;
  name: string;
  code: string;
  type: string;
  description: string;
  maxMembers: number;
  contributionAmount: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  updatedBy: string;
}

interface SchemePolicy {
  _id: string;
  schemeId: string;
  name: string;
  type: string;
  value: string | number | boolean;
  description: string;
  isActive: boolean;
}

const SchemeConfigurationsPage = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [schemes, setSchemes] = useState<SchemeConfig[]>([]);
  const [policies, setPolicies] = useState<SchemePolicy[]>([]);
  const [form] = Form.useForm();
  const [policyForm] = Form.useForm();
  const [modalVisible, setModalVisible] = useState(false);
  const [editingScheme, setEditingScheme] = useState<SchemeConfig | null>(null);
  const [policyModalVisible, setPolicyModalVisible] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState<SchemePolicy | null>(null);

  const { user } = useAuth();

  const fetchSchemes = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/configurations/schemes');
      const data = await response.json();

      if (data.success && data.data) {
        setSchemes(data.data);
      } else {
        message.error(data.error || "Failed to fetch schemes");
      }
    } catch (error) {
      console.error('Error fetching schemes:', error);
      message.error('An error occurred while fetching schemes');
    } finally {
      setLoading(false);
    }
  };

  const fetchPolicies = async () => {
    try {
      const response = await fetch('/api/configurations/scheme-policies');
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
    fetchSchemes();
    fetchPolicies();
  }, []);

  const handleSaveScheme = async (values: any) => {
    try {
      setSaving(true);
      const response = await fetch('/api/configurations/schemes', {
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
        message.success('Scheme saved successfully');
        form.resetFields();
        fetchSchemes();
      } else {
        message.error(data.error || 'Failed to save scheme');
      }
    } catch (error) {
      console.error('Error saving scheme:', error);
      message.error('An error occurred while saving scheme');
    } finally {
      setSaving(false);
    }
  };

  const handleEditScheme = (scheme: SchemeConfig) => {
    setEditingScheme(scheme);
    form.setFieldsValue({
      name: scheme.name,
      code: scheme.code,
      type: scheme.type,
      description: scheme.description,
      maxMembers: scheme.maxMembers,
      contributionAmount: scheme.contributionAmount,
      isActive: scheme.isActive
    });
    setModalVisible(true);
  };

  const handleUpdateScheme = async (values: any) => {
    if (!editingScheme) return;

    try {
      setSaving(true);
      const response = await fetch(`/api/configurations/schemes/${editingScheme._id}`, {
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
        message.success('Scheme updated successfully');
        setModalVisible(false);
        setEditingScheme(null);
        form.resetFields();
        fetchSchemes();
      } else {
        message.error(data.error || 'Failed to update scheme');
      }
    } catch (error) {
      console.error('Error updating scheme:', error);
      message.error('An error occurred while updating scheme');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteScheme = async (id: string) => {
    try {
      const response = await fetch(`/api/configurations/schemes/${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        message.success('Scheme deleted successfully');
        fetchSchemes();
      } else {
        message.error(data.error || 'Failed to delete scheme');
      }
    } catch (error) {
      console.error('Error deleting scheme:', error);
      message.error('An error occurred while deleting scheme');
    }
  };

  const handleSavePolicy = async (values: any) => {
    try {
      setSaving(true);
      const response = await fetch('/api/configurations/scheme-policies', {
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

  const handleEditPolicy = (policy: SchemePolicy) => {
    setEditingPolicy(policy);
    policyForm.setFieldsValue({
      schemeId: policy.schemeId,
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
      const response = await fetch(`/api/configurations/scheme-policies/${editingPolicy._id}`, {
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
      const response = await fetch(`/api/configurations/scheme-policies/${id}`, {
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

  const schemeColumns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Code',
      dataIndex: 'code',
      key: 'code',
      render: (text: string) => <code className="bg-gray-100 px-2 py-1 rounded">{text}</code>,
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => (
        <Tag color={getSchemeTypeColor(type)}>{type}</Tag>
      ),
    },
    {
      title: 'Max Members',
      dataIndex: 'maxMembers',
      key: 'maxMembers',
    },
    {
      title: 'Contribution Amount',
      dataIndex: 'contributionAmount',
      key: 'contributionAmount',
      render: (amount: number) => `R${amount.toFixed(2)}`,
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
      render: (_: any, record: SchemeConfig) => (
        <Space>
          <Tooltip title="Edit">
            <Button
              type="text"
              icon={<Edit size={16} />}
              onClick={() => handleEditScheme(record)}
            />
          </Tooltip>
          <Popconfirm
            title="Are you sure you want to delete this scheme?"
            onConfirm={() => handleDeleteScheme(record._id)}
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
      title: 'Scheme',
      dataIndex: 'schemeId',
      key: 'schemeId',
      render: (schemeId: string) => {
        const scheme = schemes.find(s => s._id === schemeId);
        return scheme ? scheme.name : schemeId;
      },
    },
    {
      title: 'Policy Name',
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
      render: (_: any, record: SchemePolicy) => (
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

  const getSchemeTypeColor = (type: string) => {
    const colors: { [key: string]: string } = {
      'health': 'blue',
      'life': 'green',
      'disability': 'orange',
      'funeral': 'purple',
      'default': 'gray'
    };
    return colors[type.toLowerCase()] || colors.default;
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
      <PageHeader title="Scheme Configurations" subtitle="Manage scheme settings and policies" />

      <Tabs defaultActiveKey="1" className="mt-6">
        <TabPane
          tab={
            <span className="flex items-center gap-2 px-2">
              <Building2 size={16} />
              Schemes
            </span>
          }
          key="1"
        >
          <Row gutter={[16, 16]}>
            <Col span={12}>
              <Card title="Add New Scheme" className="h-fit">
                <Form
                  form={form}
                  layout="vertical"
                  onFinish={handleSaveScheme}
                >
                  <Form.Item
                    name="name"
                    label="Scheme Name"
                    rules={[{ required: true, message: 'Please enter scheme name' }]}
                  >
                    <Input placeholder="e.g., Health Insurance Scheme" />
                  </Form.Item>

                  <Form.Item
                    name="code"
                    label="Scheme Code"
                    rules={[{ required: true, message: 'Please enter scheme code' }]}
                  >
                    <Input placeholder="e.g., HIS001" />
                  </Form.Item>

                  <Form.Item
                    name="type"
                    label="Scheme Type"
                    rules={[{ required: true, message: 'Please select scheme type' }]}
                  >
                    <Select placeholder="Select scheme type">
                      <Option value="health">Health</Option>
                      <Option value="life">Life</Option>
                      <Option value="disability">Disability</Option>
                      <Option value="funeral">Funeral</Option>
                    </Select>
                  </Form.Item>

                  <Form.Item
                    name="maxMembers"
                    label="Maximum Members"
                    rules={[{ required: true, message: 'Please enter maximum members' }]}
                  >
                    <InputNumber min={1} placeholder="e.g., 1000" className="w-full" />
                  </Form.Item>

                  <Form.Item
                    name="contributionAmount"
                    label="Contribution Amount (R)"
                    rules={[{ required: true, message: 'Please enter contribution amount' }]}
                  >
                    <InputNumber min={0} step={0.01} placeholder="e.g., 150.00" className="w-full" />
                  </Form.Item>

                  <Form.Item
                    name="description"
                    label="Description"
                    rules={[{ required: true, message: 'Please enter description' }]}
                  >
                    <TextArea rows={3} placeholder="Enter scheme description" />
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
                      Save Scheme
                    </Button>
                  </Form.Item>
                </Form>
              </Card>
            </Col>

            <Col span={12}>
              <Card title="Scheme Statistics">
                <Row gutter={[16, 16]}>
                  <Col span={12}>
                    <Card size="small">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">
                          {schemes.length}
                        </div>
                        <div className="text-sm text-gray-600">Total Schemes</div>
                      </div>
                    </Card>
                  </Col>
                  <Col span={12}>
                    <Card size="small">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">
                          {schemes.filter(s => s.isActive).length}
                        </div>
                        <div className="text-sm text-gray-600">Active Schemes</div>
                      </div>
                    </Card>
                  </Col>
                </Row>
              </Card>
            </Col>
          </Row>

          <Card title="All Schemes" className="mt-6">
            <Table
              dataSource={schemes}
              columns={schemeColumns}
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
              Policies
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
                    name="schemeId"
                    label="Scheme"
                    rules={[{ required: true, message: 'Please select scheme' }]}
                  >
                    <Select placeholder="Select scheme">
                      {schemes.map(scheme => (
                        <Option key={scheme._id} value={scheme._id}>
                          {scheme.name}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>

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
      </Tabs>

      {/* Scheme Edit Modal */}
      <Modal
        title="Edit Scheme"
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          setEditingScheme(null);
          form.resetFields();
        }}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleUpdateScheme}
        >
          <Form.Item
            name="name"
            label="Scheme Name"
            rules={[{ required: true, message: 'Please enter scheme name' }]}
          >
            <Input placeholder="e.g., Health Insurance Scheme" />
          </Form.Item>

          <Form.Item
            name="code"
            label="Scheme Code"
            rules={[{ required: true, message: 'Please enter scheme code' }]}
          >
            <Input placeholder="e.g., HIS001" />
          </Form.Item>

          <Form.Item
            name="type"
            label="Scheme Type"
            rules={[{ required: true, message: 'Please select scheme type' }]}
          >
            <Select placeholder="Select scheme type">
              <Option value="health">Health</Option>
              <Option value="life">Life</Option>
              <Option value="disability">Disability</Option>
              <Option value="funeral">Funeral</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="maxMembers"
            label="Maximum Members"
            rules={[{ required: true, message: 'Please enter maximum members' }]}
          >
            <InputNumber min={1} placeholder="e.g., 1000" className="w-full" />
          </Form.Item>

          <Form.Item
            name="contributionAmount"
            label="Contribution Amount (R)"
            rules={[{ required: true, message: 'Please enter contribution amount' }]}
          >
            <InputNumber min={0} step={0.01} placeholder="e.g., 150.00" className="w-full" />
          </Form.Item>

          <Form.Item
            name="description"
            label="Description"
            rules={[{ required: true, message: 'Please enter description' }]}
          >
            <TextArea rows={3} placeholder="Enter scheme description" />
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
                Update Scheme
              </Button>
              <Button
                onClick={() => {
                  setModalVisible(false);
                  setEditingScheme(null);
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
            name="schemeId"
            label="Scheme"
            rules={[{ required: true, message: 'Please select scheme' }]}
          >
            <Select placeholder="Select scheme">
              {schemes.map(scheme => (
                <Option key={scheme._id} value={scheme._id}>
                  {scheme.name}
                </Option>
              ))}
            </Select>
          </Form.Item>

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

export default withRoleGuard(SchemeConfigurationsPage, [ERoles.Admin]);