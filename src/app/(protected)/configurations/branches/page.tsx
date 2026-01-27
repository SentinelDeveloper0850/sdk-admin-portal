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
import { useEffect, useMemo, useState } from "react";
import sweetAlert from "sweetalert";

import PageHeader from "@/app/components/page-header";
import { IUser } from "@/app/models/hr/user.schema";
import { useAuth } from "@/context/auth-context";
import { withRoleGuard } from "@/utils/utils/with-role-guard";
import { CopyOutlined, MailOutlined, NumberOutlined, PhoneOutlined, PlusOutlined, ReloadOutlined, SaveOutlined } from "@ant-design/icons";
import { ERoles } from "../../../../types/roles.enum";

const { TabPane } = Tabs;
const { Option } = Select;
const { TextArea } = Input;

interface RegionLite {
  _id: string;
  id: string;     // business id
  name: string;
  code: string;
}

interface BranchConfig {
  _id: string;
  id?: string;        // business id (optional)
  regionId?: string;  // business FK
  regionDoc?: RegionLite | null; // if API populates regionDoc
  name: string;
  code: string;
  address: string;
  city: string;
  province: string;
  postalCode: string;
  phone: string;
  email: string;
  manager: string;
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
  const [regions, setRegions] = useState<RegionLite[]>([]);
  const [regionFilter, setRegionFilter] = useState<string | null>(null);

  const { user } = useAuth();

  const filteredBranches = useMemo(() => {
    if (!regionFilter) return branches;
    return branches.filter(b => b.regionId === regionFilter);
  }, [branches, regionFilter]);

  const fetchRegions = async () => {
    try {
      const res = await fetch("/api/configurations/regions");
      const data = await res.json();
      if (data?.success && data?.data) setRegions(data.data);
    } catch (e) {
      console.error("Error fetching regions:", e);
    }
  };

  const fetchBranches = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/configurations/branches');
      const data = await response.json();

