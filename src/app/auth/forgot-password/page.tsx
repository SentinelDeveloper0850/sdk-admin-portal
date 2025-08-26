"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Button, Card, CardBody } from "@nextui-org/react";
import { Divider, Form, Input } from "antd";
import axios from "axios";

import { useAuth } from "@/context/auth-context";

const emailRules: any = [
  {
    required: true,
    message: "Please input your email!",
  },
  {
    type: "email",
    message: "That is not a valid email!",
  },
];

const passwordRules: any = [
  {
    required: true,
    message: "Please input your password!",
  },
];

const ForgotPasswordPage = () => {
  const [form] = Form.useForm();

  const { setUser } = useAuth();
  const router = useRouter();

  const handleSubmit = async (values: any) => {
    try {
      const response = await axios.post(
        "/api/auth/forgot-password",
        JSON.stringify(values),
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (response.status != 200) {
        const errorData = response.data;
        throw new Error(errorData.message || "Login failed");
      }

      const data = response.data;
      // Update user in context
      setUser(data.user);

      router.push("/dashboard"); // Redirect to dashboard
    } catch (error: any) {
      console.error(error);
    }
  };

  return (
    <div className="w-full px-4 py-8">
      <Image
        src="/logo.png"
        alt="logo"
        width={120}
        height={120}
        className="mx-auto mb-4"
      />
      <h1 className="text-center font-semibold">SOMDAKA FUNERAL SERVICES</h1>
      <Divider
        style={{
          minWidth: "60%",
          width: "60%",
          margin: "0.5rem 20%",
          borderTop: "1px solid #ffac00",
        }}
      />
      <h2 className="mb-8 text-center text-small font-semibold">
        ADMINISTRATION PORTAL
      </h2>
      <h1 className="px-2 text-xl font-semibold">Forgot Password</h1>
      <p className="mb-4 px-2 text-sm italic text-gray-500">
        We'll send you a link to reset your password
      </p>
      <Card className="dark:bg-slate-50">
        <CardBody className="p-6">
          <Form form={form} layout="vertical" onFinish={handleSubmit}>
            <Form.Item label="Email" name="email" rules={emailRules}>
              <Input type="email" placeholder="Enter your email" />
            </Form.Item>
            <Button color="primary" fullWidth onClick={() => form.submit()}>
              Send Link
            </Button>
            <Link href="/auth/signin" className="hover:text-primary">
              <p className="p-2 text-center">Return to sign in</p>
            </Link>
          </Form>
        </CardBody>
      </Card>
    </div>
  );
};

export default ForgotPasswordPage;
