"use client";

import React, { useEffect, useState } from "react";

import {
  Button,
  Select,
  SelectItem,
  Spinner,
  Textarea,
} from "@nextui-org/react";
import { Card, Drawer, Tag, message } from "antd";
import dayjs from "dayjs";

import { IClaim } from "@/app/models/claim.schema";

import { DrawerContent } from "../ui/drawer";
import ClaimChat from "./claim-chat";

interface Props {
  open: boolean;
  onClose: () => void;
  claimId: string | null;
}

const ClaimDetailsDrawer: React.FC<Props> = ({ open, onClose, claimId }) => {
  const [claim, setClaim] = useState<IClaim>();
  const [loading, setLoading] = useState(false);
  const [comment, setComment] = useState("");
  const [postingComment, setPostingComment] = useState(false);

  const refreshClaim = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/claims/${claimId}`);
      if (!res.ok) {
        message.error("Failed to fetch claim");
        return;
      }
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
      sweetAlert({
        icon: "error",
        title: "Failed to post comment",
      });
    }

    setPostingComment(false);
  };

  const handleStatusUpdate = async (newStatus: string) => {
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
  };

  return (
    <Drawer
      title={`Claim Details`}
      placement="right"
      width="80%"
      onClose={onClose}
      open={open}
      bodyStyle={{ padding: 0 }}
    >
      {loading ? (
        <Spinner label="Loading..." />
      ) : claim ? (
        <div className="flex h-full gap-0">
          {/* Claim Info */}
          <div className="w-1/3 space-y-4 p-4 pr-0">
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
                <p>R {claim.claimAmount}</p>
              </div>
            </Card>

            <Card title="Documentation" size="small">
              <ul className="list-disc pl-5 text-sm text-blue-600">
                {claim.documents.map((doc: any) => (
                  <li key={doc.url}>
                    <a href={doc.url} target="_blank" rel="noopener noreferrer">
                      {doc.name}
                    </a>
                  </li>
                ))}
              </ul>
            </Card>

            <div>
              <h3 className="font-semibold">Reason</h3>
              <p>{claim.reason}</p>
            </div>
          </div>

          <div className="w-1/3 space-y-4 p-4">
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
                <h3 className="font-semibold">Status</h3>
                <Select
                  selectedKeys={[claim.status]}
                  onSelectionChange={(keys) => {
                    const newStatus = Array.from(keys)[0];
                    if (typeof newStatus === "string")
                      handleStatusUpdate(newStatus);
                  }}
                  className="max-w-xs"
                >
                  <SelectItem key="Submitted">Submitted</SelectItem>
                  <SelectItem key="In Review">In Review</SelectItem>
                  <SelectItem key="Approved">Approved</SelectItem>
                  <SelectItem key="Rejected">Rejected</SelectItem>
                </Select>
              </div>
            </Card>
          </div>

          <div className="h-full w-1/3">
            <ClaimChat
              comments={claim.comments}
              onSendMessage={(message: string) => handleAddComment(message)}
              loading={postingComment}
            />
          </div>
        </div>
      ) : (
        <p className="text-gray-400">Select a claim to view details</p>
      )}
    </Drawer>
  );
};

export default ClaimDetailsDrawer;
