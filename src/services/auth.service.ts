import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

import UsersModel from "@/app/models/hr/user.schema";

// JWT secret and expiration
const JWT_EXPIRES_IN = "8h";
const JWT_ISSUER = "sdk-admin-portal";
const JWT_AUDIENCE = "sdk-admin-portal-web";

export const loginUser = async (email: string, password: string) => {
  const JWT_SECRET = process.env.JWT_SECRET;
  if (!JWT_SECRET) {
    throw new Error("Server misconfigured (missing JWT secret)");
  }

  // Find the user by email
  const user = await UsersModel.findOne({ email });

  if (!user) {
    throw new Error("Invalid email or password");
  }

  // Compare the provided password with the hashed password in the database
  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    throw new Error("Invalid email or password");
  }

  // Check if account is active
  const isActive = user.status === "Active";
  if (!isActive) {
    throw new Error(
      "Account is inactive. Contact your administrator to reactivate your account."
    );
  }

  const userId = (user as { _id: { toString(): string } })._id.toString();

  // Generate a JWT token
  const token = jwt.sign(
    { userId, role: user.role, roles: user.roles },
    JWT_SECRET,
    {
      expiresIn: JWT_EXPIRES_IN,
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
      subject: userId,
    }
  );

  return {
    token,
    user: {
      id: userId,
      name: user.name,
      email: user.email,
      avatarUrl: user.avatarUrl,
      preferences: user.preferences,
      address: user.address,
      phone: user.phone,
      role: user.role,
      roles: user.roles,
      status: user.status,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    },
  };
};

export const sendPasswordResetLink = async (email: string) => {
  // Find the user by email
  const user = await UsersModel.findOne({ email });

  if (!user) {
    throw new Error("Invalid email address provided");
  }
};
