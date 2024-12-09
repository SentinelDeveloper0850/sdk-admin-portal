import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

import UserModel from "@/app/models/user.schema";

// JWT secret and expiration
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = "1h";

export const loginUser = async (email: string, password: string) => {
  // Find the user by email
  const user = await UserModel.findOne({ email });

  if (!user) {
    throw new Error("Invalid email or password");
  }

  // Compare the provided password with the hashed password in the database
  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    throw new Error("Invalid email or password");
  }

  if (JWT_SECRET) {
    // Generate a JWT token
    const token = jwt.sign({ userId: user._id, role: user.role }, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
    });

    return {
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    };
  } else {
    throw new Error("JWT secret is not set");
  }
};
