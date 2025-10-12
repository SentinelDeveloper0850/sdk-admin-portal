"use server";

import { AssitPolicyModel, IAssitPolicy } from "@/app/models/scheme/assit-policy.schema";
import { connectToDatabase } from "@/lib/db";

export interface IAssitMembersReportItem {
  MembershipID: string; // eg: 11536102031 🗺️ Maps to membershipID
  LastName: string; // eg: Chikwamba 🗺️ Maps to lastName
  Initials: string; // eg: M.C 🗺️ Maps to initials
  DOB: string; // eg: 1958/02/18 00:00:00 🗺️ Maps to dateOfBirth
  EntDate: string; // eg: 2025/03/01 00:00:00 🗺️ Maps to entryDate
  CovDate: string; // eg: 2025/09/01 00:00:00 🗺️ Maps to coverDate
  PayAtNo: string; // eg: 11536102031 🗺️ Maps to payAtNumber
  TotalPremium: string; // eg: R300,00 🗺️ Maps to totalPremiumString
  WPeriod: number; // eg: 6 🗺️ Maps to waitingPeriod
  Category: string; // eg: Family 18-74 🗺️ Maps to category 
}

export const fetchAllPolicies = async (
  page = 1,
  limit = 10,
  sortBy = "policyNumber",
  sortOrder = "asc",
  filters: any = {}
) => {
  try {
    await connectToDatabase();

    // Build filter query
    const filterQuery: any = {};

    if (filters.status) {
      filterQuery.currstatus = { $regex: filters.status, $options: "i" };
    }

    if (filters.productName) {
      filterQuery.productName = { $regex: filters.productName, $options: "i" };
    }

    if (filters.branchName) {
      filterQuery.branchName = { $regex: filters.branchName, $options: "i" };
    }

    if (filters.searchText) {
      filterQuery.$or = [
        { policyNumber: { $regex: filters.searchText, $options: "i" } },
        { payAtNumber: { $regex: filters.searchText, $options: "i" } },
        { memberID: { $regex: filters.searchText, $options: "i" } },
        { fullname: { $regex: filters.searchText, $options: "i" } },
        { iDNumber: { $regex: filters.searchText, $options: "i" } },
        { cellphoneNumber: { $regex: filters.searchText, $options: "i" } },
        { cellNumber: { $regex: filters.searchText, $options: "i" } },
      ];
    }

    // Build sort query
    const sortQuery: any = {};
    sortQuery[sortBy] = sortOrder === "asc" ? 1 : -1;

    const numberOfPolicies = await AssitPolicyModel.countDocuments(filterQuery);
    const policies = await AssitPolicyModel.find(filterQuery)
      .sort(sortQuery)
      .skip((page - 1) * limit)
      .limit(limit)
      .maxTimeMS(60000); // Prevents excessive query times

    return {
      success: true,
      data: {
        policies: policies,
        stats: {
          count: numberOfPolicies,
          page,
          limit,
          totalPages: Math.ceil(numberOfPolicies / limit),
        }
      },
    };
  } catch (error: any) {
    console.error("Error fetching policies:", error.message);
    return {
      success: false,
      message: "Internal Server Error ~ Error fetching policies",
    };
  }
};

export const getFilterOptions = async () => {
  try {
    await connectToDatabase();

    const [statuses, products, branches] = await Promise.all([
      AssitPolicyModel.distinct("currstatus"),
      AssitPolicyModel.distinct("productName"),
      AssitPolicyModel.distinct("branchName"),
    ]);

    return {
      success: true,
      data: {
        statuses: statuses.filter(Boolean).sort(),
        products: products.filter(Boolean).sort(),
        branches: branches.filter(Boolean).sort(),
      },
    };
  } catch (error: any) {
    console.error("Error fetching filter options:", error.message);
    return {
      success: false,
      message: "Internal Server Error ~ Error fetching filter options",
    };
  }
};

export const fetchPolicyById = async (policyId: string) => {
  try {
    await connectToDatabase();

    const policy = await AssitPolicyModel.findById(policyId);

    if (!policy) {
      return {
        success: false,
        message: "Policy not found",
      };
    }

    return {
      success: true,
      data: policy,
    };
  } catch (error: any) {
    console.error("Error fetching policy:", error.message);
    return {
      success: false,
      message: "Internal Server Error ~ Error fetching policy",
    };
  }
};

export const deletePolicyById = async (policyId: string) => {
  try {
    await connectToDatabase();

    const policy = await AssitPolicyModel.findByIdAndDelete(policyId);

    if (!policy) {
      return {
        success: false,
        message: "Policy not found",
      };
    }

    return {
      success: true,
      data: policy,
    };
  } catch (error: any) {
    console.error("Error deleting policy:", error.message);
    return {
      success: false,
      message: "Internal Server Error ~ Error deleting policy",
    };
  }
};

export const importPolicies = async (assitRecords: IAssitMembersReportItem[]) => {
  if (!assitRecords || assitRecords.length < 1) {
    return {
      success: false,
      message: "No policies to import from ASSIT Report Records",
    };
  }

  await connectToDatabase();

  try {
    const memberIds = assitRecords.map((record) => record.MembershipID);
    const existingPolicies = await AssitPolicyModel.find({
      membershipID: { $in: memberIds },
    });
    const existingMemberIds = existingPolicies.map((policy) => policy.membershipID);

    const skippedRecords = assitRecords.filter((record) => existingMemberIds.includes(record.MembershipID));
    const recordsToImport = assitRecords.filter((record) => !existingMemberIds.includes(record.MembershipID)).map((record) => {
      // Convert TotalPremium to number with 2 decimal places (from R3,000,00 to 3000.00)
      const totalPremium = Number(record.TotalPremium.replace("R", "").replace(/,/g, ".").replaceAll(",", "").replace(" ", "")).toFixed(2);
      // Convert WPeriod to number
      const waitingPeriod = Number(record.WPeriod);
      // Convert EntDate to Date
      const entryDate = new Date(record.EntDate);
      // Convert CovDate to Date
      const coverDate = new Date(record.CovDate);
      return {
        ...record,
        membershipID: record.MembershipID,
        lastName: record.LastName,
        initials: record.Initials,
        dateOfBirth: record.DOB,
        entryDate: entryDate,
        coverDate: coverDate,
        payAtNumber: record.PayAtNo,
        totalPremiumString: record.TotalPremium,
        totalPremium: totalPremium,
        waitingPeriod: waitingPeriod,
        category: record.Category,
      };
    });

    // Import the records that are not already in the database in a batch, return imported records
    const importedPolicies: IAssitPolicy[] = await AssitPolicyModel.insertMany(recordsToImport);

    return {
      success: true,
      data: {
        importedPolicies,
        skippedRecords,
      },
    };
  } catch (error: any) {
    console.error("Error importing ASSIT policies:", error.message);
    return {
      success: false,
      message: "Internal Server Error ~ Error importing ASSIT policies",
      error: error.message,
    };
  }
};
