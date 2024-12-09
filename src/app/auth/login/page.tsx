"use client";

import Image from "next/image";

import { Divider } from "antd";

import LoginForm from "@/app/components/auth/login-form";

const LoginPage = () => {
  return (
    <div style={{ maxWidth: "400px", margin: "50px auto" }}>
      <Image
        src="/logo.png"
        alt="logo"
        width={80}
        height={80}
        className="mx-auto mb-4 mt-8"
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
      <h2 className="text-center font-semibold mb-8 text-small">ADMINISTRATION PORTAL</h2>
      <LoginForm />
    </div>
  );
};

export default LoginPage;
