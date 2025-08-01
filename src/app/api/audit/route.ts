import { NextRequest, NextResponse } from "next/server";


// Mock data for development - replace with actual database queries
const mockAudits = [
  {
    _id: "1",
    date: "2024-01-15",
    employeeId: "emp1",
    employeeName: "John Dube",
    batchReceiptTotal: 15000,
    systemBalance: 15000,
    discrepancy: 0,
    status: "Balanced",
    submissionStatus: "Submitted",
    riskLevel: "low",
    submittedAt: "2024-01-15T19:30:00Z",
    reviewedBy: null,
    reviewedAt: null,
    isResolved: false,
    notes: null,
    resolutionNotes: null,
    attachments: ["https://example.com/receipt1.jpg"],
  },
  {
    _id: "2",
    date: "2024-01-15",
    employeeId: "emp2",
    employeeName: "Sarah Johnson",
    batchReceiptTotal: 12000,
    systemBalance: 11500,
    discrepancy: 500,
    status: "Over",
    submissionStatus: "Submitted Late",
    riskLevel: "medium",
    submittedAt: "2024-01-15T20:45:00Z",
    reviewedBy: null,
    reviewedAt: null,
    isResolved: false,
    notes: null,
    resolutionNotes: null,
    attachments: ["https://example.com/receipt2.jpg"],
  },
  {
    _id: "3",
    date: "2024-01-15",
    employeeId: "emp3",
    employeeName: "Mike Smith",
    batchReceiptTotal: 8000,
    systemBalance: 8500,
    discrepancy: -500,
    status: "Short",
    submissionStatus: "Submitted",
    riskLevel: "medium",
    submittedAt: "2024-01-15T18:15:00Z",
    reviewedBy: null,
    reviewedAt: null,
    isResolved: false,
    notes: null,
    resolutionNotes: null,
    attachments: ["https://example.com/receipt3.jpg"],
  },
];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const employeeId = searchParams.get("employeeId");
    const date = searchParams.get("date");

    // Filter audits based on query parameters
    let filteredAudits = mockAudits;

    if (employeeId) {
      filteredAudits = filteredAudits.filter(audit => audit.employeeId === employeeId);
    }

    if (date) {
      filteredAudits = filteredAudits.filter(audit => audit.date === date);
    }

    return NextResponse.json({
      success: true,
      audits: filteredAudits,
    });
  } catch (error) {
    console.error("Error fetching audits:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch audits" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // In a real implementation, you would:
    // 1. Validate the request body
    // 2. Save to database
    // 3. Process OCR if needed
    // 4. Calculate status and risk level

    const newAudit = {
      _id: Date.now().toString(),
      ...body,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return NextResponse.json({
      success: true,
      audit: newAudit,
    });
  } catch (error) {
    console.error("Error creating audit:", error);
    return NextResponse.json(
      { success: false, message: "Failed to create audit" },
      { status: 500 }
    );
  }
} 