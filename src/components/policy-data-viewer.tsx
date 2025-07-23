'use client';

import { loadPolicyData, PolicyData, validatePolicyData } from '@/utils/policy-parser';
import { useEffect, useState } from 'react';

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

      data.forEach(item => {
        if (validatePolicyData(item)) {
          valid++;
        } else {
          invalid++;
        }
      });

      setValidCount(valid);
      setInvalidCount(invalid);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load policy data');
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    const csvContent = [
      'Policy Number,EasyPay Number',
      ...policyData.map(item => `${item.policyNumber},${item.easyPayNumber}`)
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'policy-data.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Loading policy data...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto p-6 border border-red-200 rounded-lg bg-red-50">
        <div className="flex items-center text-red-600">
          <span>⚠️ Error: {error}</span>
        </div>
        <button
          onClick={loadData}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="bg-white border rounded-lg p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Policy Data Summary</h2>
          <button
            onClick={exportToCSV}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            📥 Export CSV
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded">
            <div className="text-2xl font-bold text-blue-600">{policyData.length}</div>
            <div className="text-sm text-gray-600">Total Records</div>
          </div>
          <div className="text-center p-4 bg-green-50 rounded">
            <div className="text-2xl font-bold text-green-600">{validCount}</div>
            <div className="text-sm text-gray-600">Valid Records</div>
          </div>
          <div className="text-center p-4 bg-red-50 rounded">
            <div className="text-2xl font-bold text-red-600">{invalidCount}</div>
            <div className="text-sm text-gray-600">Invalid Records</div>
          </div>
        </div>
      </div>

      <div className="bg-white border rounded-lg p-6 shadow-sm">
        <h3 className="text-lg font-semibold mb-4">Policy Data Preview</h3>
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
                  <td className="border px-4 py-2 font-mono">{item.policyNumber}</td>
                  <td className="border px-4 py-2 font-mono">{item.easyPayNumber}</td>
                  <td className="border px-4 py-2">
                    {validatePolicyData(item) ? (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        ✅ Valid
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
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
          <div className="text-center mt-4 text-sm text-gray-600">
            Showing first 20 of {policyData.length} records
          </div>
        )}
      </div>
    </div>
  );
} 