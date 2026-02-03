"use client";

import React, { useEffect, useState } from "react";

import { Button, Card, Drawer, Space, Tag, message } from "antd";
import dayjs from "dayjs";

import { formatToMoneyWithCurrency } from "@/utils/formatters";

import { IPolicy } from "@/app/models/scheme/policy.schema";

interface Props {
  open: boolean;
  onClose: () => void;
  policyId: string | null;
}

const getStatusColor = (status?: string) => {
  switch (status?.toLowerCase()) {
    case "active":
      return "green";
    case "inactive":
      return "red";
    case "lapsed":
      return "orange";
    case "suspended":
      return "volcano";
    case "pending":
      return "blue";
    case "cancelled":
      return "red";
    case "expired":
      return "purple";
    default:
      return "default";
  }
};

const PolicyDetailsDrawer: React.FC<Props> = ({ open, onClose, policyId }) => {
  const [policy, setPolicy] = useState<IPolicy>();
  const [loading, setLoading] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const refreshPolicy = async () => {
    if (!policyId) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/policies/${policyId}`);
      const json = await res.json();
      if (json.success) {
        setPolicy(json.policy);
      } else {
        message.error(json.message || "Could not load policy");
      }
    } catch (error) {
      message.error("Unexpected error while fetching policy");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (policyId) {
      refreshPolicy();
    }
  }, [policyId]);

  return (
    <Drawer
      title={`Policy Details - ${policy?.policyNumber || ""}`}
      placement="right"
      width="80%"
      onClose={onClose}
      open={open}
      bodyStyle={{ padding: 0 }}
      extra={
        <Space>
          {policy?.currstatus && (
            <Tag color={getStatusColor(policy.currstatus)}>
              {policy.currstatus}
            </Tag>
          )}
        </Space>
      }
    >
      {loading ? (
        <div className="flex h-full items-center justify-center">
          <div className="text-center">Loading...</div>
        </div>
      ) : policy ? (
        <div className="grid h-full grid-cols-1 gap-0 md:grid-cols-3">
          {/* Left Panel - Policy Information */}
          <div className="space-y-4 border-r p-4 dark:border-zinc-700">
            <Card title="Policy Information" size="small">
              <div className="mb-4">
                <h3 className="font-semibold">Policy Number</h3>
                <p className="font-mono text-lg">{policy.policyNumber}</p>
              </div>
              <div className="mb-4">
                <h3 className="font-semibold">Member ID</h3>
                <p>{policy.memberID}</p>
              </div>
              <div className="mb-4">
                <h3 className="font-semibold">Product Name</h3>
                <p>{policy.productName}</p>
              </div>
              <div className="mb-4">
                <h3 className="font-semibold">Branch</h3>
                <p>
                  {policy.branchName} ({policy.branchID})
                </p>
              </div>
              {policy.inceptionDate && (
                <div className="mb-4">
                  <h3 className="font-semibold">Inception Date</h3>
                  <p>{dayjs(policy.inceptionDate).format("DD MMM YYYY")}</p>
                </div>
              )}
            </Card>

            <Card title="Payment Information" size="small">
              {policy.usualPremium && (
                <div className="mb-4">
                  <h3 className="font-semibold">Premium Amount</h3>
                  <p className="text-lg font-semibold text-green-600">
                    {formatToMoneyWithCurrency(policy.usualPremium)}
                  </p>
                </div>
              )}
              {policy.paymentMethod && (
                <div className="mb-4">
                  <h3 className="font-semibold">Payment Method</h3>
                  <p>{policy.paymentMethod}</p>
                </div>
              )}
              {policy.easypayNumber && (
                <div className="mb-4">
                  <h3 className="font-semibold">Easypay Number</h3>
                  <p>{policy.easypayNumber}</p>
                </div>
              )}
            </Card>

            {policy.paymentHistoryFile && (
              <Card title="Payment History" size="small">
                <Button
                  type="primary"
                  onClick={() =>
                    setPreviewImage(policy.paymentHistoryFile || null)
                  }
                  block
                >
                  View Payment History
                </Button>
              </Card>
            )}
          </div>

          {/* Middle Panel - Member Information */}
          <div className="space-y-4 border-r p-4 dark:border-zinc-700">
            <Card title="Member Information" size="small">
              <div className="mb-4">
                <h3 className="font-semibold">Full Name</h3>
                <p className="text-lg">{policy.fullname}</p>
              </div>
              {policy.iDNumber && (
                <div className="mb-4">
                  <h3 className="font-semibold">ID Number</h3>
                  <p>{policy.iDNumber}</p>
                </div>
              )}
              {policy.dateOfBirth && (
                <div className="mb-4">
                  <h3 className="font-semibold">Date of Birth</h3>
                  <p>{dayjs(policy.dateOfBirth).format("DD MMM YYYY")}</p>
                </div>
              )}
              {policy.cellphoneNumber && (
                <div className="mb-4">
                  <h3 className="font-semibold">Cell Number</h3>
                  <p>{policy.cellphoneNumber}</p>
                </div>
              )}
              {!policy.cellphoneNumber && policy.cellNumber && (
                <div className="mb-4">
                  <h3 className="font-semibold">Cell Number</h3>
                  <p>{policy.cellNumber}</p>
                </div>
              )}
              {policy.emailAddress && (
                <div>
                  <h3 className="font-semibold">Email Address</h3>
                  <p>{policy.emailAddress}</p>
                </div>
              )}
            </Card>

            <Card title="Address Information" size="small">
              {policy.physicalAddress && (
                <div className="mb-4">
                  <h3 className="font-semibold">Physical Address</h3>
                  <p className="whitespace-pre-wrap">
                    {policy.physicalAddress}
                  </p>
                </div>
              )}
              {policy.postalAddress && (
                <div>
                  <h3 className="font-semibold">Postal Address</h3>
                  <p className="whitespace-pre-wrap">{policy.postalAddress}</p>
                </div>
              )}
            </Card>
          </div>

          {/* Right Panel - Additional Information */}
          <div className="space-y-4 p-4">
            <Card title="Agent Information" size="small">
              {policy.agentsName && (
                <div className="mb-4">
                  <h3 className="font-semibold">Agent Name</h3>
                  <p>{policy.agentsName}</p>
                </div>
              )}
              {policy.agentCode && (
                <div className="mb-4">
                  <h3 className="font-semibold">Agent Code</h3>
                  <p>{policy.agentCode}</p>
                </div>
              )}
              {policy.capturerName && (
                <div>
                  <h3 className="font-semibold">Capturer Name</h3>
                  <p>{policy.capturerName}</p>
                </div>
              )}
            </Card>

            <Card title="Policy Settings" size="small">
              <div className="space-y-2">
                {policy.isDebiCheck !== undefined && (
                  <div className="flex items-center justify-between">
                    <span>DebiCheck Enabled</span>
                    <Tag color={policy.isDebiCheck ? "green" : "red"}>
                      {policy.isDebiCheck ? "Yes" : "No"}
                    </Tag>
                  </div>
                )}
                {policy.applicationComplete !== undefined && (
                  <div className="flex items-center justify-between">
                    <span>Application Complete</span>
                    <Tag
                      color={policy.applicationComplete ? "green" : "orange"}
                    >
                      {policy.applicationComplete ? "Yes" : "No"}
                    </Tag>
                  </div>
                )}
              </div>
            </Card>

            {policy.notes && (
              <Card title="Notes" size="small">
                <p className="whitespace-pre-wrap text-sm">{policy.notes}</p>
              </Card>
            )}

            {policy.confidentialNotes && (
              <Card title="Confidential Notes" size="small">
                <p className="whitespace-pre-wrap text-sm text-red-600">
                  {policy.confidentialNotes}
                </p>
              </Card>
            )}
          </div>
        </div>
      ) : (
        <p className="p-4 text-gray-400">Select a policy to view details</p>
      )}

      {/* Payment History Image Modal */}
      {previewImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75">
          <div className="relative max-h-[90vh] max-w-[90vw] overflow-auto rounded-lg bg-white p-4">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold">Payment History</h2>
              <Button onClick={() => setPreviewImage(null)}>Close</Button>
            </div>
            <img
              src={previewImage}
              alt="Payment History"
              className="max-h-full max-w-full object-contain"
            />
          </div>
        </div>
      )}
    </Drawer>
  );
};

export default PolicyDetailsDrawer;
