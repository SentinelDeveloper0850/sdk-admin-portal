import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import jwt from "jsonwebtoken";

import UsersModel from "@/app/models/hr/user.schema";
import { connectToDatabase } from "@/lib/db";

if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET is not defined in the environment variables.");
}

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_ISSUER = "sdk-admin-portal";
const JWT_AUDIENCE = "sdk-admin-portal-web";

export async function GET() {
  const token = (await cookies()).get("auth-token")?.value;

  if (!token) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
    }) as { userId: string };

    await connectToDatabase();

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
