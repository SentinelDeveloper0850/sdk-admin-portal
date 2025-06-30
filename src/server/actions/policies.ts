"use server";

import { PolicyModel } from "@/app/models/scheme/policy.schema";
import { connectToDatabase } from "@/lib/db";

export const fetchAllPolicies = async (page = 1, limit = 0) => {
  try {
    await connectToDatabase();

    const numberOfPolicies = await PolicyModel.countDocuments();
    const policies = await PolicyModel.find()
      .skip((page - 1) * limit)
      .limit(limit)
      .maxTimeMS(60000); // Prevents excessive query times

    return {
      success: true,
      data: {
        count: numberOfPolicies,
        policies: policies,
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

export const searchPolicies = async (
  searchText: string,
  page = 1,
  limit = 100
) => {
  try {
    await connectToDatabase();

    const policies = await PolicyModel.find({
      $or: [
        { policyNumber: { $regex: searchText, $options: "i" } },
        { iDNumber: { $regex: searchText, $options: "i" } },
      ],
    })
      .skip((page - 1) * limit)
      .limit(limit)
      .maxTimeMS(60000); // Prevents excessive query times

    return {
      success: true,
      data: policies,
    };
  } catch (error: any) {
    console.error("Error searching policies:", error.message);
    return {
      success: false,
      message: "Internal Server Error ~ Error searching policies",
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
