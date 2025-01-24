import { NextResponse } from "next/server";

import jwt from "jsonwebtoken";

import UsersModel from "@/app/models/user.schema";

if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET is not defined in the environment variables.");
}

const JWT_SECRET = process.env.JWT_SECRET;

export async function GET(request: Request) {
  const authHeader = request.headers.get("Authorization");
  const token = authHeader?.replace("Bearer ", "");

  if (!token) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    // Verify the token
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };

    // Fetch user details from the database
    const user = await UsersModel.findById(decoded.userId).select("-password");
    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ user }, { status: 200 });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error("Error verifying token:", error.message);
    return NextResponse.json({ message: "Invalid token" }, { status: 401 });
  }
}
