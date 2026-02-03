import { NextResponse } from "next/server";

import { parsePolicyData } from "@/utils/policy-parser";

import { fetchAllPolicies } from "@/server/actions/easipol-policies";

export async function GET() {
  try {
    // Fetch policy data from file
    const fileResponse = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/file.txt`
    );
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

    // Create comparison results
    const comparison: {
      fileData: { total: number; valid: number; invalid: number };
      databaseData: {
        total: number;
        withEasyPayNumber: number;
        withoutEasyPayNumber: number;
      };
      matches: Array<{
        policyNumber: string;
        easyPayNumber: string;
        status: string;
      }>;
      fileOnly: Array<{
        policyNumber: string;
        easyPayNumber: string;
        status: string;
      }>;
      databaseOnly: Array<{
        policyNumber: string;
        easyPayNumber: string;
        status: string;
      }>;
      mismatches: Array<{
        policyNumber: string;
        fileEasyPayNumber: string;
        dbEasyPayNumber: string;
        status: string;
      }>;
      withoutEasyPay: Array<{
        policyNumber: string;
        fullname: string;
        productName: string;
        memberID: string;
        status: string;
      }>;
    } = {
      fileData: {
        total: filePolicyData.length,
        valid: filePolicyData.filter(
          (item) =>
            item.easyPayNumber.startsWith("9225") &&
            item.easyPayNumber.length === 18 &&
            /^\d{18}$/.test(item.easyPayNumber)
        ).length,
        invalid: filePolicyData.filter(
          (item) =>
            !(
              item.easyPayNumber.startsWith("9225") &&
              item.easyPayNumber.length === 18 &&
              /^\d{18}$/.test(item.easyPayNumber)
            )
        ).length,
      },
      databaseData: {
        total: dbPolicies.length,
        withEasyPayNumber: dbPolicies.filter((policy) => policy.easypayNumber)
          .length,
        withoutEasyPayNumber: dbPolicies.filter(
          (policy) => !policy.easypayNumber
        ).length,
      },
      matches: [],
      fileOnly: [],
      databaseOnly: [],
      mismatches: [],
      withoutEasyPay: [],
    };

    // Create maps for efficient lookup
    const filePolicyMap = new Map();
    const dbPolicyMap = new Map();

    filePolicyData.forEach((item) => {
      filePolicyMap.set(item.policyNumber, item.easyPayNumber);
    });

    dbPolicies.forEach((policy) => {
      dbPolicyMap.set(policy.policyNumber, policy.easypayNumber);
    });

    // Find matches and differences
    const allPolicyNumbers = new Set([
      ...filePolicyMap.keys(),
      ...dbPolicyMap.keys(),
    ]);

    allPolicyNumbers.forEach((policyNumber) => {
      const fileEasyPay = filePolicyMap.get(policyNumber);
      const dbEasyPay = dbPolicyMap.get(policyNumber);

      if (fileEasyPay && dbEasyPay) {
        if (fileEasyPay === dbEasyPay) {
          comparison.matches.push({
            policyNumber,
            easyPayNumber: fileEasyPay,
            status: "match",
          });
        } else {
          comparison.mismatches.push({
            policyNumber,
            fileEasyPayNumber: fileEasyPay,
            dbEasyPayNumber: dbEasyPay,
            status: "mismatch",
          });
        }
      } else if (fileEasyPay && !dbEasyPay) {
        comparison.fileOnly.push({
          policyNumber,
          easyPayNumber: fileEasyPay,
          status: "file_only",
        });
      } else if (!fileEasyPay && dbEasyPay) {
        comparison.databaseOnly.push({
          policyNumber,
          easyPayNumber: dbEasyPay,
          status: "database_only",
        });
      }
    });

    // Find database records without EasyPay numbers
    dbPolicies.forEach((policy) => {
      if (!policy.easypayNumber || policy.easypayNumber.trim() === "") {
        comparison.withoutEasyPay.push({
          policyNumber: policy.policyNumber,
          fullname: policy.fullname,
          productName: policy.productName,
          memberID: policy.memberID,
          status: "no_easypay",
        });
      }
    });

    return NextResponse.json(
      {
        success: true,
        data: comparison,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error in policy reconciliation:", error.message);
    return NextResponse.json(
      { message: "Internal Server Error ~ Error in policy reconciliation" },
      { status: 500 }
    );
  }
}
