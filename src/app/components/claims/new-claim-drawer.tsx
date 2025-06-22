"use client";

import React, { useState } from "react";



import { Button, Input, Textarea } from "@nextui-org/react";
import { Drawer, message } from "antd";
import sweetAlert from "sweetalert";


interface Props {
  open: boolean;
  onClose: () => void;
  onSubmitted?: () => void;
}

const NewClaimDrawer: React.FC<Props> = ({ open, onClose, onSubmitted }) => {
  const [claimantName, setClaimantName] = useState("");
  const [policyId, setPolicyId] = useState("");
  const [reason, setReason] = useState("");
  const [documents, setDocuments] = useState<{ name: string; url: string }[]>(
    []
  );
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleFileUpload = async (file: File) => {
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/api/upload/claim-documents", {
      method: "POST",
      body: formData,
    });

    const json = await res.json();
    setUploading(false);

    if (json.success) {
      setDocuments((prev) => [...prev, { name: file.name, url: json.url }]);
      sweetAlert({
        icon: "success",
        title: "File uploaded",
        timer: 1000,
      });
    } else {
      sweetAlert({
        icon: "error",
        title: "Upload failed",
      });
    }
  };

  const handleSubmit = async () => {
    setLoading(true);

    try {
      const res = await fetch("/api/claims", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ claimantName, policyId, reason, documents }),
      });

      const json = await res.json();
      if (res.ok) {
        sweetAlert({
          icon: "success",
          title: "Claim Submitted!",
          text: "Your claim has been successfully submitted.",
          timer: 2000,
        });
        onClose();
        onSubmitted?.();
      } else {
        message.error(json.message || "Error submitting claim");
        sweetAlert({
          icon: "error",
          title: json.message || "Error submitting claim",
        });
      }
    } catch {
      sweetAlert({
        icon: "error",
        title: "Error submitting claim",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Drawer
      title="Submit a New Claim"
      placement="right"
      width={600}
      onClose={onClose}
      open={open}
    >
      <div className="space-y-4">
        <Input
          label="Claimant Name"
          value={claimantName}
          onValueChange={setClaimantName}
        />
        <Input
          label="Policy Number"
          value={policyId}
          onValueChange={setPolicyId}
        />
        <Textarea label="Reason" value={reason} onValueChange={setReason} />

        <div className="space-y-2">
          <label className="text-sm font-medium">Supporting Documents</label>
          <input
            type="file"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFileUpload(file);
            }}
            disabled={uploading}
          />
          {uploading && <p className="text-xs text-gray-400">Uploading...</p>}
          <ul className="list-disc pl-5 text-sm text-green-600">
            {documents.map((doc) => (
              <li key={doc.url}>{doc.name}</li>
            ))}
          </ul>
        </div>

        <Button color="primary" onClick={handleSubmit} isLoading={loading}>
          Submit Claim
        </Button>
      </div>
    </Drawer>
  );
};

export default NewClaimDrawer;