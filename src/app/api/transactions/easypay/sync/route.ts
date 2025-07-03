import { NextResponse } from "next/server";

import {
  syncPolicyNumbers,
} from "@/server/actions/easypay-transactions";

export async function POST(request: Request) {
  try {
    const response = await syncPolicyNumbers();

    if (response.success) {
      return NextResponse.json({ status: 200, response });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error("Error syncing transactions:", error.message);
    return NextResponse.json(
      { message: "Internal Server Error ~ Error syncing transactions" },
      { status: 500 }
    );
  }
}
