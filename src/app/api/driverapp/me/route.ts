import { DriverModel } from "@/app/models/drivers/driver.schema";
import { connectToDatabase } from "@/lib/db";
import { requireDriverAuth } from "@/lib/driverapp-guard";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
    const auth = requireDriverAuth(req);
    if (!auth.ok) return auth.res;

    const driverId = String(auth.payload.sub);

    await connectToDatabase();

    const driver = await DriverModel.findById(driverId).populate("staffMemberId");
    if (!driver) {
        return NextResponse.json({ error: "Driver not found" }, { status: 404 });
    }

    const staff: any = driver.staffMemberId;

    return NextResponse.json({
        driver: {
            id: String(driver._id),
            driverCode: driver.driverCode,
            active: driver.active,
            status: driver.status,
            statusUpdatedAt: driver.statusUpdatedAt,
            vehicle: driver.vehicle ?? null,
        },
        staffMember: staff
            ? {
                id: String(staff._id),
                firstNames: staff.firstNames,
                lastName: staff.lastName,
                initials: staff.initials,
                idNumber: staff.idNumber ?? null,
                contact: staff.contact ?? null,
            }
            : null,
    });
}
