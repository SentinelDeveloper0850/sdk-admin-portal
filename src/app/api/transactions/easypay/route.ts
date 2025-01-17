import { NextResponse } from "next/server";

import { fetchAll, importTransactions } from "@/server/actions/easypay-transactions";

export async function GET(_request: Request) {
  try {
    const response = await fetchAll();

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

export async function POST(request: Request) {
  try {
    // Parse the request body
    const payload = await request.json();

    const response = await importTransactions(payload);

    if (response.success) {
      return NextResponse.json(
        response,
        { status: 200 }
      );
    }

    return NextResponse.json(
      { message: "Internal Server Error ~ Error importing transactions" },
      { status: 500 }
    );

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error("Error importing transactions:", error.message);
    return NextResponse.json(
      { message: "Internal Server Error ~ Error importing transactions" },
      { status: 500 }
    );
  }
}

