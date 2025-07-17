import UsersModel from "@/app/models/hr/user.schema";
import { generateTemporaryPassword } from "@/utils/generators/password";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const users = await UsersModel.find().sort({ createdAt: -1 });

  if (!users) {
    return NextResponse.json({ message: "Users not found" }, { status: 404 });
  }

  return NextResponse.json({ users }, { status: 200 });
}

export async function PUT(request: Request) {
  try {
    // Parse the request body
    const body = await request.json();

    const { id, ...rest } = body;

    if (!id) {
      return NextResponse.json(
        { message: "ID is required for update" },
        { status: 400 }
      );
    }

    // Update user by ID
    const updatedUser = await UsersModel.findByIdAndUpdate(id, rest, {
      new: true,
    });

    if (!updatedUser) {
      return NextResponse.json(
        { message: "User not found or update failed" },
        { status: 404 }
      );
    }

    // Return the updated user
    return NextResponse.json({ user: updatedUser }, { status: 200 });
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    // Parse the request body
    const body = await request.json();
    const { name, email, phone, role, roles } = body;

    if (!name || !email || !phone) {
      return NextResponse.json(
        { message: "Name, email, and phone are required" },
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

    // Generate temporary password
    const temporaryPassword = generateTemporaryPassword();

    // Create a new user
    const user = new UsersModel({
      name,
      email,
      phone,
      password: temporaryPassword,
      role: role || "member",
      roles: roles || [],
      status: "Invited",
      mustChangePassword: true
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