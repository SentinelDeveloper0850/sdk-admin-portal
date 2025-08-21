import { NextResponse } from "next/server";

import { reverseImport } from "@/server/actions/eft-transactions";

export async function POST(request: Request) {
  try {
    const { uuid } = await request.json();
    if (!uuid) {
      return NextResponse.json(
        { message: "Missing uuid" },
        { status: 400 }
      );
    }

    const result = await reverseImport(uuid);
    return NextResponse.json(result, { status: result.success ? 200 : 400 });
  } catch (error: any) {
    console.error("Error reversing import:", error?.message);
    return NextResponse.json(
      { message: "Internal Server Error ~ Error reversing import" },
      { status: 500 }
    );
  }
}


