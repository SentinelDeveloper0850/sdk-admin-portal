import { NextRequest, NextResponse } from "next/server";

import EftTransactionModel from "@/app/models/scheme/eft-transaction.schema";
import { connectToDatabase } from "@/lib/db";
import { searchTransactions } from "@/server/actions/eft-transactions";

export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const body = await request.json();

    const { searchType, searchText, amount, filterType } = body;

    if (searchType == "text") {
      const response = await searchTransactions(searchText);
      return NextResponse.json(response.data, { status: 200 });
    }

    if (searchType == "amount") {
      if (!amount || !filterType) {
        return NextResponse.json(
          { message: "Amount and filter type are required" },
          { status: 400 }
        );
      }

      await connectToDatabase();

      const transactions = await EftTransactionModel.find({
        $or: [
          {
            amount:
              filterType === ">"
                ? { $gt: amount }
                : filterType === "<"
                  ? { $lt: amount }
                  : { $eq: amount },
          },
        ],
      }).sort({ amount: filterType === "<" ? "desc" : "asc" });
      // .populate({ path: "allocationRequests", strictPopulate: false });

      return NextResponse.json(transactions, { status: 200 });
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
