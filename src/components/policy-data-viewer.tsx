"use client";

import { useEffect, useState } from "react";

import {
  PolicyData,
  loadPolicyData,
  validatePolicyData,
} from "@/utils/policy-parser";

export default function PolicyDataViewer() {
  const [policyData, setPolicyData] = useState<PolicyData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validCount, setValidCount] = useState(0);
  const [invalidCount, setInvalidCount] = useState(0);

  const loadData = async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await loadPolicyData();
      setPolicyData(data);

      // Count valid and invalid entries
      let valid = 0;
      let invalid = 0;

      data.forEach((item) => {
        if (validatePolicyData(item)) {
          valid++;
        } else {
          invalid++;
        }
      });

      setValidCount(valid);
      setInvalidCount(invalid);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load policy data"
      );
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    const csvContent = [
      "Policy Number,EasyPay Number",
      ...policyData.map((item) => `${item.policyNumber},${item.easyPayNumber}`),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "policy-data.csv";
    a.click();
    window.URL.revokeObjectURL(url);
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
        <span className="ml-2">Loading policy data...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-2xl rounded-lg border border-red-200 bg-red-50 p-6">
        <div className="flex items-center text-red-600">
          <span>⚠️ Error: {error}</span>
        </div>
        <button
          onClick={loadData}
          className="mt-4 rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="rounded-lg border bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Policy Data Summary</h2>
          <button
            onClick={exportToCSV}
            className="rounded bg-green-600 px-4 py-2 text-white hover:bg-green-700"
          >
            📥 Export CSV
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded bg-blue-50 p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">
              {policyData.length}
            </div>
            <div className="text-sm text-gray-600">Total Records</div>
          </div>
          <div className="rounded bg-green-50 p-4 text-center">
            <div className="text-2xl font-bold text-green-600">
              {validCount}
            </div>
            <div className="text-sm text-gray-600">Valid Records</div>
          </div>
          <div className="rounded bg-red-50 p-4 text-center">
            <div className="text-2xl font-bold text-red-600">
              {invalidCount}
            </div>
            <div className="text-sm text-gray-600">Invalid Records</div>
          </div>
        </div>
      </div>

      <div className="rounded-lg border bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-lg font-semibold">Policy Data Preview</h3>
        <div className="max-h-96 overflow-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-50">
                <th className="border px-4 py-2 text-left">Policy Number</th>
                <th className="border px-4 py-2 text-left">EasyPay Number</th>
                <th className="border px-4 py-2 text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {policyData.slice(0, 20).map((item, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="border px-4 py-2 font-mono">
                    {item.policyNumber}
                  </td>
                  <td className="border px-4 py-2 font-mono">
                    {item.easyPayNumber}
                  </td>
                  <td className="border px-4 py-2">
                    {validatePolicyData(item) ? (
                      <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800">
                        ✅ Valid
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-800">
                        ❌ Invalid
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {policyData.length > 20 && (
          <div className="mt-4 text-center text-sm text-gray-600">
            Showing first 20 of {policyData.length} records
          </div>
        )}
      </div>
    </div>
  );
}
