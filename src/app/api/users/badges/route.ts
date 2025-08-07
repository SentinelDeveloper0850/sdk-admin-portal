import UsersModel from "@/app/models/hr/user.schema";
import { connectToDatabase } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    await connectToDatabase();

    const users = await UsersModel.find({ deletedAt: { $exists: false } }).select("_id name avatarUrl");

    return NextResponse.json(users, { status: 200 });
  } catch (error: any) {
    console.error("Error fetching user badges:", error.message);
    return NextResponse.json(
      { message: "Error fetching user badges" },
      { status: 500 }
    );
  }
}