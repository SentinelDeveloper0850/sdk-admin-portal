// /api/transactions/eft/allocation-requests/sync/route.ts
import { NextRequest, NextResponse } from "next/server";

import { AllocationRequestModel } from "@/app/models/hr/allocation-request.schema";
import { connectToDatabase } from "@/lib/db";

export const runtime = "nodejs";

export async function GET(_req: NextRequest) {
  try {
    await connectToDatabase();

    // Run aggregation on AllocationRequest collection
    await AllocationRequestModel.aggregate([
      {
        $match: {
          transactionModel: "EftTransaction",
          transactionId: { $ne: null },
        },
      },
      {
        $group: {
          _id: "$transactionId",
          allocationRequests: { $addToSet: "$_id" },
        },
      },
      // rename _id -> _id to match EFT documents and prepare fields for merge
      { $project: { _id: 1, allocationRequests: 1 } },
      {
        $merge: {
          into: "eft-transactions", // collection name
          on: "_id", // match EFT by _id
          whenMatched: [
            // pipeline update (MongoDB 4.4+)
            { $set: { allocationRequests: "$$new.allocationRequests" } },
          ],
          whenNotMatched: "discard", // ignore ARs whose EFT no longer exists
        },
      },
    ]);

    return NextResponse.json({
      success: true,
      message: "EFT transactions synced with allocation requests",
    });
  } catch (err: any) {
    console.error("Sync error:", err?.message);
    return NextResponse.json(
      { message: "Internal Server Error ~ sync" },
      { status: 500 }
    );
  }
}