      if (data.success && data.data) {
        setBranches(data.data);
      } else {
        sweetAlert({
          title: "Error",
          text: data.error || "Failed to fetch branches",
          icon: "error",
        });
      }
    } catch (error) {
      console.error('Error fetching branches:', error);
      sweetAlert({
        title: "Error",
        text: "An error occurred while fetching branches.",
        icon: "error",
      });
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
        sweetAlert({
          title: "Error",
          text: errorData.message || "Failed to fetch users",
          icon: "error",
        });
        return;
      }

      const data = await response.json();

      const updatedUsers = data.map((v: any) => {
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
      sweetAlert({
        title: "Error",
        text: "An error occurred while fetching users.",
        icon: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBranches();
    fetchUsers();
    fetchRegions();
  }, []);

  const handleRefresh = () => {
    fetchBranches();
    fetchUsers();
    fetchRegions();
  };

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
        sweetAlert({
          title: "Success",
          text: "Branch saved successfully",
          icon: "success",
        });
        form.resetFields();
        setDrawerVisible(false);
        fetchBranches();
      } else {
        sweetAlert({
          title: "Error",
          text: data.error || "Failed to save branch",
          icon: "error",
        });
      }
    } catch (error) {
      console.error('Error saving branch:', error);
      sweetAlert({
        title: "Error",
        text: "An error occurred while saving branch",
        icon: "error",
      });
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
      regionId: branch.regionId,
      address: branch.address,
      city: branch.city,
      province: branch.province,
      postalCode: branch.postalCode,
      phone: branch.phone,
      email: branch.email,
      manager: branch.manager,
      latitude: branch.latitude,
      longitude: branch.longitude,
      isActive: branch.isActive
    });
    form.setFieldsValue({
      name: branch.name,
      code: branch.code,
      regionId: branch.regionId,
      address: branch.address,
      city: branch.city,
      province: branch.province,
      postalCode: branch.postalCode,
      phone: branch.phone,
      email: branch.email,
      manager: branch.manager,
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
        sweetAlert({
          title: "Success",
          text: "Branch updated successfully",
          icon: "success",
        });
        setEditDrawerVisible(false);
        setEditingBranch(null);
        setOriginalBranchData(null);
        form.resetFields();
        fetchBranches();
      } else {
        sweetAlert({
          title: "Error",
          text: data.error || "Failed to update branch",
          icon: "error",
        });
      }
    } catch (error) {
      console.error('Error updating branch:', error);
      sweetAlert({
        title: "Error",
        text: "An error occurred while updating branch",
        icon: "error",
      });
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
        sweetAlert({
          title: "Success",
          text: "Branch deleted successfully",
          icon: "success",
        });
        fetchBranches();
      } else {
        sweetAlert({
          title: "Error",
          text: data.error || "Failed to delete branch",
          icon: "error",
        });
      }
    } catch (error) {
      console.error('Error deleting branch:', error);
      sweetAlert({
        title: "Error",
        text: "An error occurred while deleting branch",
        icon: "error",
      });
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
      title: "Region",
      key: "region",
      render: (_: any, record: BranchConfig) => {
        const label =
          record.regionDoc?.name ||
          regions.find(r => r.id === record.regionId)?.name ||
          record.regionId ||
          "--";

        return <Tag>{label}</Tag>;
      },
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
      <PageHeader title="Branch Configurations" subtitle="Manage branch settings and policies" actions={[
        <Button key="refresh" type="default" icon={<ReloadOutlined />} onClick={handleRefresh}>Refresh</Button>,
        <Button key="add-branch" type="primary" className="text-black" icon={<PlusOutlined />} onClick={() => setDrawerVisible(true)}>Add New Branch</Button>,
      ]} />

      <div className="flex gap-2 mb-3">
        <Select
          allowClear
          placeholder="Filter by region"
          style={{ width: 240 }}
          value={regionFilter ?? undefined}
          onChange={(v) => setRegionFilter(v ?? null)}
        >
          {regions.map((r) => (
            <Option key={r.id} value={r.id}>
              {r.name}
            </Option>
          ))}
        </Select>
      </div>

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
            name="regionId"
            label="Region"
            rules={[{ required: true, message: "Please select a region" }]}
          >
            <Select placeholder="Select region" allowClear>
              {regions.map((r) => (
                <Option key={r.id} value={r.id}>
                  {r.name} ({r.code})
                </Option>
              ))}
            </Select>
          </Form.Item>


          <Form.Item
            name="manager"
            label="Branch Manager"
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
          >
            <Input prefix={<MailOutlined className="mr-1" />} placeholder="branch-name" allowClear suffix={<span className="text-xs text-primary">@somdaka.co.za</span>} />
          </Form.Item>

          <Form.Item
            name="address"
            label="Address"
            className="col-span-3"
          >
            <TextArea rows={2} placeholder="Enter full address" />
          </Form.Item>

          <Row gutter={16} className="col-span-3">
            <Col span={8}>
              <Form.Item
                name="city"
                label="City"
              >
                <Input placeholder="e.g: Johannesburg" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="province"
                label="Province"
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
              >
                <Input placeholder="e.g: 2000" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="latitude"
            label="Latitude"
            rules={[
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
          >
            <Input prefix={<Building size={16} className="mr-1" />} placeholder="eg: Daveyton" allowClear />
          </Form.Item>

          <Form.Item
            name="code"
            label="Branch Code"
          >
            <Input prefix={<NumberOutlined size={16} className="mr-1" />} placeholder="eg: DTY001" allowClear />
          </Form.Item>

          <Form.Item
            name="regionId"
            label="Region"
            rules={[{ required: true, message: "Please select a region" }]}
          >
            <Select placeholder="Select region" allowClear>
              {regions.map((r) => (
                <Option key={r.id} value={r.id}>
                  {r.name} ({r.code})
                </Option>
              ))}
            </Select>
          </Form.Item>


          <Form.Item
            name="manager"
            label="Branch Manager"
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
          >
            <Input prefix={<MailOutlined className="mr-1" />} placeholder="branch-name" allowClear suffix={<span className="text-xs text-primary">@somdaka.co.za</span>} />
          </Form.Item>

          <Form.Item
            name="address"
            label="Address"
            className="col-span-3"
          >
            <TextArea rows={2} placeholder="Enter full address" />
          </Form.Item>

          <Row gutter={16} className="col-span-3">
            <Col span={8}>
              <Form.Item
                name="city"
                label="City"
              >
                <Input placeholder="e.g: Johannesburg" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="province"
                label="Province"
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
              >
                <Input placeholder="e.g: 2000" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="latitude"
            label="Latitude"
            rules={[
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