import { NextResponse } from "next/server";

import { DriverTrustedDeviceModel } from "@/app/models/drivers/driver-trusted-device.schema";
import { connectToDatabase } from "@/lib/db";

export async function POST(req: Request) {
  try {
    // TODO: Add portal auth guard here (admin-only).
    const body = await req.json();
    const deviceId = String(body?.deviceId ?? "").trim();
    const reason = String(body?.reason ?? "manual_revoke").trim();

    if (!deviceId) {
      return NextResponse.json({ error: "Missing deviceId" }, { status: 400 });
    }

    await connectToDatabase();

    await DriverTrustedDeviceModel.updateOne(
      { deviceId },
      { $set: { revokedAt: new Date(), revokeReason: reason } }
    );

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json(
      { error: "Server error", detail: e?.message ?? "unknown" },
      { status: 500 }
    );
  }
}
