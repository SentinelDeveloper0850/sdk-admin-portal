import { NextRequest } from "next/server";

import jwt from "jsonwebtoken";

import UserModel, { IUser } from "@/app/models/hr/user.schema";

const rawSecret = process.env.JWT_SECRET;
const JWT_SECRET: jwt.Secret | null = rawSecret ?? null;
const JWT_ISSUER = "sdk-admin-portal";
const JWT_AUDIENCE = "sdk-admin-portal-web";

export async function getUserFromRequest(req: NextRequest) {
  const token = req.cookies.get("auth-token")?.value;

  if (!token) return null;
  if (!JWT_SECRET) return null;

  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
    }) as jwt.JwtPayload;

    const { userId, role, iat, exp } = decoded;

    const user = (await UserModel.findById(userId)) as IUser;

    return user;
  } catch {
    return null;
  }
}