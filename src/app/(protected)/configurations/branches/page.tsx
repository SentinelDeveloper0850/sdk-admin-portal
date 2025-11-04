"use client";

import {
  Button,
  Col,
  Drawer,
  Form,
  Input,
  InputNumber,
  message,
  Popconfirm,
  Row,
  Select,
  Space,
  Spin,
  Table,
  Tabs,
  Tag,
  Tooltip
} from "antd";
import {
  Building,
  Delete,
  Edit,
  User
} from "lucide-react";
import { useEffect, useState } from "react";

import PageHeader from "@/app/components/page-header";
import { IUser } from "@/app/models/hr/user.schema";
import { useAuth } from "@/context/auth-context";
import { withRoleGuard } from "@/utils/utils/with-role-guard";
import { CopyOutlined, MailOutlined, NumberOutlined, PhoneOutlined, PlusOutlined, SaveOutlined } from "@ant-design/icons";
import { ERoles } from "../../../../types/roles.enum";

const { TabPane } = Tabs;
const { Option } = Select;
const { TextArea } = Input;

interface BranchConfig {
  _id: string;
  name: string;
  code: string;
  address: string;
  city: string;
  province: string;
  postalCode: string;
  phone: string;
  email: string;
  manager: string;
  maxStaff: number;
  latitude: number;
  longitude: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  updatedBy: string;
}

interface User extends IUser {
  _id: string;
}

