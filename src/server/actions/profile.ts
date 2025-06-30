"use server";

import { EasypayTransactionModel } from "@/app/models/easypay-transaction.schema";
import { EftTransactionModel } from "@/app/models/eft-transaction.schema";
import { PolicyModel } from "@/app/models/policy.schema";
import { SocietyModel } from "@/app/models/society.schema";
import { UserModel } from "@/app/models/user.schema";
import { connectToDatabase } from "@/lib/db";

export const getProfile = async () => {
  try {
    await connectToDatabase();

    const user = await UserModel.find();

    return {
      success: true,
      data: {},
    };
  } catch (error: any) {
    console.error("Error fetching profile data:", error.message);
    return {
      success: false,
      message: "Internal Server Error ~ Error fetching profile data",
    };
  }
};
