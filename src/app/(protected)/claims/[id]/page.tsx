"use client";

import React from "react";

import PageHeader from "@/app/components/page-header";

const ClaimDetailPage = ({ params }: { params: { id: string } }) => {
  const { id } = params;

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title={`Claim #${id}`}
        subtitle="Track status, documents, and communication"
      />
      {/* TODO: Claim status, timeline, documents, notes, comments */}
    </div>
  );
};

export default ClaimDetailPage;
