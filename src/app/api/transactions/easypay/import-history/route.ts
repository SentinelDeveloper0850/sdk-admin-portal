import { NextResponse } from "next/server";

import { fetchImportHistory } from "@/server/actions/easypay-transactions";

export async function GET(_request: Request) {
  try {
    const response = await fetchImportHistory();

    if (response.success) {
      return NextResponse.json(
        response.data,
        { status: 200 }
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error("Error fetching transactions:", error.message);
    return NextResponse.json(
      { message: "Internal Server Error ~ Error fetching transactions" },
      { status: 500 }
    );
  }
}
