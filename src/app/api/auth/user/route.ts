import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import UsersModel from "@/app/models/auth/user.schema";
import { connectToDatabase } from "@/lib/db";

const JWT_SECRET = process.env.JWT_SECRET ?? null;
const JWT_ISSUER = "sdk-admin-portal";
const JWT_AUDIENCE = "sdk-admin-portal-web";

export async function GET() {
  if (!JWT_SECRET) {
    return NextResponse.json(
      { message: "Server misconfigured (missing JWT secret)" },
      { status: 500 }
    );
  }

  const token = (await cookies()).get("auth-token")?.value;
  if (!token) {
    return NextResponse.json(
      { message: "Unauthorized", code: "AUTH_MISSING" },
      { status: 401 }
    );
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
    }) as { userId: string };

    await connectToDatabase();

    const user = await UsersModel.findById(decoded.userId).select("-password");
    if (!user) {
      return NextResponse.json(
        { message: "User not found", code: "USER_NOT_FOUND" },
        { status: 404 }
      );
    }

    return NextResponse.json({ user }, { status: 200 });
  } catch (error: any) {
    // ✅ differentiate expiration vs invalid
    if (error?.name === "TokenExpiredError") {
      return NextResponse.json(
        { message: "Session expired. Please sign in again.", code: "AUTH_EXPIRED" },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { message: "Invalid token", code: "AUTH_INVALID" },
      { status: 401 }
    );
  }
}
