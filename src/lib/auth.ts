import UserModel, { IUser } from "@/app/models/user.schema";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers"; // built-in for App Router
import { NextRequest } from "next/server";

export async function getUserFromRequest(req: NextRequest) {
  const token = req.cookies.get("auth-token")?.value;
  console.log("🚀 ~ getUserFromRequest ~ req.cookies:", req.cookies)
  console.log("🚀 ~ getUserFromRequest ~ token:", token)

  if (!token) return null;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as jwt.JwtPayload;

    const { userId, role, iat, exp } = decoded;
    console.log("🚀 ~ getUserFromRequest ~ userId:", userId)
    console.log("🚀 ~ getUserFromRequest ~ exp:", exp)
    console.log("🚀 ~ getUserFromRequest ~ iat:", iat)
    console.log("🚀 ~ getUserFromRequest ~ role:", role)

    const user = await UserModel.findById(userId) as IUser;

    return user;
  } catch {
    return null;
  }
}
