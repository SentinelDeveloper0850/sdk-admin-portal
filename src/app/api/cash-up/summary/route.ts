import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const week = searchParams.get("week");

    // In a real implementation, you would:
    // 1. Parse the week parameter
    // 2. Query the database for audits in that week
    // 3. Calculate summary statistics
    // 4. Identify repeat offenders

    // Mock weekly summary data
    const mockSummary = {
      totalStaffAudited: 15,
      fullyBalanced: 12,
      discrepanciesFound: 3,
      nonSubmissions: 2,
      highRiskDiscrepancies: 1,
      repeatOffenders: 2,
      lateSubmissions: 4,
      onTimeSubmissions: 11,
    };

    // Mock repeat offenders data
    const mockRepeatOffenders = [
      {
        employeeId: "emp2",
        employeeName: "Sarah Johnson",
        discrepancyCount: 2,
        lateSubmissionCount: 1,
        totalIssues: 3,
        lastIssueDate: "2024-01-15",
      },
      {
        employeeId: "emp4",
        employeeName: "David Wilson",
        discrepancyCount: 1,
        lateSubmissionCount: 2,
        totalIssues: 3,
        lastIssueDate: "2024-01-14",
      },
    ];

    return NextResponse.json({
      success: true,
      summary: mockSummary,
      repeatOffenders: mockRepeatOffenders,
      week: week,
    });
  } catch (error) {
    console.error("Error fetching weekly summary:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch weekly summary" },
      { status: 500 }
    );
  }
}
