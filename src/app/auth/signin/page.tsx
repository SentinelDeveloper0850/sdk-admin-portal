"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button, Card, CardBody } from "@nextui-org/react";
import { Alert, Divider, Form, Input } from "antd";
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

const LoginPage = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | boolean>(false);

  const { setUser } = useAuth();
  const router = useRouter();

  const handleLogin = async (values: any) => {
    setLoading(true);
    setError(false);

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
        console.log("login response", response);
        setError("Something went wrong");
        return;
      }

      const data = response.data;
      // Update user in context
      setUser(data.user);

      router.push("/calendar"); // Redirect to calendar
    } catch (error: any) {
      console.error(error.response.data.message);
      setError(error.response.data.message);
    } finally {
      setLoading(false);
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
      <h1 className="px-2 text-xl font-semibold">Sign in</h1>
      <p className="mb-4 px-2 text-sm italic text-gray-500">
        Enter your email and password to access your account
      </p>
      {error && (
        <Alert
          showIcon
          type="error"
          message={error ?? "No error detected..."}
          className="mb-4"
        />
      )}
      <Card className="dark:bg-zinc-800">
        <CardBody className="p-6">
          <Form form={form} layout="vertical" onFinish={handleLogin}>
            <Form.Item label="Email" name="email" rules={emailRules}>
              <Input type="email" placeholder="Enter your email" />
            </Form.Item>
            <Form.Item label="Password" name="password" rules={passwordRules}>
              <Input.Password placeholder="Enter your password" />
            </Form.Item>
            <Button
              color="primary"
              fullWidth
              onClick={() => form.submit()}
              isLoading={loading}
            >
              Sign in
            </Button>
            <Link
              href="/auth/forgot-password"
              className="hover:text-primary dark:text-white dark:hover:text-primary"
            >
              <p className="p-2 text-center">
                Forgot password? <b>Recover</b>
              </p>
            </Link>
          </Form>
        </CardBody>
      </Card>
    </div>
  );
};

export default LoginPage;
