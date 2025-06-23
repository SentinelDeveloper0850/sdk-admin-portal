"use client";

import React, { useState } from "react";

import { Button, Input, Select, SelectItem, Textarea } from "@nextui-org/react";
import { Drawer, message } from "antd";
import sweetAlert from "sweetalert";

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmitted?: () => void;
}

const NewClaimDrawer: React.FC<Props> = ({ open, onClose, onSubmitted }) => {
  const [claimantName, setClaimantName] = useState<string>("");
  const [societyName, setSocietyName] = useState<string>("");
  const [policyId, setPolicyId] = useState<string>("");
  const [policyPlan, setPolicyPlan] = useState<string>("");
  const [claimNumber, setClaimNumber] = useState<string>("");
  const [schemeType, setSchemeType] = useState<"Individual" | "Society">();
  const [claimType, setClaimType] = useState<"Cash" | "Service">("Cash");
  const [claimAmount, setClaimAmount] = useState<number>(2500);
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

  const handleCancel = () => {};

  const handleSubmit = async () => {
    setLoading(true);

    try {
      const res = await fetch("/api/claims", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          claimantName,
          policyId,
          reason,
          documents,
          societyName,
          policyPlan,
          claimNumber,
          schemeType,
          claimType,
          claimAmount,
        }),
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
      footer={
        <div className="flex justify-end gap-2">
          <Button color="danger" onClick={handleCancel} disabled={loading}>
            Cancel
          </Button>
          <Button color="primary" onClick={handleSubmit} isLoading={loading}>
            Submit Claim
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <Input
          label="Claimant Name"
          value={claimantName}
          onValueChange={setClaimantName}
        />

        <Select
          label="Scheme Type"
          value={schemeType}
          onChange={(e) => {
            setSchemeType(e.target.value as "Individual" | "Society");
          }}
        >
          <SelectItem key={"Individual"} value="Individual">
            Individual
          </SelectItem>
          <SelectItem key={"Society"} value="Society">
            Society
          </SelectItem>
        </Select>

        {schemeType === "Society" && (
          <Input
            label="Society Name"
            value={societyName}
            onValueChange={setSocietyName}
          />
        )}

        <Input
          label="Policy Number"
          value={policyId}
          onValueChange={setPolicyId}
        />

        <Input
          label="Policy Plan"
          value={policyPlan}
          onValueChange={setPolicyPlan}
        />

        <Select
          label="Claim Type"
          value={claimType}
          onChange={(e) => {
            setClaimType(e.target.value as "Cash" | "Service");
          }}
        >
          <SelectItem key="Cash" value="Cash">
            Cash
          </SelectItem>
          <SelectItem key="Service" value="Service">
            Service
          </SelectItem>
        </Select>

        <Input
          label="Claim Number"
          value={claimNumber}
          onValueChange={setClaimNumber}
        />

        {claimType === "Cash" && (
          <Input
            label="Claim Amount"
            value={claimAmount.toString()}
            onValueChange={(val) => setClaimAmount(parseInt(val))}
            type="number"
            step={500}
          />
        )}

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
      </div>
    </Drawer>
  );
};

export default NewClaimDrawer;
