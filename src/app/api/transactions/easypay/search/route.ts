import { NextResponse } from "next/server";

import {
  searchTransactions,
  searchTransactionsByAmount,
  searchTransactionsByDate,
  searchTransactionsByPolicyNumber,
} from "@/server/actions/easypay-transactions";

export async function POST(request: Request) {
  try {
    // Parse the request body
    const body = await request.json();

    const searchType = body.searchType;

    if (searchType == "text") {
      const searchText = body.searchText;
      const page = body.page || 1;
      const pageSize = body.pageSize || 50;

      const response = await searchTransactions(searchText, page, pageSize);

      if (response.success) {
        return NextResponse.json(response.data, { status: 200 });
      }
    }

    if (searchType == "policyNumber") {
      const searchText = body.searchText;
      const page = body.page || 1;
      const pageSize = body.pageSize || 50;

      const response = await searchTransactionsByPolicyNumber(
        searchText,
        page,
        pageSize
      );

      if (response.success) {
        return NextResponse.json(response.data, { status: 200 });
      }
    }

    if (searchType == "amount") {
      const { amount, filterType } = body;
      const page = body.page || 1;
      const pageSize = body.pageSize || 50;

      const response = await searchTransactionsByAmount(
        amount,
        filterType,
        page,
        pageSize
      );

      if (response.success) {
        return NextResponse.json(response.data, { status: 200 });
      }
    }

    if (searchType == "date") {
      const { date } = body;
      const page = body.page || 1;
      const pageSize = body.pageSize || 50;

      const response = await searchTransactionsByDate(date, page, pageSize);

      if (response.success) {
        return NextResponse.json(response.data, { status: 200 });
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
