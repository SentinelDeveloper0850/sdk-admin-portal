import { NextResponse } from "next/server";

import {
  fetchToSync,
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

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '50');

    const response = await fetchToSync(pageSize, page);

    if (response.success) {
      return NextResponse.json(response, { status: 200 });
    }

    return NextResponse.json(
      { message: "Failed to fetch transactions to sync" },
      { status: 500 }
    );

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error("Error fetching transactions:", error.message);
    return NextResponse.json(
      { message: "Internal Server Error ~ Error fetching transactions" },
      { status: 500 }
    );
  }
}
