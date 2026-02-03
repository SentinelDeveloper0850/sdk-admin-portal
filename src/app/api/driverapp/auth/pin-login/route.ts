import { NextResponse } from "next/server";

import bcrypt from "bcrypt";
import crypto from "crypto";

import { DriverTrustedDeviceModel } from "@/app/models/drivers/driver-trusted-device.schema";
import { DriverModel } from "@/app/models/drivers/driver.schema";
import { connectToDatabase } from "@/lib/db";
import {
  ACCESS_TTL_SECONDS,
  signDriverAccessToken,
  signDriverRefreshToken,
} from "@/lib/driverapp-auth";

const MAX_FAILED_ATTEMPTS = 5;
const LOCK_MINUTES = 10;

function lockUntil(minutes: number) {
  return new Date(Date.now() + minutes * 60 * 1000);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const driverIdentifier = String(body?.driverIdentifier ?? "").trim();
    const pin = String(body?.pin ?? "").trim();
    const device = body?.device ?? {};

    if (!driverIdentifier || !pin) {
      return NextResponse.json(
        { error: "Missing driverIdentifier or pin" },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const driver = await DriverModel.findOne({
      driverCode: driverIdentifier,
      active: true,
    });
    if (!driver || !driver.pinHash) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    // Lockout check
    if (driver.pinLockedUntil && new Date(driver.pinLockedUntil) > new Date()) {
      return NextResponse.json(
        { error: "PIN locked. Try again later." },
        { status: 429 }
      );
    }

    // Optional expiry check
    if (driver.pinExpiresAt && new Date(driver.pinExpiresAt) < new Date()) {
      return NextResponse.json(
        { error: "PIN expired. Contact office." },
        { status: 401 }
      );
    }

    const ok = await bcrypt.compare(pin, driver.pinHash);
    if (!ok) {
      const attempts = (driver.pinFailedAttempts ?? 0) + 1;

      const updates: any = { pinFailedAttempts: attempts };
      if (attempts >= MAX_FAILED_ATTEMPTS) {
        updates.pinLockedUntil = lockUntil(LOCK_MINUTES);
      }

      await DriverModel.updateOne({ _id: driver._id }, { $set: updates });

      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    // Reset failed attempts on success
    await DriverModel.updateOne(
      { _id: driver._id },
      { $set: { pinFailedAttempts: 0, pinLockedUntil: null } }
    );

    // Create trusted device + tokens
    const deviceId = crypto.randomUUID();

    const accessToken = signDriverAccessToken({
      sub: String(driver._id),
      role: "DRIVER",
      deviceId,
    });

    const refreshToken = signDriverRefreshToken({
      sub: String(driver._id),
      deviceId,
      typ: "refresh",
    });

    const refreshTokenHash = await bcrypt.hash(refreshToken, 10);

    await DriverTrustedDeviceModel.create({
      driverId: driver._id,
      deviceId,
      refreshTokenHash,
      device: {
        platform: String(device?.platform ?? "unknown"),
        model: String(device?.model ?? "unknown"),
        appVersion: String(device?.appVersion ?? "unknown"),
      },
      firstSeenAt: new Date(),
      lastSeenAt: new Date(),
    });

    return NextResponse.json({
      accessToken,
      refreshToken,
      deviceId,
      expiresIn: ACCESS_TTL_SECONDS,
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: "Server error", detail: e?.message ?? "unknown" },
      { status: 500 }
    );
  }
}
