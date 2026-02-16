// src/app/api/rn/auth/link/route.ts
import { NextRequest, NextResponse } from "next/server";

import { verifyToken } from "@clerk/backend";

import { AuthIdentityModel } from "@/app/models/auth-identity.schema";
import UserModel from "@/app/models/auth/user.schema";
import { connectToDatabase } from "@/lib/db";

export const runtime = "nodejs"; // important for Mongoose

export async function POST(req: NextRequest) {
  await connectToDatabase();
  try {
    const authz = req.headers.get("authorization") || "";
    const token = authz.startsWith("Bearer ") ? authz.slice(7) : "";
    if (!token)
      return NextResponse.json({ error: "Missing token" }, { status: 401 });

    // Verify the Clerk session token from the mobile app
    const claims: any = await verifyToken(token, {
      // Option A: simplest – rely on issuer lookup from env
      // issuer: process.env.CLERK_JWT_ISSUER, // e.g. https://xxxx.clerk.accounts.dev
      // Option B (optional): constrain further if you want
      // audience: "https://api.sdkadminportal.co.za",           // if you mint tokens with this aud
      // authorizedParties: ["com.sdk.flow"],                    // your mobile bundle id / azp
      // apiKey: process.env.CLERK_SECRET_KEY,                   // if needed for JWKS fallback
    });

    const clerkUserId = claims.sub;
    const email = (claims.email || claims.email_address || "").toLowerCase();
    const provider = claims.external_account?.provider || "clerk";
    const providerUserId =
      claims.external_account?.id ||
      claims["google.sub"] ||
      claims["provider_user_id"];

    // already linked? return the user
    let link = await AuthIdentityModel.findOne({ clerkUserId }).lean();
    if (link) {
      const user = await UserModel.findById(link.userId).lean();
      if (!user || user.status !== "ACTIVE") {
        return NextResponse.json({ error: "User disabled" }, { status: 403 });
      }

      return NextResponse.json({ ok: true, user });
    }

    if (!email)
      return NextResponse.json(
        { error: "No verified email on identity" },
        { status: 403 }
      );

    const existing = await UserModel.findOne({ email }).lean();
    if (!existing)
      return NextResponse.json(
        { error: "Not invited. Contact admin." },
        { status: 403 }
      );
    if (existing.status !== "ACTIVE")
      return NextResponse.json({ error: "User not active" }, { status: 403 });

    await AuthIdentityModel.create({
      userId: existing._id,
      provider,
      providerUserId,
      clerkUserId,
      emailAtLinkTime: email,
      lastLoginAt: new Date(),
    });

    return NextResponse.json({ ok: true, user: existing });
  } catch (e: any) {
    // Handle duplicate key cleanly if you added unique indexes
    if (e?.code === 11000) {
      return NextResponse.json(
        { error: "Identity already linked" },
        { status: 409 }
      );
    }
    console.error(e);
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }
}