const BranchConfigurationsPage = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [branches, setBranches] = useState<BranchConfig[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [form] = Form.useForm();
  const [editingBranch, setEditingBranch] = useState<BranchConfig | null>(null);
  const [originalBranchData, setOriginalBranchData] = useState<Partial<BranchConfig> | null>(null);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [editDrawerVisible, setEditDrawerVisible] = useState(false);

  const { user } = useAuth();

  const fetchBranches = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/configurations/branches');
      const data = await response.json();

      if (data.success && data.data) {
        setBranches(data.data);
      } else {
        message.error(data.error || "Failed to fetch branches");
      }
    } catch (error) {
      console.error('Error fetching branches:', error);
      message.error('An error occurred while fetching branches');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/users");
      if (!response.ok) {
        const errorData = await response.json();
        message.error(errorData.message || "Failed to fetch users");
        return;
      }

      const data = await response.json();

      const updatedUsers = data.users.map((v: any) => {
        const firstRole = v.roles[0] ?? null;
        const isAdmin = v.role === "admin";

        let additionalRoles = [...v.roles];

        if (isAdmin && firstRole === "member") {
          additionalRoles.shift();
        }

        return {
          ...v,
          roles: additionalRoles,
        };
      });

      setUsers(updatedUsers);
    } catch (err) {
      console.log(err);
      message.error("An error occurred while fetching users.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBranches();
    fetchUsers();
  }, []);

  const handleSaveBranch = async (values: any) => {
    try {
      setSaving(true);
      const response = await fetch('/api/configurations/branches', {
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
        message.success('Branch saved successfully');
        form.resetFields();
        setDrawerVisible(false);
        fetchBranches();
      } else {
        message.error(data.error || 'Failed to save branch');
      }
    } catch (error) {
      console.error('Error saving branch:', error);
      message.error('An error occurred while saving branch');
    } finally {
      setSaving(false);
    }
  };

  const handleEditBranch = (branch: BranchConfig) => {
    setEditingBranch(branch);
    // Store original data for comparison
    setOriginalBranchData({
      name: branch.name,
      code: branch.code,
      address: branch.address,
      city: branch.city,
      province: branch.province,
      postalCode: branch.postalCode,
      phone: branch.phone,
      email: branch.email,
      manager: branch.manager,
      maxStaff: branch.maxStaff,
      latitude: branch.latitude,
      longitude: branch.longitude,
      isActive: branch.isActive
    });
    form.setFieldsValue({
      name: branch.name,
      code: branch.code,
      address: branch.address,
      city: branch.city,
      province: branch.province,
      postalCode: branch.postalCode,
      phone: branch.phone,
      email: branch.email,
      manager: branch.manager,
      maxStaff: branch.maxStaff,
      latitude: branch.latitude,
      longitude: branch.longitude,
      isActive: branch.isActive
    });
    setEditDrawerVisible(true);
  };

  const handleUpdateBranch = async (values: any) => {
    if (!editingBranch || !originalBranchData) return;

    try {
      setSaving(true);

      // Compare current values with original values to find dirtied fields
      const dirtiedFields: any = {};

      Object.keys(values).forEach(key => {
        if (values[key] !== originalBranchData[key as keyof BranchConfig]) {
          dirtiedFields[key] = values[key];
        }
      });

      // Only proceed if there are actually changes
      if (Object.keys(dirtiedFields).length === 0) {
        message.info('No changes detected');
        return;
      }

      const response = await fetch(`/api/configurations/branches/${editingBranch._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...dirtiedFields,
          updatedBy: user?._id
        }),
      });

      const data = await response.json();

      if (data.success) {
        message.success('Branch updated successfully');
        setEditDrawerVisible(false);
        setEditingBranch(null);
        setOriginalBranchData(null);
        form.resetFields();
        fetchBranches();
      } else {
        message.error(data.error || 'Failed to update branch');
      }
    } catch (error) {
      console.error('Error updating branch:', error);
      message.error('An error occurred while updating branch');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteBranch = async (id: string) => {
    try {
      const response = await fetch(`/api/configurations/branches/${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        message.success('Branch deleted successfully');
        fetchBranches();
      } else {
        message.error(data.error || 'Failed to delete branch');
      }
    } catch (error) {
      console.error('Error deleting branch:', error);
      message.error('An error occurred while deleting branch');
    }
  };

  const getManagerName = (managerId: string) => {
    const manager = users.find(user => user._id === managerId);
    return manager ? `${manager.name}` : managerId;
  };

  const branchColumns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Code',
      dataIndex: 'code',
      key: 'code',
      render: (text: string) => <Tag color="blue">{text}</Tag>,
    },
    {
      title: 'Location',
      key: 'location',
      render: (_: any, record: BranchConfig) => (
        <div>
          <div>{record.address}</div>
          <div>{record.city}, {record.province}</div>
          <div className="text-xs text-gray-500">{record.postalCode}</div>
        </div>
      ),
    },
    {
      title: 'Coordinates',
      key: 'coordinates',
      render: (_: any, record: BranchConfig) => (
        <div>
          <div className="text-xs font-mono">
            {record.latitude?.toFixed(6)}, {record.longitude?.toFixed(6)}
          </div>
          <div className="text-xs text-gray-500">
            {record.latitude && record.longitude ? 'GPS Ready' : 'No GPS'}
          </div>
        </div>
      ),
    },
    {
      title: 'Contact',
      key: 'contact',
      render: (_: any, record: BranchConfig) => (
        <div>
          <div>{record.phone}</div>
          <div className="text-xs text-gray-500">{record.email}</div>
        </div>
      ),
    },
    {
      title: 'Manager',
      dataIndex: 'manager',
      key: 'manager',
      render: (managerId: string) => getManagerName(managerId),
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
      render: (_: any, record: BranchConfig) => (
        <Space>
          <Tooltip title="Edit">
            <Button
              type="text"
              icon={<Edit size={16} />}
              onClick={() => handleEditBranch(record)}
            />
          </Tooltip>
          <Popconfirm
            title="Are you sure you want to delete this branch?"
            onConfirm={() => handleDeleteBranch(record._id)}
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

  if (loading) {
    return (
      <div className="h-[80vh] flex items-center justify-center">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div style={{ padding: "20px" }}>
      <PageHeader title="Branch Configurations" subtitle="Manage branch settings and policies" actions={[<Button key="add-branch" type="primary" icon={<PlusOutlined />} onClick={() => setDrawerVisible(true)}>Add New Branch</Button>]} />

      <Table
        dataSource={branches}
        columns={branchColumns}
        rowKey="_id"
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showQuickJumper: true,
        }}
      />

      {/* Add New Branch Drawer */}
      <Drawer
        title="Add New Branch"
        open={drawerVisible}
        onClose={() => setDrawerVisible(false)}
        destroyOnClose={true}
        width="60%"
        footer={<div className="flex justify-end gap-2 border-t border-gray-200 dark:border-gray-700 pt-4">
          <Button onClick={() => setDrawerVisible(false)}>Cancel</Button>
          <Button type="primary" onClick={() => form.submit()} loading={saving} icon={<SaveOutlined size={16} />}>Save Branch</Button>
        </div>}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSaveBranch}
          className="grid grid-cols-3 gap-4"
        >
          <Form.Item
            name="name"
            label="Branch Name"
            rules={[{ required: true, message: 'Please enter branch name' }]}
          >
            <Input prefix={<Building size={16} className="mr-1" />} placeholder="eg: Daveyton" allowClear />
          </Form.Item>

          <Form.Item
            name="code"
            label="Branch Code"
            rules={[{ required: true, message: 'Please enter branch code' }]}
          >
            <Input prefix={<NumberOutlined size={16} className="mr-1" />} placeholder="eg: DTY001" allowClear />
          </Form.Item>

          <Form.Item
            name="manager"
            label="Branch Manager"
            rules={[{ required: true, message: 'Please select branch manager' }]}
          >
            <Select placeholder="Select branch manager" prefix={<User size={16} className="mr-1 dark:text-white" />} allowClear>
              {users.map((user, index) => (
                <Option key={user._id || index} value={user._id}>
                  {user.name}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="phone"
            label="Phone"
            rules={[{ required: true, message: 'Please enter phone number' }]}
          >
            <Input placeholder="+27 11 123 4567" allowClear prefix={<PhoneOutlined className="mr-1" />} suffix={<Button type="link" size="small" icon={<CopyOutlined />} title="Use Head Office Number" onClick={() => {
              form.setFieldsValue({
                phone: "+27 11 920 2002"
              });
            }} />} />
          </Form.Item>

          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: 'Please enter email' },
            ]}
          >
            <Input prefix={<MailOutlined className="mr-1" />} placeholder="branch-name" allowClear suffix={<span className="text-xs text-primary">@somdaka.co.za</span>} />
          </Form.Item>

          <Form.Item
            name="address"
            label="Address"
            className="col-span-3"
            rules={[{ required: true, message: 'Please enter address' }]}
          >
            <TextArea rows={2} placeholder="Enter full address" />
          </Form.Item>

          <Row gutter={16} className="col-span-3">
            <Col span={8}>
              <Form.Item
                name="city"
                label="City"
                rules={[{ required: true, message: 'Please enter city' }]}
              >
                <Input placeholder="e.g: Johannesburg" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="province"
                label="Province"
                rules={[{ required: true, message: 'Please select province' }]}
              >
                <Select placeholder="Select province">
                  <Option value="Gauteng">Gauteng</Option>
                  <Option value="Western Cape">Western Cape</Option>
                  <Option value="KwaZulu-Natal">KwaZulu-Natal</Option>
                  <Option value="Eastern Cape">Eastern Cape</Option>
                  <Option value="Free State">Free State</Option>
                  <Option value="Mpumalanga">Mpumalanga</Option>
                  <Option value="Limpopo">Limpopo</Option>
                  <Option value="North West">North West</Option>
                  <Option value="Northern Cape">Northern Cape</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="postalCode"
                label="Postal Code"
                rules={[{ required: true, message: 'Please enter postal code' }]}
              >
                <Input placeholder="e.g: 2000" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="latitude"
            label="Latitude"
            rules={[
              { required: true, message: 'Please enter latitude' },
              { type: 'number', min: -90, max: 90, message: 'Latitude must be between -90 and 90' }
            ]}
          >
            <InputNumber
              placeholder="e.g: -26.2041"
              className="w-full"
              step={0.000001}
              precision={6}
            />
          </Form.Item>
          <Form.Item
            name="longitude"
            label="Longitude"
            rules={[
              { required: true, message: 'Please enter longitude' },
              { type: 'number', min: -180, max: 180, message: 'Longitude must be between -180 and 180' }
            ]}
          >
            <InputNumber
              placeholder="e.g: 28.0473"
              className="w-full"
              step={0.000001}
              precision={6}
            />
          </Form.Item>
        </Form>
      </Drawer>

      {/* Edit Branch Drawer */}
      <Drawer
        title="Edit Branch"
        open={editDrawerVisible}
        onClose={() => {
          setEditDrawerVisible(false);
          setEditingBranch(null);
          setOriginalBranchData(null);
          form.resetFields();
        }}
        destroyOnClose={true}
        width="60%"
        footer={<div className="flex justify-end gap-2 border-t border-gray-200 dark:border-gray-700 pt-4">
          <Button onClick={() => {
            setEditDrawerVisible(false);
            setEditingBranch(null);
            setOriginalBranchData(null);
            form.resetFields();
          }}>Cancel</Button>
          <Button type="primary" onClick={() => form.submit()} loading={saving} icon={<SaveOutlined size={16} />}>Update Branch</Button>
        </div>}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleUpdateBranch}
          className="grid grid-cols-3 gap-4"
        >
          <Form.Item
            name="name"
            label="Branch Name"
            rules={[{ required: true, message: 'Please enter branch name' }]}
          >
            <Input prefix={<Building size={16} className="mr-1" />} placeholder="eg: Daveyton" allowClear />
          </Form.Item>

          <Form.Item
            name="code"
            label="Branch Code"
            rules={[{ required: true, message: 'Please enter branch code' }]}
          >
            <Input prefix={<NumberOutlined size={16} className="mr-1" />} placeholder="eg: DTY001" allowClear />
          </Form.Item>

          <Form.Item
            name="manager"
            label="Branch Manager"
            rules={[{ required: true, message: 'Please select branch manager' }]}
          >
            <Select placeholder="Select branch manager" prefix={<User size={16} className="mr-1 dark:text-white" />} allowClear>
              {users.map((user, index) => (
                <Option key={user._id || index} value={user._id}>
                  {user.name}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="phone"
            label="Phone"
            rules={[{ required: true, message: 'Please enter phone number' }]}
          >
            <Input placeholder="+27 11 123 4567" allowClear prefix={<PhoneOutlined className="mr-1" />} suffix={<Button type="link" size="small" icon={<CopyOutlined />} title="Use Head Office Number" onClick={() => {
              form.setFieldsValue({
                phone: "+27 11 920 2002"
              });
            }} />} />
          </Form.Item>

          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: 'Please enter email' },
            ]}
          >
            <Input prefix={<MailOutlined className="mr-1" />} placeholder="branch-name" allowClear suffix={<span className="text-xs text-primary">@somdaka.co.za</span>} />
          </Form.Item>

          <Form.Item
            name="address"
            label="Address"
            className="col-span-3"
            rules={[{ required: true, message: 'Please enter address' }]}
          >
            <TextArea rows={2} placeholder="Enter full address" />
          </Form.Item>

          <Row gutter={16} className="col-span-3">
            <Col span={8}>
              <Form.Item
                name="city"
                label="City"
                rules={[{ required: true, message: 'Please enter city' }]}
              >
                <Input placeholder="e.g: Johannesburg" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="province"
                label="Province"
                rules={[{ required: true, message: 'Please select province' }]}
              >
                <Select placeholder="Select province">
                  <Option value="Gauteng">Gauteng</Option>
                  <Option value="Western Cape">Western Cape</Option>
                  <Option value="KwaZulu-Natal">KwaZulu-Natal</Option>
                  <Option value="Eastern Cape">Eastern Cape</Option>
                  <Option value="Free State">Free State</Option>
                  <Option value="Mpumalanga">Mpumalanga</Option>
                  <Option value="Limpopo">Limpopo</Option>
                  <Option value="North West">North West</Option>
                  <Option value="Northern Cape">Northern Cape</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="postalCode"
                label="Postal Code"
                rules={[{ required: true, message: 'Please enter postal code' }]}
              >
                <Input placeholder="e.g: 2000" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="latitude"
            label="Latitude"
            rules={[
              { required: true, message: 'Please enter latitude' },
              { type: 'number', min: -90, max: 90, message: 'Latitude must be between -90 and 90' }
            ]}
          >
            <InputNumber
              placeholder="e.g: -26.2041"
              className="w-full"
              step={0.000001}
              precision={6}
            />
          </Form.Item>
          <Form.Item
            name="longitude"
            label="Longitude"
            rules={[
              { required: true, message: 'Please enter longitude' },
              { type: 'number', min: -180, max: 180, message: 'Longitude must be between -180 and 180' }
            ]}
          >
            <InputNumber
              placeholder="e.g: 28.0473"
              className="w-full"
              step={0.000001}
              precision={6}
            />
          </Form.Item>
        </Form>
      </Drawer>
    </div>
  );
};

export default withRoleGuard(BranchConfigurationsPage, [ERoles.Admin]);