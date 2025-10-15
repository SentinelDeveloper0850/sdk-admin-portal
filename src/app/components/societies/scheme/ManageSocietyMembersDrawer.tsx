"use client";

import { ISocietyMember } from "@/app/models/scheme/scheme-society-member.schema";
import { ISchemeSociety } from "@/app/models/scheme/scheme-society.schema";
import { formatToMoneyWithCurrency } from "@/utils/formatters";
import { Button, Card, Drawer, Flex, Form, Input, Spin, Statistic, Table } from "antd";
import { useEffect, useState } from "react";

interface ManageSocietyMembersDrawerProps {
  open: boolean;
  society: ISchemeSociety | null;
  onClose: () => void;
}

export default function ManageSocietyMembersDrawer({ open, society, onClose }: ManageSocietyMembersDrawerProps) {
  const [members, setMembers] = useState<ISocietyMember[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [createMemberOpen, setCreateMemberOpen] = useState(false);
  const [createForm] = Form.useForm();
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!open || !society?._id) return;
      setLoadingMembers(true);
      try {
        const response = await fetch(`/api/societies/scheme/${society._id}/members`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });
        if (!response.ok) {
          const errorData = await response.json();
          await sweetAlert({ title: errorData.message || "Failed to fetch society members", icon: "error", timer: 2000 });
          return;
        }
        const data = await response.json();
        setMembers(data.members || []);
      } catch (err) {
        await sweetAlert({ title: "An error occurred while fetching society members", icon: "error", timer: 2000 });
      } finally {
        setLoadingMembers(false);
      }
    };
    load();
  }, [open, society?._id]);

  const handleCreateMember = async () => {
    try {
      const values = await createForm.validateFields();
      if (!society?._id) return;
      setCreating(true);
      const response = await fetch(`/api/societies/scheme/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ societyId: society._id, ...values }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        await sweetAlert({ title: errorData.message || "Failed to create society member", icon: "error", timer: 2000 });
        return;
      }
      const data = await response.json();
      setMembers((prev) => [...prev, data.member]);
      setCreateMemberOpen(false);
      createForm.resetFields();
      await sweetAlert({ title: "Member created successfully", icon: "success", timer: 2000 });
    } catch (err) {
      await sweetAlert({ title: "Failed to create member", icon: "error", timer: 2000 });
    } finally {
      setCreating(false);
    }
  };

  const columns = [
    { title: "Member Name", dataIndex: "fullNames", render: (_: string, record: ISocietyMember) => `${record.initials} ${record.lastName}` },
    { title: "ID Number", dataIndex: "idNumber" },
    { title: "Premium", dataIndex: "premium", render: (value: number) => `${formatToMoneyWithCurrency(value)}` },
    { title: "Cell Number", dataIndex: "cellNumber" },
    { title: "Email Address", dataIndex: "emailAddress" },
    { title: "Physical Address", dataIndex: "address" },
  ];

  return (
    <Drawer
      title="Manage Society Members"
      open={open}
      width="80%"
      onClose={onClose}
      destroyOnClose
      extra={<Button type="primary" className="text-black" onClick={() => setCreateMemberOpen(true)}>Add Member</Button>}
    >
      {!society ? (
        <div />
      ) : (
        <>
          <div className="grid grid-cols-4 gap-4">
            <Card><Statistic title="ASSIT ID" value={society.assitID} className="text-sm" /></Card>
            <Card><Statistic title="Society Name" value={society.name} className="text-sm" /></Card>
            <Card><Statistic title="Default Plan" value={society.planName} className="text-sm" /></Card>
            <Card><Statistic title="Number of Members" value={society.numberOfMembers} className="text-sm" /></Card>
          </div>
          <div className="mt-4">
            {loadingMembers ? (
              <div className="w-full flex justify-center py-12"><Spin size="large" /></div>
            ) : (
              <Table size="small" dataSource={members} rowKey={(r) => (r as any)._id || `${r.idNumber}-${r.cellNumber}`} columns={columns as any} />
            )}
          </div>

          <Drawer
            title="Add Society Member"
            open={createMemberOpen}
            width="30%"
            onClose={() => setCreateMemberOpen(false)}
            destroyOnClose
            footer={
              <div className="flex justify-end gap-2">
                <Button onClick={() => setCreateMemberOpen(false)}>Cancel</Button>
                <Button type="primary" className="text-black" loading={creating} onClick={handleCreateMember}>Add Member</Button>
              </div>
            }
          >
            <Form layout="vertical" form={createForm} className="space-y-2">
              <Card title="Personal Details" size="small">
                <Flex gap={16}>
                  <Form.Item className="w-1/6" label="Initials" name="initials" rules={[{ required: true, message: "Please enter member initials" }]}>
                    <Input />
                  </Form.Item>
                  <Form.Item className="w-full" label="First Names" name="firstNames" rules={[{ required: true, message: "Please enter member first names" }]}>
                    <Input />
                  </Form.Item>
                </Flex>
                <Flex gap={16}>
                  <Form.Item className="w-full" label="Surname" name="lastName" rules={[{ required: true, message: "Please enter member surname" }]}>
                    <Input />
                  </Form.Item>
                  <Form.Item className="w-full" label="ID Number" name="idNumber" rules={[{ required: true, message: "Please enter member ID number" }]}>
                    <Input />
                  </Form.Item>
                </Flex>
              </Card>

              <Card title="Contact Details" size="small">
                <Flex gap={16}>
                  <Form.Item className="w-full" label="Cell Number" name="cellNumber" rules={[{ required: true, message: "Please enter member cell number" }]}>
                    <Input prefix="+27" maxLength={9} />
                  </Form.Item>
                  <Form.Item className="w-full" label="Email Address" name="emailAddress">
                    <Input />
                  </Form.Item>
                </Flex>
                <Form.Item label="Physical Address" name="address">
                  <Input />
                </Form.Item>
              </Card>

              <Card title="Policy Details" size="small">
                <Flex gap={16}>
                  <Form.Item label="Plan" name="plan" rules={[{ required: true, message: "Please enter member plan" }]}>
                    <Input />
                  </Form.Item>
                  <Form.Item label="Premium" name="premium" rules={[{ required: true, message: "Please enter member premium" }]}>
                    <Input prefix="R" />
                  </Form.Item>
                </Flex>
              </Card>
            </Form>
          </Drawer>
        </>
      )}
    </Drawer>
  );
}


