import { NextResponse } from "next/server";

import UsersModel from "@/app/models/user.schema";
import { connectToDatabase } from "@/lib/db";

export async function POST(request: Request) {
  try {
    // Ensure database connection
    await connectToDatabase();

    // Parse the request body
    const body = await request.json();
    const { name, email, password, role } = body;

    if (!name || !email || !password) {
      return NextResponse.json(
        { message: "Name, email, and password are required" },
        { status: 400 }
      );
    }

    // Check if the user already exists
    const existingUser = await UsersModel.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { message: "User already exists" },
        { status: 400 }
      );
    }

    // Create a new user
    const user = new UsersModel({
      name,
      email,
      password, // Password hashing is handled in the schema pre-save hook
      role: role || "user", // Default to 'user'
    });
    await user.save();

    return NextResponse.json(
      { message: "User created successfully", user },
      { status: 201 }
    );
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error("Error creating user:", error.message);
    return NextResponse.json(
      { message: "Error creating user" },
      { status: 500 }
    );
  }
}
