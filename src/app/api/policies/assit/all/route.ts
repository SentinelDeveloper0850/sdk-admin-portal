import { NextResponse } from "next/server";

import { AssitPolicyModel } from "@/app/models/scheme/assit-policy.schema";
import { connectToDatabase } from "@/lib/db";

export async function GET(request: Request) {
    try {
        await connectToDatabase();

        const policies = await AssitPolicyModel.find();

        if (policies) {
            return NextResponse.json({ policies }, { status: 200 });
        } else {
            return NextResponse.json({ message: "No policies found" }, { status: 404 });
        }
    } catch (error: any) {
        console.error("Error fetching policies:", error.message);
        return NextResponse.json(
            { message: "Internal Server Error ~ Error fetching policies" },
            { status: 500 }
        );
    }
}
