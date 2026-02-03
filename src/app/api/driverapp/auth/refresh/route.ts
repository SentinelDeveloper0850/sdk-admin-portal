import { NextResponse } from "next/server";

import bcrypt from "bcrypt";

import { DriverTrustedDeviceModel } from "@/app/models/drivers/driver-trusted-device.schema";
import { connectToDatabase } from "@/lib/db";
import {
  ACCESS_TTL_SECONDS,
  signDriverAccessToken,
  signDriverRefreshToken,
  verifyDriverRefreshToken,
} from "@/lib/driverapp-auth";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const refreshToken = String(body?.refreshToken ?? "").trim();
    const deviceId = String(body?.deviceId ?? "").trim();

    if (!refreshToken || !deviceId) {
      return NextResponse.json(
        { error: "Missing refreshToken or deviceId" },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const decoded = verifyDriverRefreshToken(refreshToken);
    const driverId = decoded?.sub;

    if (
      !driverId ||
      decoded?.deviceId !== deviceId ||
      decoded?.typ !== "refresh"
    ) {
      return NextResponse.json(
        { error: "Invalid refresh token" },
        { status: 401 }
      );
    }

    const device = await DriverTrustedDeviceModel.findOne({ deviceId });
    if (!device || device.revokedAt) {
      return NextResponse.json({ error: "Device revoked" }, { status: 401 });
    }

    // Compare presented refresh token with stored hash
    const ok = await bcrypt.compare(refreshToken, device.refreshTokenHash);
    if (!ok) {
      // Token reuse / theft scenario → revoke device hard
      await DriverTrustedDeviceModel.updateOne(
        { deviceId },
        {
          $set: {
            revokedAt: new Date(),
            revokeReason: "refresh_token_mismatch",
          },
        }
      );
      return NextResponse.json(
        { error: "Invalid refresh token" },
        { status: 401 }
      );
    }

    // Rotate refresh token
    const newAccessToken = signDriverAccessToken({
      sub: String(driverId),
      role: "DRIVER",
      deviceId,
    });

    const newRefreshToken = signDriverRefreshToken({
      sub: String(driverId),
      deviceId,
      typ: "refresh",
    });

    const newRefreshTokenHash = await bcrypt.hash(newRefreshToken, 10);

    await DriverTrustedDeviceModel.updateOne(
      { deviceId },
      {
        $set: {
          refreshTokenHash: newRefreshTokenHash,
          lastSeenAt: new Date(),
        },
      }
    );

    return NextResponse.json({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      expiresIn: ACCESS_TTL_SECONDS,
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: "Server error", detail: e?.message ?? "unknown" },
      { status: 500 }
    );
  }
}
