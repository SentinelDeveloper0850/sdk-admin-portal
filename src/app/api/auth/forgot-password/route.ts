import { NextResponse } from "next/server";

import { connectToDatabase } from "@/lib/db";
import { sendPasswordResetLink } from "@/services/auth.service";

export const runtime = "nodejs"; // Use Node.js runtime instead of Edge

export async function POST(request: Request) {
  try {
    await connectToDatabase();

    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { message: "Email is required" },
        { status: 400 }
      );
    }

    const result = await sendPasswordResetLink(email);
    return NextResponse.json(result, { status: 200 });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error("Forgot password error:", error.message);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
