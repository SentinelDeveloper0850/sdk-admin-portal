import { DriverModel } from "@/app/models/drivers/driver.schema";
import { connectToDatabase } from "@/lib/db";
import { requireDriverAuth } from "@/lib/driverapp-guard";
import { NextResponse } from "next/server";

const ALLOWED_STATUSES = new Set([
    "OFF_DUTY",
    "AVAILABLE",
    "EN_ROUTE",
    "ON_SITE",
    "RETURNING",
    "BLOCKED",
]);

export async function POST(req: Request) {
    const auth = requireDriverAuth(req);
    if (!auth.ok) return auth.res;

    const driverId = String(auth.payload.sub);
    const body = await req.json().catch(() => ({}));
    const status = String(body?.status ?? "").trim();

    if (!ALLOWED_STATUSES.has(status)) {
        return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    await connectToDatabase();

    const driver = await DriverModel.findById(driverId);
    if (!driver || !driver.active) {
        return NextResponse.json({ error: "Driver not found or inactive" }, { status: 404 });
    }

    await DriverModel.updateOne(
        { _id: driverId },
        { $set: { status, statusUpdatedAt: new Date() } }
    );

    return NextResponse.json({ ok: true });
}
