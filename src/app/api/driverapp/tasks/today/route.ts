import { requireDriverAuth } from "@/lib/driverapp-guard";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
    const auth = requireDriverAuth(req);
    if (!auth.ok) return auth.res;

    // TODO: replace with real task model / funeral assignments
    return NextResponse.json({ tasks: [] });
}
