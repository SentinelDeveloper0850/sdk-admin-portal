import UsersModel from "@/app/models/hr/user.schema";
import { getUserFromRequest } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import { sendPasswordResetEmail } from "@/lib/email";
import { generateTemporaryPassword } from "@/utils/generators/password";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();

    // Get the current user to verify admin permissions
    const currentUser = await getUserFromRequest(request);

    if (!currentUser) {
      return NextResponse.json(
        { message: "Unauthorized - Please log in" },
        { status: 401 }
      );
    }

    // Check if the current user is an admin
    if (currentUser.role !== 'admin') {
      return NextResponse.json(
        { message: "Unauthorized - Admin access required" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        { message: "User ID is required" },
        { status: 400 }
      );
    }

    // Find the target user
    const targetUser = await UsersModel.findById(userId);
    if (!targetUser) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 }
      );
    }

    // Prevent admin from resetting another admin's password
    if (targetUser.roles?.includes('admin')) {
      return NextResponse.json(
        { message: "Cannot reset password for admin users" },
        { status: 403 }
      );
    }

    // Generate new temporary password
    const newPassword = generateTemporaryPassword();
    console.log("🚀 ~ POST ~ newPassword:", newPassword)

    // Update user with new password and set mustChangePassword flag
    targetUser.password = newPassword;
    targetUser.mustChangePassword = true;
    await targetUser.save();

    // Send email with new password
    const emailResult = await sendPasswordResetEmail({
      to: targetUser.email,
      name: targetUser.name,
      newPassword: newPassword,
    });

    if (!emailResult.success) {
      console.error('Failed to send password reset email:', emailResult.error);
      return NextResponse.json(
        {
          message: "Password reset successful but failed to send email notification",
          warning: "Please contact the user directly with their new password"
        },
        { status: 200 }
      );
    }

    return NextResponse.json(
      {
        message: "Password reset successful and email sent",
        user: {
          id: targetUser._id,
          name: targetUser.name,
          email: targetUser.email
        }
      },
      { status: 200 }
    );

  } catch (error) {
    console.error("Error resetting password:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
} 