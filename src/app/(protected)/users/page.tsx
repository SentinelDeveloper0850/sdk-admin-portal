"use client";

import Link from "next/link";
import React from "react";

import { Button } from "@nextui-org/react";
import { IconPlus } from "@tabler/icons-react";

import PageHeader from "@/app/components/page-header";

const UsersPage = () => {

  return (
    <div style={{ padding: "20px" }}>
      <PageHeader
        title="Manage Users"
        subtitle="Create, update, and delete Users from your system"
        actions={[
          <Link key={1} href="/users/create">
            <Button isIconOnly color="primary" size="sm">
              <IconPlus />
            </Button>
          </Link>,
        ]}
      />
    </div>
  );
};

export default UsersPage;
