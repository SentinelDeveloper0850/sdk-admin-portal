"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Drawer, Spin, message } from "antd";

import { withRoleGuard } from "@/utils/utils/with-role-guard";

import { PolicySignupViewModal } from "@/app/components/policy-signup-view-modal";
import { IPolicySignUp } from "@/app/models/scheme/policy-signup-request.schema";

import { ERoles } from "../../../../../types/roles.enum";

function SignupRequestDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const requestId = (params?.requestId as string) || "";

  const [loading, setLoading] = useState<boolean>(true);
  const [record, setRecord] = useState<IPolicySignUp | null>(null);
  const [open, setOpen] = useState<boolean>(true);

  useEffect(() => {
    const fetchRequest = async () => {
      if (!requestId) return;
      setLoading(true);
      try {
        const res = await fetch(
          `/api/policies/easipol/signup-requests?requestId=${encodeURIComponent(requestId)}`
        );
        const json = await res.json();
        if (json.success && json.data) {
          setRecord(json.data as IPolicySignUp);
        } else {
          message.error(json.error || "Signup request not found");
          router.replace("/policies/signup-requests");
        }
      } catch (error) {
        message.error("Failed to load signup request");
        router.replace("/policies/signup-requests");
      } finally {
        setLoading(false);
      }
    };

    fetchRequest();
  }, [requestId, router]);

  const handleClose = () => {
    setOpen(false);
    router.push("/policies/signup-requests");
  };

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

  return (
    <Drawer
      title="Signup Request Details"
      placement="right"
      width="60%"
      onClose={handleClose}
      open={open}
      styles={{ body: { paddingBottom: 80 } }}
    >
      {record && (
        <PolicySignupViewModal
          visible={open}
          onClose={handleClose}
          record={record}
        />
      )}
    </Drawer>
  );
}

export default withRoleGuard(SignupRequestDetailsPage, [
  ERoles.Admin,
  ERoles.SchemeConsultantOnline,
]);
