import { NextResponse } from "next/server";

import {
  fetchAll,
  importTransactions,
} from "@/server/actions/easypay-transactions";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '50');

    const response = await fetchAll(pageSize, page);

    if (response.success) {
      return NextResponse.json(response.data, { status: 200 });
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
      return NextResponse.json(response, { status: 200 });
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
