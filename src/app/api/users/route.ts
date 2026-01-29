import UsersModel from "@/app/models/hr/user.schema";
import { connectToDatabase } from "@/lib/db";
import { sendUserInvitationEmail } from "@/lib/email";
import { generateTemporaryPassword } from "@/utils/generators/password";
import { NextRequest, NextResponse } from "next/server";

import { ERoles } from "@/types/roles.enum";

const CONSULTANT_ROLES = [
  ERoles.Admin,
  ERoles.SchemeConsultant,
  ERoles.SchemeConsultantOnline,
  ERoles.SocietyConsultant,
];

const ESCALATION_ROLES = [
  ERoles.Admin,
  ERoles.HRManager,
  ERoles.BranchManager,
  ERoles.RegionalManager,
  ERoles.SchemeConsultant,
  ERoles.SchemeConsultantOnline,
];

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();

    const url = new URL(request.url);
    const deleted = url.searchParams.get("deleted");
    const slim = url.searchParams.get("slim");
    const type = url.searchParams.get("type");
    const onlyDeleted = deleted === "true";

    const query: Record<string, unknown> = onlyDeleted
      ? { deletedAt: { $exists: true } }
      : { deletedAt: { $exists: false } };

    if (type === "consultants") {
      query.roles = { $in: CONSULTANT_ROLES };
      query.status = "Active";
    } else if (type === "escalation") {
      query.roles = { $in: ESCALATION_ROLES };
      query.status = "Active";
    }

    let users = [];

    if (slim) {
      // Select only the _id and name fields, exclude the password field
      users = await UsersModel.find(query)
        .select("_id name email roles")
        .sort({ createdAt: -1 });
    } else {
      users = await UsersModel.find(query).select("-password -deletedAt -deletedBy -updatedAt -createdAt -mustChangePassword").sort({ createdAt: -1 });
    }

    return NextResponse.json(users, { status: 200 });
  } catch (error: any) {
    console.error("Error fetching users:", error.message);
    return NextResponse.json(
      { message: "Error fetching users" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    await connectToDatabase();

    const body = await request.json();

    const { id, ...rest } = body;

    if (!id) {
      return NextResponse.json(
        { message: "ID is required for update" },
        { status: 400 }
      );
    }

    const updatedUser = await UsersModel.findByIdAndUpdate(id, rest, {
      new: true,
    });

    if (!updatedUser) {
      return NextResponse.json(
        { message: "User not found or update failed" },
        { status: 404 }
      );
    }

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
    await connectToDatabase();

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
      if (existingUser.deletedAt) {
        // Reactivate the user instead of creating a new one
        existingUser.deletedAt = undefined;
        existingUser.deletedBy = undefined;
        existingUser.status = "Reinvited";
        existingUser.mustChangePassword = true;
        existingUser.password = generateTemporaryPassword();
        await existingUser.save();

        // Send invitation email for reactivated user
        try {
          await sendUserInvitationEmail({
            to: existingUser.email,
            name: existingUser.name,
            email: existingUser.email,
            temporaryPassword: existingUser.password,
            role: existingUser.role || "member",
            status: existingUser.status,
          });
        } catch (emailError) {
          console.error("Failed to send invitation email:", emailError);
          // Don't fail the request if email fails
        }

        return NextResponse.json(
          { message: "User reactivated successfully", user: existingUser },
          { status: 200 }
        );
      }

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

    // Send invitation email
    try {
      await sendUserInvitationEmail({
        to: user.email,
        name: user.name,
        email: user.email,
        temporaryPassword: temporaryPassword,
        role: user.role || "member",
        status: user.status,
      });
    } catch (emailError) {
      console.error("Failed to send invitation email:", emailError);
      // Don't fail the request if email fails, but log it
      return NextResponse.json(
        {
          message: "User created successfully but failed to send invitation email",
          warning: "Please contact the user directly with their login credentials",
          user
        },
        { status: 201 }
      );
    }

    return NextResponse.json(
      { message: "User created successfully and invitation email sent", user },
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

export async function DELETE(request: Request) {
  try {
    await connectToDatabase();

    const { id, deletedBy } = await request.json();

    if (!id) {
      return NextResponse.json({ message: "ID is required" }, { status: 400 });
    }

    const user = await UsersModel.findByIdAndUpdate(
      id,
      { deletedAt: new Date(), deletedBy: deletedBy || null, status: "Deleted" },
      { new: true }
    );

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "User soft deleted", user }, { status: 200 });
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
