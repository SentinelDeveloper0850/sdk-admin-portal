import { NextRequest, NextResponse } from "next/server";

import UsersModel from "@/app/models/auth/user.schema";
import { connectToDatabase } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();

    const { id } = await request.json();

    if (!id) {
      return NextResponse.json({ message: "ID is required" }, { status: 400 });
    }

    const user = await UsersModel.findById(id);
    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    user.deletedAt = undefined;
    user.deletedBy = undefined;
    user.status = "Active";
    await user.save();

    return NextResponse.json(
      { message: "User reactivated", user },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error reactivating user:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
