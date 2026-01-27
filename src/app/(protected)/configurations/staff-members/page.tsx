"use client";

import ContentLoading from '@/app/components/content-loading';
import PageHeader from '@/app/components/page-header';
import { IUser } from '@/app/models/hr/user.schema';
import { IStaffMember } from '@/app/models/staff-member.schema';
import { EllipsisOutlined, LinkOutlined, MailOutlined, PlusOutlined } from '@ant-design/icons';
import { Avatar, Button, Descriptions, Divider, Drawer, Dropdown, Flex, Form, Input, message, Select, Table, Tag } from 'antd';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { useEffect, useMemo, useState } from 'react';
import sweetAlert from 'sweetalert';


dayjs.extend(relativeTime);

const StaffMemberPage = () => {
  const [addStaffMemberDrawerOpen, setAddStaffMemberDrawerOpen] = useState(false);
  const [linkDrawerOpen, setLinkDrawerOpen] = useState(false);

  const [staffMembers, setStaffMembers] = useState<any[]>([]);
  const [fetchingStaffMembers, setFetchingStaffMembers] = useState(true);
  const [selectedStaffMember, setSelectedStaffMember] = useState<IStaffMember | null>(null);

  const [users, setUsers] = useState<Partial<IUser>[]>([]);
  const [fetchingUsers, setFetchingUsers] = useState(true);

  const [addStaffMemberDrawerForm] = Form.useForm<IStaffMember>();
  const [linkDrawerForm] = Form.useForm<{ userId: string }>();

  const handleAddStaffMember = async (values: IStaffMember) => {
    const initials = values.firstNames.split(" ").map(name => name[0]).join("");

    const response = await fetch('/api/staff', {
      method: 'POST',
      body: JSON.stringify({ ...values, initials }),
    });
    const data = await response.json();
    await message.success("Staff member added successfully");
    addStaffMemberDrawerForm.resetFields();
    fetchStaffMembers();
    setAddStaffMemberDrawerOpen(false);
  };

  const handleCancelAddStaffMember = () => {
    setAddStaffMemberDrawerOpen(false);
    addStaffMemberDrawerForm.resetFields();
  };

  useEffect(() => {
    fetchStaffMembers();
    addStaffMemberDrawerForm.setFieldsValue({
      address: {
        country: "South Africa",
      },
    });
  }, []);

  const loading = useMemo(() => fetchingStaffMembers && fetchingUsers, [fetchingStaffMembers, fetchingUsers]);

  const fetchStaffMembers = async () => {
    setFetchingStaffMembers(true);
    const response = await fetch('/api/staff');
    const data = await response.json();
    setStaffMembers(data.staffMembers || []);
    setFetchingStaffMembers(false);
  };

  const fetchUsers = async () => {
    setFetchingUsers(true);
    const response = await fetch('/api/users?slim=true');
    const data = await response.json();
    setUsers(data || []);
    setFetchingUsers(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleLinkUser = async (values: { userId: string }) => {
    const response = await fetch(`/api/staff/link-user`, {
      method: 'POST',
      body: JSON.stringify({
        staffMemberId: selectedStaffMember?._id,
        userId: values.userId,
      }),
    });
    const data = await response.json();
    if (data.success) {
      sweetAlert({
        title: data.message,
        icon: "success",
        timer: 2000,
      });
      fetchStaffMembers();
      setLinkDrawerOpen(false);
      linkDrawerForm.resetFields();
      setSelectedStaffMember(null);
    } else {
      sweetAlert({
        title: data.message,
        icon: "error",
        timer: 2000,
      });
    }
  };

  return (
    <div className="flex flex-1 overflow-hidden">
      <div className="flex-1 space-y-6 p-6">
        <PageHeader
          title="Staff Members"
          subtitle="Create, update, and delete staff members from your system"
          actions={[
            <Button key="add-staff-member" type="dashed" onClick={() => setAddStaffMemberDrawerOpen(true)}>
              <PlusOutlined className="w-4 h-4" /> Add Staff Member
            </Button>
          ]}
        />

        {loading ? <ContentLoading message="Loading staff members..." description="Please wait while we load the staff members..." /> : <Table
          rowKey="_id"
          bordered size="small"
          dataSource={staffMembers}
          rowClassName="cursor-pointer hover:bg-gray-100"
          columns={[
            {
              title: "Full Names",
              dataIndex: "fullNames",
              key: "fullNames",
              sorter: (a: any, b: any) => `${a.firstNames} ${a.lastName}`.localeCompare(`${b.firstNames} ${b.lastName}`),
              render: (_, member) => {
                return (
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-4">
                      <Avatar className="bg-primary text-gray-800 font-bold">{member.initials}</Avatar>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-sm">{member.firstNames} {member.lastName}</span>
                        {/* <div className="flex items-center gap-1 text-xs">
                          <PhoneOutlined className="text-green-500" />
                          <span>{member.contact.phone ? `+27${member.contact.phone}` : "--"}</span>
                        </div> */}
                        <div className="flex items-center gap-1 text-xs">
                          <MailOutlined className="text-blue-500" />
                          <span>{member.contact.email ? member.contact.email : "--"}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              }
            },
            {
              title: "Address",
              dataIndex: "address",
              key: "address",
              render: (value: any) => (
                <div className="flex flex-col gap-0">
                  <span>{value?.addressLine1} {value?.addressLine2}</span>
                  <span>{value?.suburb}, {value?.town} {value?.province}, {value?.postalCode}</span>
                </div>
              ),
            },
            // {
            //   title: "Contact",
            //   dataIndex: "contact",
            //   key: "contact",
            //   render: (value: any) => (
            //     <div className="space-y-0.5">
            //       <div className="flex items-center gap-1 text-xs">
            //         <PhoneOutlined className="text-green-500" />
            //         <span>{value?.phone ? `+27${value?.phone}` : "--"}</span>
            //       </div>
            //       <div className="flex items-center gap-1 text-xs">
            //         <MailOutlined className="text-blue-500" />
            //         <span>{value?.email ? value?.email : "--"}</span>
            //       </div>
            //     </div>
            //   ),
            // },
            {
              title: "Employment",
              dataIndex: "employment",
              key: "employment",
              render: (value: any) => (
                <div className="flex flex-col gap-1.5">
                  <Tag className="block w-fit">{value?.position} - {value?.branch}</Tag>
                </div>
              ),
            },
            {
              title: "Created",
              dataIndex: "createdAt",
              key: "createdAt",
              render: (value: string) => (
                <span>{value ? dayjs(value).fromNow() : "-"}</span>
              ),
              sorter: (a: any, b: any) =>
                new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
            },
            {
              title: "Actions",
              dataIndex: "actions",
              key: "actions",
              render: (_, member) => (
                <Dropdown menu={{
                  items: [
                    {
                      label: "Link User",
                      key: member._id,
                      icon: <LinkOutlined />
                    }
                  ], onClick: (e) => {
                    message.info('Click on menu item.');
                    setSelectedStaffMember(member);
                    setLinkDrawerOpen(true);
                  }
                }}><Button icon={<EllipsisOutlined />} /></Dropdown>
              ),
            },
          ]}
        />}

        <Drawer
          width="35%"
          title="Add Staff Member"
          open={addStaffMemberDrawerOpen}
          onClose={handleCancelAddStaffMember}
          destroyOnClose
          footer={
            <div className="flex justify-end gap-2">
              <Button onClick={handleCancelAddStaffMember}>Cancel</Button>
              <Button type="primary" className="text-black" onClick={() => addStaffMemberDrawerForm.submit()}>Add Staff Member</Button>
            </div>
          }
        >
          <Form layout="vertical" form={addStaffMemberDrawerForm} onFinish={handleAddStaffMember}>
            <h4 className="text-sm font-bold mb-2">Personal Details</h4>
            <Flex gap={16}>
              <Form.Item label="First Names" name="firstNames" className="w-full" rules={[{ required: true, message: "Please enter first names" }]}>
                <Input placeholder="Enter first names" />
              </Form.Item>
              <Form.Item label="Surname" name="lastName" className="w-full" rules={[{ required: true, message: "Please enter surname" }]}>
                <Input placeholder="Enter surname" />
              </Form.Item>
            </Flex>

            <Flex gap={16}>
              <Form.Item label="ID Number" name="idNumber" rules={[{ required: true, message: "Please enter ID number", len: 13 }]} className="w-1/2">
                <Input placeholder="Enter ID number" />
              </Form.Item>
              <Form.Item label="Passport Number" name="passportNumber" className="w-1/2">
                <Input placeholder="Enter passport number" />
              </Form.Item>
            </Flex>

            <Divider className="my-4 mt-0" />

            <h4 className="text-sm font-bold mb-2">Residential Address</h4>
            <Form.Item label="Address Line 1" name="address.addressLine1" rules={[{ required: true, message: "Please enter street address" }]}>
              <Input placeholder="Enter street address" />
            </Form.Item>
            <Form.Item label="Address Line 2" name="address.addressLine2">
              <Input placeholder="Enter section, extension, etc." />
            </Form.Item>
            <Flex gap={16}>
              <Form.Item label="Suburb" name="address.suburb" className="w-1/2" rules={[{ required: true, message: "Please enter suburb" }]}>
                <Input placeholder="Enter suburb" />
              </Form.Item>
              <Form.Item label="Town" name="address.town" className="w-1/2" rules={[{ required: true, message: "Please enter town" }]}>
                <Input placeholder="Enter town" />
              </Form.Item>
            </Flex>
            <Flex gap={16}>
              <Form.Item label="Province" name="address.province" className="w-1/2" rules={[{ required: true, message: "Please select province" }]}>
                <Select placeholder="Select province">
                  <Select.Option value="Gauteng">Gauteng</Select.Option>
                  <Select.Option value="Western Cape">Western Cape</Select.Option>
                  <Select.Option value="KwaZulu-Natal">KwaZulu-Natal</Select.Option>
                  <Select.Option value="Eastern Cape">Eastern Cape</Select.Option>
                  <Select.Option value="Free State">Free State</Select.Option>
                  <Select.Option value="Mpumalanga">Mpumalanga</Select.Option>
                  <Select.Option value="Limpopo">Limpopo</Select.Option>
                </Select>
              </Form.Item>
              <Form.Item label="Country" name="address.country" className="w-1/2">
                <Select placeholder="Select country" defaultValue="South Africa">
                  <Select.Option value="South Africa">South Africa</Select.Option>
                </Select>
              </Form.Item>
            </Flex>

            <Flex gap={16}>
              <Form.Item label="Postal Code" name="address.postalCode" className="w-1/2">
                <Input placeholder="Enter postal code" />
              </Form.Item>
              <div className="w-1/2" />
            </Flex>

            <Divider className="my-4 mt-0" />

            <h4 className="text-sm font-bold mb-2">Contact Details</h4>
            <Flex gap={16}>
              <Form.Item label="Phone Number" name="contact.phone" className="w-full" rules={[{ required: true, message: "Please enter phone number" }]}>
                <Input prefix="+27" maxLength={9} placeholder="Enter phone number" />
              </Form.Item>
              <Form.Item label="Email Address" name="contact.email" className="w-full" rules={[{ required: true, message: "Please enter email address" }]}>
                <Input type="email" placeholder="Enter email address" />
              </Form.Item>
            </Flex>

            <Divider className="my-4 mt-0" />

            <h4 className="text-sm font-bold mb-2">Employment Details</h4>
            <Flex gap={16}>
              <Form.Item label="Business Unit" name="employment.businessUnit" className="w-full" rules={[{ required: true, message: "Please select business unit" }]}>
                <Select placeholder="Select business unit">
                  <Select.Option value="Somdaka Funeral Services">Somdaka Funeral Services</Select.Option>
                </Select>
              </Form.Item>
              <Form.Item label="Department" name="employment.department" className="w-full" rules={[{ required: true, message: "Please select department" }]}>
                <Select placeholder="Select department">
                  <Select.Option value="Funeral Operations">Funeral Operations</Select.Option>
                  <Select.Option value="Fleet & Logistics">Fleet & Logistics</Select.Option>
                  <Select.Option value="Sales & Client Relations">Sales & Client Relations</Select.Option>
                  <Select.Option value="HR & Finance">HR & Finance</Select.Option>
                  <Select.Option value="Claims & Compliance">Claims & Compliance</Select.Option>
                  <Select.Option value="Marketing">Marketing</Select.Option>
                  <Select.Option value="IT">IT</Select.Option>
                  <Select.Option value="Legal">Legal</Select.Option>
                  <Select.Option value="Other">Other</Select.Option>
                </Select>
              </Form.Item>
            </Flex>

            <Flex gap={16}>
              <Form.Item label="Branch" name="employment.branch" className="w-full" rules={[{ required: true, message: "Please select branch" }]}>
                <Select placeholder="Select branch">
                  <Select.Option value="Mangweni">Mangweni</Select.Option>
                  <Select.Option value="Sangweni">Sangweni</Select.Option>
                  <Select.Option value="Ndulwini">Ndulwini</Select.Option>
                  <Select.Option value="Simunye">Simunye</Select.Option>
                  <Select.Option value="Daveyton">Daveyton</Select.Option>
                  <Select.Option value="Kaalfontein">Kaalfontein</Select.Option>
                  <Select.Option value="Other">Other</Select.Option>
                </Select>
              </Form.Item>

              <Form.Item label="Position" name="employment.position" className="w-full" rules={[{ required: true, message: "Please enter position" }]}>
                <Input placeholder="Enter position" />
              </Form.Item>
            </Flex>

            <Divider className="my-4 mt-0" />

            <h4 className="text-sm font-bold mb-2">Additional Details</h4>
            <Form.Item label="Notes" name="employment.notes">
              <Input.TextArea rows={4} placeholder="Enter any additional notes" />
            </Form.Item>
          </Form>
        </Drawer>

        <Drawer
          width="30%"
          title="Link User to Staff Member"
          open={linkDrawerOpen}
          destroyOnClose
          footer={
            <div className="flex justify-end gap-2">
              <Button onClick={() => {
                setLinkDrawerOpen(false);
                linkDrawerForm.resetFields();
                setSelectedStaffMember(null);
              }}>Cancel</Button>
              <Button type="primary" className="text-black" onClick={() => linkDrawerForm.submit()}>Link User</Button>
            </div>
          }
        >
          <Form layout="vertical" form={linkDrawerForm} onFinish={handleLinkUser}>
            <p className="text-sm font-medium mb-4 underline">Staff Member Details</p>
            <Descriptions size="small" items={[
              {
                key: "fullNames",
                label: "Name",
                children: `${selectedStaffMember?.firstNames} ${selectedStaffMember?.lastName}`,
                span: 3,
              },
              {
                key: "email",
                label: "Email",
                children: selectedStaffMember?.contact?.email || "--",
                span: 3,
              },
              {
                key: "phone",
                label: "Phone",
                children: selectedStaffMember?.contact?.phone || "--",
                span: 3,
              },
            ]} className="w-full mb-4" />

            <Divider />

            <Form.Item label="User" name="userId" className="w-full" rules={[{ required: true, message: "Please select user" }]}>
              <Select placeholder="Select user">
                {users?.map((user: Partial<IUser>) => (
                  <Select.Option key={user._id as string} value={user._id as string}>{user.name as string}</Select.Option>
                ))}
              </Select>
            </Form.Item>
          </Form>
        </Drawer>
      </div>
    </div>
  )
}

export default StaffMemberPage