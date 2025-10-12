import { NextResponse } from "next/server";

import { importPolicies } from "@/server/actions/assit-policies";

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    console.log("🚀 ~ POST ~ payload:", payload)
    const response = await importPolicies(payload);

    if (response?.success) {
      return NextResponse.json(response, { status: 200 });
    }

    return NextResponse.json(
      { message: "Internal Server Error ~ Error importing policies from ASSIT" },
      { status: 500 }
    );
  } catch (error: any) {
    console.error("Error importing policies from ASSIT:", error.message);
    return NextResponse.json(
      { message: "Internal Server Error ~ Error importing policies from ASSIT" },
      { status: 500 }
    );
  }
}
