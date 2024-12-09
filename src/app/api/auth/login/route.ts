import { NextResponse } from "next/server";

import { connectToDatabase } from "@/lib/db";
import { loginUser } from "@/services/auth.service";

export const runtime = "nodejs"; // Use Node.js runtime instead of Edge

export async function POST(request: Request) {
  try {
    // Ensure the database connection is established
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
    return NextResponse.json(result, { status: 200 });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error("Login error:", error.message);
    return NextResponse.json({ message: error.message }, { status: 401 });
  }
}
