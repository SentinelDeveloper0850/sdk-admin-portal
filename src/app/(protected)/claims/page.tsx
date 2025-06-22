"use client";

import { useEffect, useState } from "react";



import { Button, Spinner } from "@nextui-org/react";



import ClaimDetailsDrawer from "@/app/components/claims/claim-details-drawer";
import ClaimsTable from "@/app/components/claims/claims-table";
import NewClaimDrawer from "@/app/components/claims/new-claim-drawer";
import PageHeader from "@/app/components/page-header";


interface Claim {
  _id: string;
  claimantName: string;
  policyId: string;
  status: string;
  createdAt: string;
}

const ClaimsPage = () => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [selectedClaimId, setSelectedClaimId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const loadClaims = async () => {
    setLoading(true);
    const res = await fetch("/api/claims");
    const json = await res.json();

    if (json.success) {
      setClaims(json.claims);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadClaims();
  }, []);

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title="Claims"
        subtitle="View and manage submitted claims"
        actions={[
          <Button key="new" color="primary" onClick={() => setDrawerOpen(true)}>
            New Claim
          </Button>,
        ]}
      />

      {loading ? (
        <Spinner label="Loading claims..." />
      ) : (
        <div>
          {/* 🖥️ Table for desktop and above */}
          <div className="hidden md:block">
            <ClaimsTable claims={claims} onView={setSelectedClaimId} />
          </div>

          {/* 📱 List for mobile */}
          <div className="block space-y-3 md:hidden">
            {claims.map((claim) => (
              <div key={claim._id} className="rounded border p-4 text-sm">
                <div className="font-semibold">{claim.claimantName}</div>
                <div>Policy: {claim.policyId}</div>
                <div>Status: {claim.status}</div>
                <div className="text-xs text-gray-500">
                  {new Date(claim.createdAt).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <NewClaimDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onSubmitted={loadClaims} // 🔁 trigger refresh
      />

      <ClaimDetailsDrawer
        open={!!selectedClaimId}
        onClose={() => {
          setSelectedClaimId(null);
          loadClaims();
        }}
        claimId={selectedClaimId}
      />
    </div>
  );
};

export default ClaimsPage;