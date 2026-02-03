import { DriverModel } from "@/app/models/drivers/driver.schema";
import { StaffMemberModel } from "@/app/models/staff-member.schema"; // adjust import path/name
import { getUserFromRequest } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

function normalizeCode(code: string) {
    return code.trim().toUpperCase();
}

export async function GET(req: NextRequest) {
    try {
        const user = await getUserFromRequest(req);
        if (!user)
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        if (user.role !== "admin")
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });

        await connectToDatabase();

        const drivers = await DriverModel.find({})
            .populate("staffMemberId")
            .sort({ createdAt: -1 });

        return NextResponse.json(drivers, { status: 200 });
    } catch (e: any) {
        return NextResponse.json(
            { message: "Failed to fetch drivers", detail: e?.message ?? "unknown" },
            { status: 500 }
        );
    }
}

export async function POST(req: NextRequest) {
    try {
        const user = await getUserFromRequest(req);
        if (!user)
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        if (user.role !== "admin")
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });

        const body = await req.json();
        const staffMemberId = String(body?.staffMemberId ?? "").trim();
        const driverCode = normalizeCode(String(body?.driverCode ?? ""));

        if (!staffMemberId || !driverCode) {
            return NextResponse.json({ error: "Missing staffMemberId or driverCode" }, { status: 400 });
        }

        await connectToDatabase();

        const staff = await StaffMemberModel.findById(staffMemberId);
        if (!staff) {
            return NextResponse.json({ error: "Staff member not found" }, { status: 404 });
        }

        const exists = await DriverModel.findOne({
            $or: [{ staffMemberId }, { driverCode }],
        });

        if (exists) {
            return NextResponse.json({ error: "Driver already exists for staff member or code in use" }, { status: 409 });
        }

        const driver = await DriverModel.create({
            staffMemberId,
            driverCode,
            active: true,
            status: "OFF_DUTY",
            statusUpdatedAt: new Date(),
        });

        return NextResponse.json({ ok: true, driverId: String(driver._id) });
    } catch (e: any) {
        return NextResponse.json(
            { error: "Server error", detail: e?.message ?? "unknown" },
            { status: 500 }
        );
    }
}
