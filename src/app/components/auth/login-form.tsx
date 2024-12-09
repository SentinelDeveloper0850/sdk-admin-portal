/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { Button } from "@nextui-org/react";
import { Form, Input } from "antd";
import axios from "axios";

import { useAuth } from "@/context/auth-context";

const LoginForm = () => {
  const [form] = Form.useForm();

  const { setUser } = useAuth();
  const router = useRouter();

  const handleLogin = async (values: any) => {
    try {
      const response = await axios.post(
        "/api/auth/login",
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

      // Store token in cookies or local storage
      document.cookie = `auth-token=${data.token}; path=/`;

      // Update user in context
      setUser(data.user);

      router.push("/dashboard"); // Redirect to dashboard
    } catch (error: any) {
      console.error(error);
    }
  };

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

  return (
    <>
      {/* <Card>
        <CardBody className="p-6"> */}
      <h1>Sign in</h1>
      <p>Enter your email and password to access your account</p>
      <Form form={form} layout="vertical" onFinish={handleLogin}>
        <Form.Item label="Email" name="email" rules={emailRules}>
          <Input type="email" placeholder="Enter your email" />
        </Form.Item>
        <Form.Item label="Password" name="password" rules={passwordRules}>
          <Input.Password placeholder="Enter your password" />
        </Form.Item>
        <Button color="primary" fullWidth onClick={() => form.submit()}>
          Login
        </Button>
        <Link href="/auth/login">
          <p className="mt-2 p-2 text-center">
            Forgot password? <b>Recover</b>
          </p>
        </Link>
      </Form>
      {/* </CardBody>
      </Card> */}
    </>
  );
};

export default LoginForm;
