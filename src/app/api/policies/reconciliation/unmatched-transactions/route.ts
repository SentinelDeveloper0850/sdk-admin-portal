import { fetchAll } from "@/server/actions/easypay-transactions";
import { fetchAllPolicies } from "@/server/actions/policies";
import { parsePolicyData } from "@/utils/policy-parser";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '50');
    const skip = (page - 1) * pageSize;

    // Fetch EasyPay transactions without policy numbers with pagination
    const easypayResponse = await fetchAll(); // No limit for full reconciliation
    if (!easypayResponse.success) {
      return NextResponse.json(
        { message: "Failed to fetch EasyPay transactions" },
        { status: 500 }
      );
    }

    const easypayTransactions = easypayResponse.data?.transactions || [];
    const unmatchedTransactions = easypayTransactions.filter(
      (tx: any) => !tx.policyNumber || tx.policyNumber.trim() === ''
    );

    // Apply pagination to unmatched transactions
    const totalUnmatched = unmatchedTransactions.length;
    const paginatedUnmatched = unmatchedTransactions.slice(skip, skip + pageSize);

    // Fetch policy data from file
    const fileResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/file.txt`);
    if (!fileResponse.ok) {
      return NextResponse.json(
        { message: "Failed to load policy file" },
        { status: 500 }
      );
    }
    const fileContent = await fileResponse.text();
    const filePolicyData = parsePolicyData(fileContent);

    // Fetch policies from database
    const dbResponse = await fetchAllPolicies();
    if (!dbResponse.success) {
      return NextResponse.json(
        { message: "Failed to fetch database policies" },
        { status: 500 }
      );
    }

    const dbPolicies = dbResponse.data?.policies || [];

    // Create maps for efficient lookup
    const filePolicyMap = new Map();
    const dbPolicyMap = new Map();

    filePolicyData.forEach(item => {
      filePolicyMap.set(item.easyPayNumber, item.policyNumber);
    });

    dbPolicies.forEach(policy => {
      if (policy.easypayNumber) {
        dbPolicyMap.set(policy.easypayNumber, {
          policyNumber: policy.policyNumber,
          fullname: policy.fullname,
          productName: policy.productName,
          memberID: policy.memberID
        });
      }
    });

    // Attempt to match paginated unmatched transactions
    const matchedResults = paginatedUnmatched.map(transaction => {
      const easypayNumber = transaction.easypayNumber;
      const fileMatch = filePolicyMap.get(easypayNumber);
      const dbMatch = dbPolicyMap.get(easypayNumber);

      let matchStatus = 'no_match';
      let matchedPolicy = null;
      let matchSource = null;

      if (fileMatch && dbMatch) {
        matchStatus = 'both_match';
        matchedPolicy = {
          policyNumber: fileMatch,
          fullname: dbMatch.fullname,
          productName: dbMatch.productName,
          memberID: dbMatch.memberID
        };
        matchSource = 'file_and_database';
      } else if (fileMatch) {
        matchStatus = 'file_match';
        matchedPolicy = {
          policyNumber: fileMatch,
          fullname: null,
          productName: null,
          memberID: null
        };
        matchSource = 'file_only';
      } else if (dbMatch) {
        matchStatus = 'database_match';
        matchedPolicy = {
          policyNumber: dbMatch.policyNumber,
          fullname: dbMatch.fullname,
          productName: dbMatch.productName,
          memberID: dbMatch.memberID
        };
        matchSource = 'database_only';
      }

      return {
        transaction: {
          _id: transaction._id,
          uuid: transaction.uuid,
          date: transaction.date,
          amount: transaction.amount,
          easypayNumber: transaction.easypayNumber,
          description: transaction.description || '',
          additionalInformation: transaction.additionalInformation || ''
        },
        matchStatus,
        matchedPolicy,
        matchSource
      };
    });

    // Group results by match status
    const results = {
      unmatchedTransactions: {
        total: totalUnmatched,
        withFileMatch: matchedResults.filter(r => r.matchStatus === 'file_match' || r.matchStatus === 'both_match').length,
        withDatabaseMatch: matchedResults.filter(r => r.matchStatus === 'database_match' || r.matchStatus === 'both_match').length,
        withBothMatches: matchedResults.filter(r => r.matchStatus === 'both_match').length,
        noMatch: matchedResults.filter(r => r.matchStatus === 'no_match').length,
      },
      matches: matchedResults.filter(r => r.matchStatus !== 'no_match'),
      noMatches: matchedResults.filter(r => r.matchStatus === 'no_match'),
      allResults: matchedResults,
      pagination: {
        current: page,
        pageSize: pageSize,
        total: totalUnmatched,
        totalPages: Math.ceil(totalUnmatched / pageSize)
      }
    };

    return NextResponse.json({
      success: true,
      data: results
    }, { status: 200 });

  } catch (error: any) {
    console.error("Error in unmatched transactions reconciliation:", error.message);
    return NextResponse.json(
      { message: "Internal Server Error ~ Error in unmatched transactions reconciliation" },
      { status: 500 }
    );
  }
} 