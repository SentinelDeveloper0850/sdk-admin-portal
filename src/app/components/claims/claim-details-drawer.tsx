"use client";

import React, { useEffect, useState } from "react";



import { Button, Select, SelectItem, Spinner, Textarea } from "@nextui-org/react";
import { Drawer, message } from "antd";


interface Props {
  open: boolean;
  onClose: () => void;
  claimId: string | null;
}

const ClaimDetailsDrawer: React.FC<Props> = ({ open, onClose, claimId }) => {
  const [claim, setClaim] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [comment, setComment] = useState("");

  const fetchClaim = async () => {
    setLoading(true);

    try {
      const res = await fetch(`/api/claims/${claimId}`);
      if (!res.ok) {
        sweetAlert({
          icon: "error",
          title: "Failed to fetch claim",
        });
        return;
      }

      const json = await res.json();
      if (json.success) {
        setClaim(json.claim);
      } else {
        sweetAlert({
          icon: "error",
          title: json.message || "Could not load claim",
        });
      }
    } catch (error) {
      sweetAlert({
        icon: "error",
        title: "Unexpected error while fetching claim",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (claimId) {
      fetchClaim();
    }
  }, [claimId]);

  const handleAddComment = async () => {
    if (!comment.trim()) return;

    const res = await fetch(`/api/claims/${claimId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        comment,
      }),
    });

    const json = await res.json();
    if (json.success) {
      setComment("");
      sweetAlert({
        icon: "success",
        title: "Comment posted",
        timer: 1000,
      });
      await fetchClaim(); // refetch to update UI
    } else {
      sweetAlert({
        icon: "error",
        title: "Failed to post comment",
      });
    }
  };

  return (
    <Drawer
      title={`Claim Details`}
      placement="right"
      width={600}
      onClose={onClose}
      open={open}
    >
      {loading ? (
        <Spinner label="Loading..." />
      ) : claim ? (
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold">Claimant</h3>
            <p>{claim.claimantName}</p>
          </div>

          <div>
            <h3 className="font-semibold">Policy Number</h3>
            <p>{claim.policyId}</p>
          </div>

          <div>
            <h3 className="font-semibold">Reason</h3>
            <p>{claim.reason}</p>
          </div>

          <div>
            <h3 className="font-semibold">Status</h3>
            <Select
              label="Status"
              selectedKeys={[claim.status]}
              onSelectionChange={async (keys) => {
                const newStatus = Array.from(keys)[0];
                const res = await fetch(`/api/claims/${claimId}`, {
                  method: "PATCH",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ status: newStatus }),
                });

                const json = await res.json();
                if (json.success) {
                  sweetAlert({
                    icon: "success",
                    title: "Status updated",
                    timer: 1000,
                  });
                  await fetchClaim();
                } else {
                  sweetAlert({
                    icon: "error",
                    title: "Failed to update status",
                  });
                }
              }}
              className="max-w-xs"
            >
              <SelectItem key="Submitted">Submitted</SelectItem>
              <SelectItem key="In Review">In Review</SelectItem>
              <SelectItem key="Approved">Approved</SelectItem>
              <SelectItem key="Rejected">Rejected</SelectItem>
            </Select>
          </div>

          <div>
            <h3 className="font-semibold">Documents</h3>
            <ul className="list-disc pl-5 text-sm text-blue-600">
              {claim.documents.map((doc: any) => (
                <li key={doc.url}>
                  <a href={doc.url} target="_blank" rel="noopener noreferrer">
                    {doc.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-semibold">Comments</h3>
            <div className="my-2 max-h-48 space-y-2 overflow-y-auto rounded border p-2">
              {claim.comments.map((c: any, idx: number) => (
                <div key={idx} className="border-b pb-2 text-sm">
                  <p className="text-xs text-gray-500">
                    {c.author?.name ?? "Unknown"} •{" "}
                    {new Date(c.createdAt).toLocaleString()}
                  </p>
                  <p>{c.text}</p>
                </div>
              ))}
            </div>
            <Textarea
              label="Add a comment"
              value={comment}
              onValueChange={setComment}
            />
            <Button size="sm" className="mt-2" onClick={handleAddComment}>
              Post Comment
            </Button>
          </div>
        </div>
      ) : (
        <p className="text-gray-400">Select a claim to view details</p>
      )}
    </Drawer>
  );
};

export default ClaimDetailsDrawer;