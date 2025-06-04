"use server";
import { EasypayTransactionModel } from "@/app/models/easypay-transaction.schema";
import { EftTransactionModel } from "@/app/models/eft-transaction.schema";
import { PolicyModel } from "@/app/models/policy.schema";
import { SocietyModel } from "@/app/models/society.schema";
import { UserModel } from "@/app/models/user.schema";
import { connectToDatabase } from "@/lib/db";

export const getDashboardData = async () => {
  try {
    await connectToDatabase();

    const prepaidSocietyCount = await SocietyModel.countDocuments();
    const eftTransactionCount = await EftTransactionModel.countDocuments();
    const easypayTransactionCount = await EasypayTransactionModel.countDocuments();
    const userCount = await UserModel.countDocuments();
    const policyCount = await PolicyModel.countDocuments();

    return {
      success: true,
      data: {
        userCount,
        prepaidSocietyCount,
        eftTransactionCount,
        easypayTransactionCount,
        policyCount
      },
    };
  } catch (error: any) {
    console.error("Error fetching dashboard data:", error.message);
    return {
      success: false,
      message: "Internal Server Error ~ Error fetching dashboard data",
    };
  }
};