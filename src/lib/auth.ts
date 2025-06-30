import { NextRequest } from "next/server";

import jwt from "jsonwebtoken";

import UserModel, { IUser } from "@/app/models/hr/user.schema";

export async function getUserFromRequest(req: NextRequest) {
  const token = req.cookies.get("auth-token")?.value;

  if (!token) return null;

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET!
    ) as jwt.JwtPayload;

    const { userId, role, iat, exp } = decoded;

    const user = (await UserModel.findById(userId)) as IUser;

    return user;
  } catch {
    return null;
  }
}
