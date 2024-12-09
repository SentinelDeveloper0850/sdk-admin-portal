"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Button } from "@nextui-org/react";
import { Form, Input } from "antd";
import { Divider } from "antd";
import axios from "axios";

import { useAuth } from "@/context/auth-context";

const LoginPage = () => {
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
    <div className="w-full px-4 py-8">
      <Image
        src="/logo.png"
        alt="logo"
        width={80}
        height={80}
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
      <h1 className="text-xl font-semibold">Sign in</h1>
      <p className="mb-4 text-sm text-gray-500 italic">Enter your email and password to access your account</p>
      <Divider />
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
    </div>
  );
};

export default LoginPage;
