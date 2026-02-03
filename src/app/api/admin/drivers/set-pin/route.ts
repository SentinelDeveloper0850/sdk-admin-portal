import { DriverModel } from "@/app/models/drivers/driver.schema";
import { connectToDatabase } from "@/lib/db";
import bcrypt from "bcrypt";
import { NextResponse } from "next/server";

function validatePin(pin: string) {
    const cleaned = pin.trim();
    if (!/^\d{4,6}$/.test(cleaned)) return null;
    return cleaned;
}

export async function POST(req: Request) {
    try {
        // TODO: enforce portal admin auth here

        const body = await req.json();
        const driverId = String(body?.driverId ?? "").trim();
        const pinRaw = String(body?.pin ?? "");

        const pin = validatePin(pinRaw);
        if (!driverId || !pin) {
            return NextResponse.json({ error: "Missing driverId or invalid PIN (must be 4–6 digits)" }, { status: 400 });
        }

        await connectToDatabase();

        const driver = await DriverModel.findById(driverId);
        if (!driver) {
            return NextResponse.json({ error: "Driver not found" }, { status: 404 });
        }

        const pinHash = await bcrypt.hash(pin, 10);

        await DriverModel.updateOne(
            { _id: driverId },
            {
                $set: {
                    pinHash,
                    pinUpdatedAt: new Date(),
                    // Optional: expire PIN after 90 days, or comment out if you don't want expiry
                    // pinExpiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
                    pinFailedAttempts: 0,
                    pinLockedUntil: null,
                },
            }
        );

        return NextResponse.json({ ok: true });
    } catch (e: any) {
        return NextResponse.json(
            { error: "Server error", detail: e?.message ?? "unknown" },
            { status: 500 }
        );
    }
}
