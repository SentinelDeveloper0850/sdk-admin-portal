import { NextResponse } from "next/server";

import UsersModel from "@/app/models/user.schema";

export async function GET(request: Request) {
  const users = await UsersModel.find();

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
