import { NextResponse } from "next/server";

import UserModel from "@/app/models/user.schema";

export async function GET(request: Request) {

  const users = await UserModel.find().select("-password");

  if (!users) {
    return NextResponse.json({ message: "Users not found" }, { status: 404 });
  }

  return NextResponse.json({ users }, { status: 200 });
}
