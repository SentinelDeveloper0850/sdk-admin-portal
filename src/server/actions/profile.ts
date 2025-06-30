"use server";

import { UserModel } from "@/app/models/hr/user.schema";
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
