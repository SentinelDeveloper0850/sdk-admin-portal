"use server";

import { PolicyModel } from "@/app/models/scheme/policy.schema";
import { connectToDatabase } from "@/lib/db";

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
        {
          linkedEasipolPolicyNumber: {
            $regex: filters.searchText,
            $options: "i",
          },
        },
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

    const numberOfPolicies = await PolicyModel.countDocuments(filterQuery);
    const policies = await PolicyModel.find(filterQuery)
      .sort(sortQuery)
      .skip((page - 1) * limit)
      .limit(limit)
      .maxTimeMS(60000); // Prevents excessive query times

    return {
      success: true,
      data: {
        count: numberOfPolicies,
        policies: policies,
        page,
        limit,
        totalPages: Math.ceil(numberOfPolicies / limit),
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
      PolicyModel.distinct("currstatus"),
      PolicyModel.distinct("productName"),
      PolicyModel.distinct("branchName"),
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

    const policy = await PolicyModel.findById(policyId);

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

    const policy = await PolicyModel.findByIdAndDelete(policyId);

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

export const importPolicy = async (policyData: any) => {
  await connectToDatabase();

  try {
    const existingPolicy = await PolicyModel.findOne({
      policyNumber: policyData.policyNumber,
    });

    if (existingPolicy) {
      return {
        success: false,
        message: "Policy already exists with this Policy Number.",
      };
    }

    const newPolicy = new PolicyModel(policyData);
    await newPolicy.save();

    return {
      success: true,
      data: newPolicy,
    };
  } catch (error: any) {
    console.error("Error importing policy:", error.message);
    return {
      success: false,
      message: "Internal Server Error ~ Error importing policy",
    };
  }
};

const BATCH_SIZE = Number(process.env.BATCH_SIZE || 500);

function isValidDate(value: Date) {
  return value instanceof Date && !isNaN(value.getTime());
}

export const updateInceptionDates = async () => {
  try {
    await connectToDatabase();

    console.log("🔗 Connected to MongoDB");

    // Target only documents where inceptionDate is stored as a string
    // and where inceptionDateString is missing or empty.
    const filter = {
      $and: [
        { inceptionDate: { $type: "string" } },
        {
          $or: [
            { inceptionDateString: { $exists: false } },
            { inceptionDateString: null },
            { inceptionDateString: "" },
          ],
        },
      ],
    };

    const totalToProcess = await PolicyModel.countDocuments(filter);
    if (totalToProcess === 0) {
      console.log("✅ No policies to update.");
      return;
    }

    console.log(`🔎 Found ${totalToProcess} policies to update`);

    let processed = 0;
    let updated = 0;
    let skipped = 0;

    const cursor = PolicyModel.find(filter)
      .select({ policyNumber: 1, inceptionDate: 1, inceptionDateString: 1 })
      .lean()
      .cursor();

    let bulkOps: any[] = [];

    for await (const doc of cursor) {
      processed += 1;

      const originalValue = (doc as any).inceptionDate as unknown as
        | string
        | null
        | undefined;
      const stringValue = (originalValue ?? "").toString().trim();

      if (!stringValue) {
        skipped += 1;
        continue;
      }

      const parsed = new Date(stringValue);
      const updateSet: Record<string, unknown> = {
        inceptionDateString: stringValue,
      };

      if (isValidDate(parsed)) {
        updateSet.inceptionDate = parsed;
      } else {
        // If parsing fails, keep the original string in inceptionDateString and skip changing inceptionDate
        skipped += 1;
      }

      bulkOps.push({
        updateOne: {
          filter: { _id: (doc as any)._id },
          update: { $set: updateSet },
        },
      });

      if (bulkOps.length >= BATCH_SIZE) {
        const res = await PolicyModel.bulkWrite(bulkOps, { ordered: false });
        updated += (res.modifiedCount || 0) + (res.upsertedCount || 0);
        bulkOps = [];
        console.log(
          `➡️  Progress: ${processed}/${totalToProcess} processed, ${updated} updated, ${skipped} skipped`
        );
      }
    }

    if (bulkOps.length > 0) {
      const res = await PolicyModel.bulkWrite(bulkOps, { ordered: false });
      updated += (res.modifiedCount || 0) + (res.upsertedCount || 0);
    }

    console.log(
      `🎉 Complete. Processed: ${processed}, Updated: ${updated}, Skipped: ${skipped}`
    );

    updateInceptionDates().catch((err) => {
      console.error("❌ Update inception dates failed:", err);
      process.exit(1);
    });

    return {
      success: true,
      message: "Inception dates updated successfully",
    };
  } catch (error: any) {
    console.error("Error updating inception dates:", error.message);
    return {
      success: false,
      message: "Internal Server Error ~ Error updating inception dates",
    };
  }
};
