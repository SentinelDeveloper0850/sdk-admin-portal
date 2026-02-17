// api/auth/login/route.ts
import UserSessionModel from "@/app/models/auth/user-session.schema";
import { connectToDatabase } from "@/lib/db";
import { hashSessionToken } from "@/lib/session-utils";
import { loginUser } from "@/services/auth.service";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    await connectToDatabase();

    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ message: "Email and password are required" }, { status: 400 });
    }

    const result = await loginUser(email, password);

    const response = NextResponse.json({ user: result.user }, { status: 200 });

    // Set auth cookie
    response.cookies.set("auth-token", result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 8,
    });

    // ✅ Create/Upsert server session record keyed by token hash
    const tokenHash = hashSessionToken(result.token);
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 8);

    await UserSessionModel.updateOne(
      { tokenHash },
      {
        $set: {
          userId: result.user.id, // string ok; mongoose will cast
          platform: "WEB",
          expiresAt,
          revokedAt: null,
          revokeReason: null,
          lastSeenAt: new Date(),
        },
        $setOnInsert: {
          mode: "ONSITE",
          activeContext: null,
        },
      },
      { upsert: true }
    );

    return response;
  } catch (error: any) {
    console.error("Login error:", error.message);
    return NextResponse.json({ message: error.message }, { status: 401 });
  }
}
