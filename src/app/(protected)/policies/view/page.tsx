"use client";

import { useEffect, useState } from "react";

import {
  CloseOutlined,
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  MailOutlined,
  MoreOutlined,
  PhoneOutlined,
  PrinterOutlined,
  SearchOutlined,
  UserOutlined,
} from "@ant-design/icons";
import {
  Button,
  Col,
  Dropdown,
  Form,
  Input,
  Modal,
  Row,
  Select,
  Space,
  Statistic,
  Table,
  Tag,
  Tabs
} from "antd";

import PageHeader from "@/app/components/page-header";
import PolicyCancellationDrawer from "@/app/components/policies/policy-cancellation-drawer";
import PolicyDetailsDrawer from "@/app/components/policies/policy-details-drawer";
import PolicyPrintCardDrawer from "@/app/components/policies/policy-print-card-drawer";
import Loading from "@/app/components/ui/loading";
import sweetAlert from "sweetalert";
import EasipolPoliciesPage from "./EasipolPolicies";
import AssitPoliciesPage from "./AssitPolicies";

export interface IMemberPolicy {
  _id: string;
  memberID: string;
  policyNumber: string;
  fullname: string;
  productName: string;
  cellNumber?: string;
  cellphoneNumber?: string;
  emailAddress?: string;
  paymentMethod?: string;
  status?: string;
  paymentHistoryFile?: string;
  easypayNumber?: string;
  payAtNumber?: string;
  memberId?: string;
  fullName?: string;
  whatsappNumber?: string;
  homeTelephone?: string;
  physicalAddress?: string;
  postalAddress?: string;
  cancellationStatus?: "none" | "pending_review" | "approved" | "rejected";
}

export default function PoliciesPage() {

  return (
    <div style={{ padding: "20px" }}>
      <PageHeader title="All Policies" actions={[]} noDivider />

      <Tabs defaultActiveKey="easipol" items={[
        {
          key: "easipol",
          label: "Easipol Policies",
          children: <EasipolPoliciesPage />,
        },
        {
          key: "assit",
          label: "ASSIT Policies",
          children: <AssitPoliciesPage />,
        },
      ]} />
    </div >
  );
}
