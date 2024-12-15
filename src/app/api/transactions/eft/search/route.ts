import { NextResponse } from "next/server";

import { searchTransactions, searchTransactionsByAmount } from "@/server/actions/eft-transactions";

export async function POST(request: Request) {
  try {
    // Parse the request body
    const body = await request.json();

    const searchType = body.searchType;

    if (searchType == 'text') {
      const searchText = body.searchText;

      const response = await searchTransactions(searchText);

      console.log("searchTransactionsByText api", response)

      if (response.success) {
        return NextResponse.json(
          response.data,
          { status: 200 }
        );
      }
    }

    if (searchType == 'amount') {
      const { amount, filterType } = body;

      const response = await searchTransactionsByAmount(amount, filterType);

      console.log("searchTransactionsByAmount api", response)

      if (response.success) {
        return NextResponse.json(
          response.data,
          { status: 200 }
        );
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error("Error searching transactions:", error.message);
    return NextResponse.json(
      { message: "Internal Server Error ~ Error searching transactions" },
      { status: 500 }
    );
  }
}