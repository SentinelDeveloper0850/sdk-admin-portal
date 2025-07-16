"use server"

import { IPolicySignUp, PolicySignUpModel } from "@/app/models/scheme/policy-signup-request.schema";
import { connectToDatabase } from "@/lib/db";

export const getPolicySignups = async () => {
  try {
    await connectToDatabase();

    const numberOfRequests = await PolicySignUpModel.countDocuments();
    const docs: IPolicySignUp[] = await PolicySignUpModel.find();

    return {
      success: true,
      data: {
        count: numberOfRequests,
        requests: docs,
      }
    };
  } catch (error: any) {
    console.error("🚀 ~ getPolicySignups ~ error:", error);
    return {
      success: false,
      error: error.message || "Unknown error occurred",
    };
  }
};
