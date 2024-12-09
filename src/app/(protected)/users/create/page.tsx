"use client";

import { useRouter } from "next/navigation";

import { MailOutlined } from "@ant-design/icons";
import { Button, Form, Input, Select, message } from "antd";

import PageHeader from "@/app/components/page-header";

const CreateUser = () => {
  const form = Form.useForm();
  const selectedRole = Form.useWatch("role", form[0]);

  const router = useRouter();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleSubmit = async (values: any) => {
    try {
      // Simulate API call (Replace with actual API integration)
      console.log("Values:", values);

      message.success("User created successfully!");
      router.back(); // Navigate back to the Vehicles page
    } catch (error) {
      console.error(error);
      message.error("Failed to create user.");
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <PageHeader
        title="Invite User"
        subtitle="Invite a new user to the team"
        actions={[]}
      />
      <Form
        form={form[0]}
        layout="vertical"
        onFinish={handleSubmit}
        className="w-1/3 items-start justify-start"
      >
        <Form.Item
          label="First Names"
          name="firstNames"
          rules={[
            {
              required: true,
              message: "Required",
            },
          ]}
        >
          <Input placeholder="Enter user first names" />
        </Form.Item>
        <Form.Item
          label="Last Name"
          name="lastName"
          rules={[
            {
              required: true,
              message: "Required",
            },
          ]}
        >
          <Input placeholder="Enter user last name" />
        </Form.Item>
        {selectedRole != "driver" && (
          <Form.Item
            label="Email"
            name="email"
            rules={[
              {
                required: true,
                message: "Required",
              },
            ]}
          >
            <Input
              addonBefore={<MailOutlined />}
              placeholder="Enter user email"
            />
          </Form.Item>
        )}
        <Form.Item
          label="Phone"
          name="phone"
          rules={[
            {
              required: true,
              message: "Required",
            },
          ]}
        >
          <Input addonBefore="+27" placeholder="Enter user phone" />
        </Form.Item>
        <Form.Item
          label="User Role"
          name="role"
          rules={[
            {
              required: true,
              message: "Required",
            },
          ]}
        >
          <Select placeholder="Select a role for the user">
            <Select.Option key="1" value="admin">
              Admin
            </Select.Option>
            <Select.Option key="2" value="driver">
              Driver
            </Select.Option>
          </Select>
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit" block>
            Send Invite
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
};

export default CreateUser;
