import { NextResponse } from "next/server";

import { connectToDatabase } from "@/lib/db";
import { loginUser } from "@/services/auth.service";

export const runtime = "nodejs"; // Use Node.js runtime instead of Edge

export async function POST(request: Request) {
  try {
    await connectToDatabase();

    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { message: "Email and password are required" },
        { status: 400 }
      );
    }

    const result = await loginUser(email, password);

    // Return user and set HttpOnly cookie; do not expose token to client
    const response = NextResponse.json({ user: result.user }, { status: 200 });
    response.cookies.set("auth-token", result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 8,
    });
    return response;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error("Login error:", error.message);
    return NextResponse.json({ message: error.message }, { status: 401 });
  }
}
