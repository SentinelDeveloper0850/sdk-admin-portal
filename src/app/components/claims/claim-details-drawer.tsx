"use client";

import React, { useEffect, useState } from "react";

import { Select, SelectItem, Spinner } from "@nextui-org/react";
import { Card, Drawer, Space, Tag, message } from "antd";
import dayjs from "dayjs";

import { formatToMoneyWithCurrency } from "@/utils/formatters";

import { IClaim } from "@/app/models/scheme/claim.schema";

import ClaimChat from "./claim-chat";

interface Props {
  open: boolean;
  onClose: () => void;
  claimId: string | null;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case "Submitted":
      return "default";
    case "In Review":
      return "gold";
    case "Approved":
      return "green";
    case "Rejected":
      return "red";
    default:
      return "blue";
  }
};

const ClaimDetailsDrawer: React.FC<Props> = ({ open, onClose, claimId }) => {
  const [claim, setClaim] = useState<IClaim>();
  const [loading, setLoading] = useState(false);
  const [comment, setComment] = useState("");
  const [postingComment, setPostingComment] = useState(false);

  const refreshClaim = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/claims/${claimId}`);
      const json = await res.json();
      if (json.success) {
        setClaim(json.claim);
      } else {
        message.error(json.message || "Could not load claim");
      }
    } catch (error) {
      message.error("Unexpected error while fetching claim");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (claimId) {
      refreshClaim();
    }
  }, [claimId]);

  const handleAddComment = async (message: string) => {
    if (!message.trim()) return;
    setPostingComment(true);

    const res = await fetch(`/api/claims/${claimId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ comment: message }),
    });

    const json = await res.json();
    if (json.success) {
      setComment("");
      await refreshClaim();
    } else {
      // message.error("Failed to post comment");
    }

    setPostingComment(false);
  };

  const handleStatusUpdate = async (newStatus: string) => {
    try {
      const res = await fetch(`/api/claims/${claimId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      const json = await res.json();
      if (json.success) {
        message.success("Status updated");
        await refreshClaim();
      } else {
        message.error("Failed to update status");
      }
    } catch (error) {
      console.log("🚀 ~ handleStatusUpdate ~ error:", error);
      message.error("Failed to update status");
    }
  };

  return (
    <Drawer
      title={`Claim Details`}
      placement="right"
      width="80%"
      onClose={onClose}
      open={open}
      bodyStyle={{ padding: 0 }}
      extra={
        <Space>
          <Select
            className="w-[120px] max-w-xs rounded-xl dark:border dark:border-zinc-700"
            disabled={loading}
            selectedKeys={[claim?.status!]}
            onSelectionChange={(keys) => {
              const newStatus = Array.from(keys)[0];
              if (typeof newStatus === "string") handleStatusUpdate(newStatus);
            }}
          >
            <SelectItem key="Submitted">Submitted</SelectItem>
            <SelectItem key="In Review">In Review</SelectItem>
            <SelectItem key="Approved">Approved</SelectItem>
            <SelectItem key="Rejected">Rejected</SelectItem>
          </Select>
        </Space>
      }
    >
      {loading ? (
        <Spinner label="Loading..." />
      ) : claim ? (
        <div className="grid h-full grid-cols-1 gap-0 md:grid-cols-3">
          {/* Left Panel */}
          <div className="space-y-4 border-r p-4 dark:border-zinc-700">
            <Card title="Claim Information" size="small">
              <div className="mb-4">
                <h3 className="font-semibold">Claimant</h3>
                <p>{claim.claimantName}</p>
              </div>

              <div className="mb-4">
                <h3 className="font-semibold">Claim Number</h3>
                <p>{claim.claimNumber}</p>
              </div>

              <div className="mb-4">
                <h3 className="font-semibold">Claim Type</h3>
                <p>{claim.claimType}</p>
              </div>

              <div>
                <h3 className="font-semibold">Claim Amount</h3>
                <p>{formatToMoneyWithCurrency(claim.claimAmount!)}</p>
              </div>
            </Card>

            <Card title="Documentation" size="small">
              {claim.documents?.length > 0 ? (
                <ul className="space-y-2 text-sm text-blue-500">
                  {claim.documents.map((doc: any) => (
                    <li key={doc.url}>
                      <a
                        href={doc.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 hover:underline"
                      >
                        📄 {doc.name}
                      </a>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-400">No documents uploaded</p>
              )}
            </Card>

            <div>
              <h3 className="font-semibold">Reason</h3>
              <p>{claim.reason}</p>
            </div>
          </div>

          {/* Middle Panel */}
          <div className="space-y-4 border-r p-4 dark:border-zinc-700">
            <Card title="Policy Information" size="small">
              <div className="mb-4">
                <h3 className="font-semibold">Scheme Type</h3>
                <p>{claim.schemeType}</p>
              </div>

              {claim.schemeType === "Society" && (
                <div className="mb-4">
                  <h3 className="font-semibold">Society Name</h3>
                  <p>{claim.societyName}</p>
                </div>
              )}

              <div className="mb-4">
                <h3 className="font-semibold">Policy Number</h3>
                <p>{claim.policyId}</p>
              </div>

              <div>
                <h3 className="font-semibold">Policy Plan</h3>
                <p>{claim.policyPlan}</p>
              </div>
            </Card>

            <Card title="Metadata" size="small">
              <div className="mb-4">
                <h3 className="font-semibold">Submitted</h3>
                <p>{dayjs(claim.createdAt).format("DD MMM YYYY [at] HH:mm")}</p>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="font-semibold">Status</h3>
                  <Tag color={getStatusColor(claim.status)}>{claim.status}</Tag>
                </div>
              </div>
            </Card>
          </div>

          {/* Right Panel */}
          <div className="h-full p-4">
            <ClaimChat
              comments={claim.comments}
              onSendMessage={handleAddComment}
              loading={postingComment}
            />
          </div>
        </div>
      ) : (
        <p className="p-4 text-gray-400">Select a claim to view details</p>
      )}
    </Drawer>
  );
};

export default ClaimDetailsDrawer;
