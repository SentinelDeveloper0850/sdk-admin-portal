"use server";

import {
  AssitPolicyModel
} from "@/app/models/scheme/assit-policy.schema";
import { PolicyModel } from "@/app/models/scheme/policy.schema";
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
  sortBy = "membershipID",
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
        { membershipID: { $regex: filters.searchText, $options: "i" } },
        { payAtNumber: { $regex: filters.searchText, $options: "i" } },
        { fullName: { $regex: filters.searchText, $options: "i" } },
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
        },
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

type AnyIncoming = Partial<IAssitMembersReportItem> & {
  membershipID?: string;
  lastName?: string;
  initials?: string;
  dateOfBirth?: string;
  entryDate?: string | Date;
  coverDate?: string | Date;
  payAtNumber?: string;
  totalPremium?: string | number;
  waitingPeriod?: string | number;
  category?: string;
};

function normalizeIncomingRecord(r: AnyIncoming): IAssitMembersReportItem {
  // If it already looks like raw ASSIT, keep it
  if (r.MembershipID) return r as IAssitMembersReportItem;

  // Otherwise map from your client shape -> raw shape
  return {
    MembershipID: String(r.membershipID ?? "").trim(),
    LastName: String(r.lastName ?? "").trim(),
    Initials: String(r.initials ?? "").trim(),
    DOB: String(r.dateOfBirth ?? "").trim(),
    EntDate: String(r.entryDate ?? "").trim(),
    CovDate: String(r.coverDate ?? "").trim(),
    PayAtNo: String(r.payAtNumber ?? r.membershipID ?? "").trim(),
    TotalPremium: String(r.totalPremium ?? "").trim(),
    WPeriod: Number(r.waitingPeriod ?? 0),
    Category: String(r.category ?? "").trim(),
  };
}

export const importPolicies = async (assitRecords: AnyIncoming[]) => {
  if (!assitRecords?.length) {
    return { success: false, message: "No policies to import from ASSIT Report Records" };
  }

  await connectToDatabase();

  try {
    const normalized = assitRecords.map(normalizeIncomingRecord);

    // (optional) validate the essentials so you fail gracefully instead of 500
    const invalid = normalized.filter(r => !r.MembershipID || !r.LastName || !r.Initials);
    if (invalid.length) {
      return { success: false, message: `Invalid records: ${invalid.length}` };
    }

    const memberIds = normalized.map((r) => r.MembershipID);

    const existingPolicies = await AssitPolicyModel.find({
      membershipID: { $in: memberIds },
    });

    const existingMemberIds = new Set(existingPolicies.map(p => p.membershipID));

    const skippedRecords = normalized.filter(r => existingMemberIds.has(r.MembershipID));

    const recordsToImport = normalized
      .filter(r => !existingMemberIds.has(r.MembershipID))
      .map((record) => {
        const totalPremium = Number(
          String(record.TotalPremium)
            .replace("R", "")
            .replace(/\s/g, "")
            // handle "300,00" vs "3,000.00" without guessing wrong
            .replace(/\.(?=\d{3}\b)/g, "") // remove thousand dots if present
            .replace(/,(?=\d{2}\b)/g, ".") // cents comma -> dot
            .replace(/,/g, "")            // remaining commas -> nothing
        );

        return {
          ...record,
          membershipID: record.MembershipID,
          lastName: record.LastName,
          initials: record.Initials,
          dateOfBirth: record.DOB,
          entryDate: new Date(record.EntDate),
          coverDate: new Date(record.CovDate),
          payAtNumber: record.PayAtNo,
          totalPremiumString: record.TotalPremium,
          totalPremium: Number.isFinite(totalPremium) ? totalPremium : 0,
          waitingPeriod: Number(record.WPeriod) || 0,
          category: record.Category,
        };
      });

    const importedPolicies = await AssitPolicyModel.insertMany(recordsToImport);

    return { success: true, data: { importedPolicies, skippedRecords } };
  } catch (error: any) {
    console.error("Error importing ASSIT policies:", error.message);
    return { success: false, message: "Internal Server Error ~ Error importing ASSIT policies", error: error.message };
  }
};


export const linkPolicy = async (payload: any) => {
  try {
    await connectToDatabase();

    const { assitPolicyId, easipolPolicyId } = payload;

    const assitPolicy = await AssitPolicyModel.findById(assitPolicyId);
    const easipolPolicy = await PolicyModel.findById(easipolPolicyId);

    if (!assitPolicy || !easipolPolicy) {
      return {
        success: false,
        message:
          "ASSIT policy or Easipol policy not found ~ Error linking Easipol policy to ASSIT policy",
      };
    }

    await AssitPolicyModel.findByIdAndUpdate(assitPolicyId, {
      linkedEasipolPolicyId: easipolPolicyId,
      linkedEasipolPolicyNumber: easipolPolicy.policyNumber,
      hasLinkedEasipolPolicy: true,
    });

    return {
      success: true,
      message: "Easipol policy linked to ASSIT policy successfully",
      data: assitPolicy,
    };
  } catch (error: any) {
    console.error(
      "Error linking Easipol policy to ASSIT policy:",
      error.message
    );
    return {
      success: false,
      message:
        "Internal Server Error ~ Error linking Easipol policy to ASSIT policy",
    };
  }
};
