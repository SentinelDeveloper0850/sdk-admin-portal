"use client";

import { useEffect, useState } from "react";

import { MoreOutlined, PlusOutlined, ReloadOutlined } from "@ant-design/icons";
import {
  Button,
  Card,
  Collapse,
  Drawer,
  Dropdown,
  Flex,
  Form,
  Input,
  Spin,
  Statistic,
  Table,
  message,
} from "antd";
import Search from "antd/es/input/Search";
import dayjs from "dayjs";

import { formatToMoneyWithCurrency } from "@/utils/formatters";

import PageHeader from "@/app/components/page-header";
import { ISocietyMember } from "@/app/models/scheme/scheme-society-member.schema";
import { ISchemeSociety } from "@/app/models/scheme/scheme-society.schema";

export default function SchemeSocietiesPage() {
  const [societies, setSocieties] = useState<ISchemeSociety[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | boolean>(false);
  const [stats, setStats] = useState<{ count: number }>({ count: 0 });
  const [createDrawerOpen, setCreateDrawerOpen] = useState<boolean>(false);
  const [editDrawerOpen, setEditDrawerOpen] = useState<boolean>(false);
  const [societyMembersDrawerOpen, setSocietyMembersDrawerOpen] =
    useState<boolean>(false);

  const [viewDrawerForm] = Form.useForm();
  const [editDrawerForm] = Form.useForm();
  const [createDrawerForm] = Form.useForm();

  const [selectedSociety, setSelectedSociety] = useState<ISchemeSociety | null>(
    null
  );
  const [selectedSocietyMembers, setSelectedSocietyMembers] = useState<
    ISocietyMember[]
  >([]);
  const [viewDrawerOpen, setViewDrawerOpen] = useState<boolean>(false);

  const [createSocietyMemberDrawerOpen, setCreateSocietyMemberDrawerOpen] =
    useState<boolean>(false);
  const [createSocietyMemberDrawerForm] = Form.useForm();

  const fetchSocieties = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/societies/scheme");
      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.message || "Failed to fetch scheme societies");
        return;
      }

      const data = await response.json();
      setSocieties(data.societies);
      setStats({ count: data.count });
    } catch (err) {
      setError("An error occurred while fetching scheme societies.");
    } finally {
      setLoading(false);
    }
  };

  const searchSocieties = async (value: string) => {
    try {
      const response = await fetch("/api/societies/scheme/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ searchText: value }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.message || "Failed to search scheme societies");
        return;
      }

      const data = await response.json();
      setSocieties(data.societies);
      setStats({ count: data.count });
    } catch (err) {
      setError("An error occurred while searching scheme societies.");
    }
  };

  const handleCreateSociety = async () => {
    try {
      const values = createDrawerForm.getFieldsValue();
      const response = await fetch("/api/societies/scheme", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.message || "Failed to create society");
        return;
      }
      const data = await response.json();
      setSocieties([...societies, data]);
      setCreateDrawerOpen(false);
      createDrawerForm.resetFields();
      resetForm();
      sweetAlert({
        title: "Society created successfully",
        icon: "success",
        timer: 2000,
      });
    } catch (err) {
      message.error("Failed to create society");
      sweetAlert({
        title: "Failed to create society",
        icon: "error",
        timer: 2000,
      });
    }
  };

  const resetForm = () => {
    createDrawerForm.resetFields();
    setCreateDrawerOpen(false);
    setError(false);
  };

  const updateSocietyDetails = async (values: any) => {
    const response = await fetch(`/api/societies/scheme`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: selectedSociety?._id, ...values }),
    });
    if (!response.ok) {
      const errorData = await response.json();
      setError(errorData.message || "Failed to update society");
    }
    const data = await response.json();
    setSocieties(
      societies.map((society) => (society._id === data._id ? data : society))
    );
    setError(false);
    setEditDrawerOpen(false);
    sweetAlert({
      title: "Society updated successfully",
      icon: "success",
      timer: 2000,
    });
    fetchSocieties();
  };

  const deleteSociety = async (id: string) => {
    const response = await fetch(`/api/societies/scheme`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (!response.ok) {
      const errorData = await response.json();
      setError(errorData.message || "Failed to delete society");
    }
    const data = await response.json();
    setSocieties(societies.filter((society) => society._id !== id));
    setError(false);
    setEditDrawerOpen(false);
    setViewDrawerOpen(false);
    sweetAlert({
      title: "Society deleted successfully",
      icon: "success",
      timer: 2000,
    });
  };

  const handleDelete = (id: string) => {
    sweetAlert({
      title: "Are you sure?",
      text: "This will delete the society from the system.",
      icon: "warning",
      buttons: ["Cancel", "Yes, delete it!"],
      dangerMode: true,
    }).then((result) => {
      if (result === "Yes, delete it!") {
        deleteSociety(id);
      }
    });
  };

  const handleManageMembers = async (record: ISchemeSociety) => {
    try {
      const response = await fetch(
        `/api/societies/scheme/${record._id}/members`,
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        }
      );
      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.message || "Failed to fetch society members");
        return;
      }
      const data = await response.json();
      setSelectedSocietyMembers(data.members);
      setSelectedSociety(record);
      setSocietyMembersDrawerOpen(true);
    } catch (err) {
      setError("An error occurred while fetching society members");
    }
  };

  useEffect(() => {
    fetchSocieties();
  }, []);

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

  const formItemStyles = "w-full";

  const handleCreateSocietyMember = async (values: any) => {
    const response = await fetch(`/api/societies/scheme/members`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ societyId: selectedSociety?._id, ...values }),
    });
    if (!response.ok) {
      const errorData = await response.json();
      setError(errorData.message || "Failed to create society member");
    }
    const data = await response.json();
    setSelectedSocietyMembers([...selectedSocietyMembers, data.member]);
    setSocietyMembersDrawerOpen(false);
    createSocietyMemberDrawerForm.resetFields();
    sweetAlert({
      title: "Member created successfully",
      icon: "success",
      timer: 2000,
    });
    fetchSocieties();
  };

  return (
    <div style={{ padding: "20px" }}>
      <PageHeader
        title="Scheme Societies"
        actions={[
          <Button
            type="primary"
            className="text-black"
            onClick={() => setCreateDrawerOpen(true)}
            icon={<PlusOutlined />}
          >
            Create Society
          </Button>,
          <Button onClick={() => fetchSocieties()} icon={<ReloadOutlined />}>
            Refresh
          </Button>,
        ]}
      ></PageHeader>

      {error && (
        <div style={{ color: "red", marginBottom: "20px" }}>{error}</div>
      )}

      <Form
        layout="vertical"
        style={{ maxWidth: "400px", marginBottom: "20px" }}
      >
        <Form.Item label="Search Societies">
          <Search
            allowClear
            placeholder="Search by Society name, chairman, treasurer, secretary, etc..."
            onSearch={(value) => {
              if (value.length > 0) {
                searchSocieties(value);
              } else {
                fetchSocieties();
              }
            }}
          />
        </Form.Item>
      </Form>

      <Table
        rowKey="_id"
        dataSource={societies}
        columns={[
          { title: "ASSIT ID", dataIndex: "assitID" },
          {
            title: "Society Name",
            dataIndex: "name",
          },
          {
            title: "Members",
            dataIndex: "numberOfMembers",
          },
          { title: "Plan", dataIndex: "planName" },
          {
            title: "Created At",
            dataIndex: "createdAt",
            render: (value: string) => (
              <span>{value ? dayjs(value).format("DD MMM YYYY") : "--"}</span>
            ),
          },
          {
            title: "Last Updated",
            dataIndex: "updatedAt",
            render: (value: string) => (
              <span>{value ? dayjs(value).format("DD MMM YYYY") : "--"}</span>
            ),
          },
          {
            title: "Actions",
            dataIndex: "actions",
            render: (value: string, record: ISchemeSociety) => (
              <Dropdown
                menu={{
                  items: [
                    {
                      key: "view",
                      label: "View",
                      onClick: () => {
                        setSelectedSociety(record);
                        setViewDrawerOpen(true);
                        viewDrawerForm.setFieldsValue(record);
                      },
                    },
                    {
                      key: "edit",
                      label: "Edit",
                      onClick: () => {
                        setSelectedSociety(record);
                        setEditDrawerOpen(true);
                        editDrawerForm.setFieldsValue(record);
                      },
                    },
                    {
                      key: "delete",
                      label: "Delete",
                      onClick: () => handleDelete(record._id as string),
                      danger: true,
                    },
                    {
                      key: "manage-members",
                      label: "Manage Members",
                      onClick: () => handleManageMembers(record),
                    },
                  ],
                }}
              >
                <Button icon={<MoreOutlined />} />
              </Dropdown>
            ),
          },
        ]}
      />

      <Drawer
        title="Create Society"
        open={createDrawerOpen}
        width="40%"
        onClose={() => setCreateDrawerOpen(false)}
        destroyOnClose
        footer={
          <div className="flex justify-end gap-2">
            <Button onClick={() => setCreateDrawerOpen(false)}>Cancel</Button>
            <Button
              type="primary"
              className="text-black"
              onClick={() => createDrawerForm.submit()}
            >
              Create Society
            </Button>
          </div>
        }
      >
        <Form
          layout="vertical"
          form={createDrawerForm}
          onFinish={handleCreateSociety}
        >
          <Flex gap={16}>
            <Form.Item
              className={formItemStyles}
              label="Society Name"
              name="name"
              rules={[{ required: true, message: "Please enter society name" }]}
            >
              <Input />
            </Form.Item>

            <Form.Item
              className={formItemStyles}
              label="ID on ASSIT"
              name="assitID"
            >
              <Input />
            </Form.Item>
            <Form.Item
              className={formItemStyles}
              label="Plan"
              name="planName"
              rules={[{ required: true, message: "Please enter plan" }]}
            >
              <Input />
            </Form.Item>
          </Flex>
          <Collapse accordion>
            <Collapse.Panel header="Chairman" key="1">
              <Flex gap={16}>
                <Form.Item
                  className={formItemStyles}
                  label="Name"
                  name="chairman"
                >
                  <Input />
                </Form.Item>
                <Form.Item
                  className={formItemStyles}
                  label="Email"
                  name="chairmanEmail"
                >
                  <Input />
                </Form.Item>
                <Form.Item
                  className={formItemStyles}
                  label="Phone"
                  name="chairmanPhone"
                >
                  <Input />
                </Form.Item>
              </Flex>
            </Collapse.Panel>
            <Collapse.Panel header="Secretary" key="2">
              <Flex gap={16}>
                <Form.Item
                  className={formItemStyles}
                  label="Name"
                  name="secretary"
                >
                  <Input />
                </Form.Item>
                <Form.Item
                  className={formItemStyles}
                  label="Email"
                  name="secretaryEmail"
                >
                  <Input />
                </Form.Item>
                <Form.Item
                  className={formItemStyles}
                  label="Phone"
                  name="secretaryPhone"
                >
                  <Input />
                </Form.Item>
              </Flex>
            </Collapse.Panel>
            <Collapse.Panel header="Treasurer" key="3">
              <Flex gap={16}>
                <Form.Item
                  className={formItemStyles}
                  label="Name"
                  name="treasurer"
                >
                  <Input />
                </Form.Item>
                <Form.Item
                  className={formItemStyles}
                  label="Email"
                  name="treasurerEmail"
                >
                  <Input />
                </Form.Item>
                <Form.Item
                  className={formItemStyles}
                  label="Phone"
                  name="treasurerPhone"
                >
                  <Input />
                </Form.Item>
              </Flex>
            </Collapse.Panel>
          </Collapse>
        </Form>
      </Drawer>

      <Drawer
        title="Edit Society"
        open={editDrawerOpen}
        width="40%"
        onClose={() => setEditDrawerOpen(false)}
        destroyOnClose
        footer={
          <div className="flex justify-end gap-2">
            <Button onClick={() => setEditDrawerOpen(false)}>Cancel</Button>
            <Button
              type="primary"
              className="text-black"
              onClick={() => editDrawerForm.submit()}
            >
              Save Changes
            </Button>
          </div>
        }
      >
        <Form
          layout="vertical"
          form={editDrawerForm}
          onFinish={updateSocietyDetails}
        >
          <Flex gap={16}>
            <Form.Item
              className={formItemStyles}
              label="Society Name"
              name="name"
              rules={[{ required: true, message: "Please enter society name" }]}
            >
              <Input />
            </Form.Item>

            <Form.Item
              className={formItemStyles}
              label="ID on ASSIT"
              name="assitID"
            >
              <Input />
            </Form.Item>
            <Form.Item
              className={formItemStyles}
              label="Plan"
              name="planName"
              rules={[{ required: true, message: "Please enter plan" }]}
            >
              <Input />
            </Form.Item>
          </Flex>
          <Collapse accordion>
            <Collapse.Panel header="Chairman" key="1">
              <Flex gap={16}>
                <Form.Item
                  className={formItemStyles}
                  label="Name"
                  name="chairman"
                >
                  <Input />
                </Form.Item>
                <Form.Item
                  className={formItemStyles}
                  label="Email"
                  name="chairmanEmail"
                >
                  <Input />
                </Form.Item>
                <Form.Item
                  className={formItemStyles}
                  label="Phone"
                  name="chairmanPhone"
                >
                  <Input />
                </Form.Item>
              </Flex>
            </Collapse.Panel>
            <Collapse.Panel header="Secretary" key="2">
              <Flex gap={16}>
                <Form.Item
                  className={formItemStyles}
                  label="Name"
                  name="secretary"
                >
                  <Input />
                </Form.Item>
                <Form.Item
                  className={formItemStyles}
                  label="Email"
                  name="secretaryEmail"
                >
                  <Input />
                </Form.Item>
                <Form.Item
                  className={formItemStyles}
                  label="Phone"
                  name="secretaryPhone"
                >
                  <Input />
                </Form.Item>
              </Flex>
            </Collapse.Panel>
            <Collapse.Panel header="Treasurer" key="3">
              <Flex gap={16}>
                <Form.Item
                  className={formItemStyles}
                  label="Name"
                  name="treasurer"
                >
                  <Input />
                </Form.Item>
                <Form.Item
                  className={formItemStyles}
                  label="Email"
                  name="treasurerEmail"
                >
                  <Input />
                </Form.Item>
                <Form.Item
                  className={formItemStyles}
                  label="Phone"
                  name="treasurerPhone"
                >
                  <Input />
                </Form.Item>
              </Flex>
            </Collapse.Panel>
          </Collapse>
        </Form>
      </Drawer>

      <Drawer
        title="Manage Society Members"
        open={societyMembersDrawerOpen}
        width="80%"
        onClose={() => setSocietyMembersDrawerOpen(false)}
        destroyOnClose
        extra={
          <Button
            type="primary"
            className="text-black"
            onClick={() => setCreateSocietyMemberDrawerOpen(true)}
          >
            Add Member
          </Button>
        }
      >
        <div className="grid grid-cols-4 gap-4">
          <Card>
            <Statistic
              title="ASSIT ID"
              value={selectedSociety?.assitID}
              className="text-sm"
            />
          </Card>
          <Card>
            <Statistic
              title="Society Name"
              value={selectedSociety?.name}
              className="text-sm"
            />
          </Card>
          <Card>
            <Statistic
              title="Default Plan"
              value={selectedSociety?.planName}
              className="text-sm"
            />
          </Card>
          <Card>
            <Statistic
              title="Number of Members"
              value={selectedSociety?.numberOfMembers}
              className="text-sm"
            />
          </Card>
        </div>
        <Table
          className="mt-4"
          size="small"
          dataSource={selectedSocietyMembers}
          columns={[
            {
              title: "Member Name",
              dataIndex: "fullNames",
              render: (value: string, record: ISocietyMember) =>
                `${record.initials} ${record.lastName}`,
            },
            { title: "ID Number", dataIndex: "idNumber" },
            {
              title: "Premium",
              dataIndex: "premium",
              render: (value: number) => `${formatToMoneyWithCurrency(value)}`,
            },
            { title: "Cell Number", dataIndex: "cellNumber" },
            { title: "Email Address", dataIndex: "emailAddress" },
            { title: "Physical Address", dataIndex: "address" },
          ]}
        />
        <Drawer
          title="Add Society Member"
          open={createSocietyMemberDrawerOpen}
          width="30%"
          onClose={() => setCreateSocietyMemberDrawerOpen(false)}
          destroyOnClose
          footer={
            <div className="flex justify-end gap-2">
              <Button onClick={() => setCreateSocietyMemberDrawerOpen(false)}>
                Cancel
              </Button>
              <Button
                type="primary"
                className="text-black"
                onClick={() => createSocietyMemberDrawerForm.submit()}
              >
                Add Member
              </Button>
            </div>
          }
        >
          <Form
            layout="vertical"
            form={createSocietyMemberDrawerForm}
            onFinish={handleCreateSocietyMember}
            className="space-y-2"
          >
            <Card title="Personal Details" size="small">
              <Flex gap={16}>
                <Form.Item
                  className="w-1/6"
                  label="Initials"
                  name="initials"
                  rules={[
                    { required: true, message: "Please enter member initials" },
                  ]}
                >
                  <Input />
                </Form.Item>
                <Form.Item
                  className="w-full"
                  label="First Names"
                  name="firstNames"
                  rules={[
                    {
                      required: true,
                      message: "Please enter member first names",
                    },
                  ]}
                >
                  <Input />
                </Form.Item>
              </Flex>
              <Flex gap={16}>
                <Form.Item
                  className="w-full"
                  label="Surname"
                  name="lastName"
                  rules={[
                    { required: true, message: "Please enter member surname" },
                  ]}
                >
                  <Input />
                </Form.Item>
                <Form.Item
                  className="w-full"
                  label="ID Number"
                  name="idNumber"
                  rules={[
                    {
                      required: true,
                      message: "Please enter member ID number",
                    },
                  ]}
                >
                  <Input />
                </Form.Item>
              </Flex>
            </Card>

            <Card title="Contact Details" size="small">
              <Flex gap={16}>
                <Form.Item
                  className="w-full"
                  label="Cell Number"
                  name="cellNumber"
                  rules={[
                    {
                      required: true,
                      message: "Please enter member cell number",
                    },
                  ]}
                >
                  <Input prefix="+27" maxLength={9} />
                </Form.Item>
                <Form.Item
                  className="w-full"
                  label="Email Address"
                  name="emailAddress"
                >
                  <Input />
                </Form.Item>
              </Flex>
              <Form.Item label="Physical Address" name="address">
                <Input />
              </Form.Item>
            </Card>

            <Card title="Policy Details" size="small">
              <Flex gap={16}>
                <Form.Item
                  label="Plan"
                  name="plan"
                  rules={[
                    { required: true, message: "Please enter member plan" },
                  ]}
                >
                  <Input />
                </Form.Item>
                <Form.Item
                  label="Premium"
                  name="premium"
                  rules={[
                    { required: true, message: "Please enter member premium" },
                  ]}
                >
                  <Input prefix="R" />
                </Form.Item>
              </Flex>
            </Card>
          </Form>
        </Drawer>
      </Drawer>
    </div>
  );
}
