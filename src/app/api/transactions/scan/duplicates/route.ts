import { IAllocationRequest } from "@/app/models/hr/allocation-request.schema";
import { connectToDatabase } from "@/lib/db";
import dayjs from "dayjs";
import { NextRequest, NextResponse } from "next/server";


export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { allocationRequests, receiptsFromASSIT } = body as { allocationRequests: IAllocationRequest[], receiptsFromASSIT: any[] };

    const metadata = {
      failedRequests: 0,
      duplicateRequests: 0,
      importRequests: 0,
      totalRequests: 0,
      requestsWithoutTransactions: 0,
      requestsToScan: 0,
      receiptsFromASSIT: 0,
    }

    if (!allocationRequests) {
      return NextResponse.json({ message: "Allocation requests are required" }, { status: 400 });
    }

    metadata.totalRequests = allocationRequests.length;

    if (!receiptsFromASSIT) {
      return NextResponse.json({ message: "Receipts from ASSIT are required" }, { status: 400 });
    }

    metadata.receiptsFromASSIT = receiptsFromASSIT.length;

    const failedRequests: IAllocationRequest[] = [];
    const duplicateRequests: IAllocationRequest[] = [];
    const importRequests: IAllocationRequest[] = [];

    // Get all allocation requests that have no transactions attached to them
    const requestsWithoutTransactions = allocationRequests.filter((request) => !request.transaction);
    failedRequests.push(...requestsWithoutTransactions);
    metadata.requestsWithoutTransactions = requestsWithoutTransactions.length;

    // Requests to scan for duplicates
    const requestsToScan = allocationRequests.filter((request) => request.transaction);
    metadata.requestsToScan = requestsToScan.length;

    await connectToDatabase();

    for (const request of requestsToScan) {
      const { duplicate, failed, importToASSIT } = await scanForDuplicates(request, receiptsFromASSIT);

      if (duplicate) {
        duplicateRequests.push(request);
        metadata.duplicateRequests++;
      }
      if (importToASSIT) {
        importRequests.push(request);
        metadata.importRequests++;
      }
      if (failed) {
        failedRequests.push(request);
        metadata.failedRequests++;
      }
    }

    return NextResponse.json({ message: "Duplicates scanned successfully", failedRequests, duplicateRequests, importRequests, stats: metadata }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: "Internal Server Error ~ Scan duplicates" }, { status: 500 });
  }
}

async function scanForDuplicates(request: IAllocationRequest, receiptsFromASSIT: any[]) {
  try {
    if (!request.transaction) {
      return { duplicate: false, failed: true, importToASSIT: false };
    }

    // Reduce receiptsFromASSIT to only include receipts that match the policy number
    const receiptsMatchingPolicyNumber = receiptsFromASSIT.filter((receipt) => {
      const receiptPolicyNumber = receipt['MembershipID'] || receipt['membership_id'] || receipt['Membership ID'];
      return receiptPolicyNumber === request.policyNumber;
    });

    if (receiptsMatchingPolicyNumber.length < 1) {
      return { duplicate: false, failed: false, importToASSIT: true };
    }

    // Reduce receiptsMatchingPolicyNumber to only include receipts that match the date using dayjs
    const receiptsMatchingPolicyNumberAndDate = receiptsMatchingPolicyNumber.filter((receipt) => {
      const receiptDate: string = receipt['Effective Date'] || receipt['effective_date'] || receipt['EffectiveDate'];
      return dayjs(receiptDate).isSame(request.transaction.date, 'day');
    });

    if (receiptsMatchingPolicyNumberAndDate.length > 0) {
      return { duplicate: true, failed: false, importToASSIT: false };
    }

    return { duplicate: false, failed: false, importToASSIT: true };
  } catch (error) {
    return { duplicate: false, failed: true, importToASSIT: false };
  }
}
