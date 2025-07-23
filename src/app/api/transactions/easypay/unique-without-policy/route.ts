import { EasypayTransactionModel } from "@/app/models/scheme/easypay-transaction.schema";
import { connectToDatabase } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '50');
    const skip = (page - 1) * pageSize;

    // Get unique EasyPay numbers without policy numbers and their transaction counts
    const uniqueEasyPayNumbers = await EasypayTransactionModel.aggregate([
      {
        $match: {
          $or: [
            { policyNumber: { $exists: false } },
            { policyNumber: null },
            { policyNumber: "" }
          ]
        }
      },
      {
        $group: {
          _id: "$easypayNumber",
          transactionCount: { $sum: 1 },
          transactions: { $push: "$$ROOT" }
        }
      },
      {
        $sort: { transactionCount: -1, _id: 1 }
      },
      {
        $facet: {
          metadata: [{ $count: "total" }],
          data: [{ $skip: skip }, { $limit: pageSize }]
        }
      }
    ]);

    const total = uniqueEasyPayNumbers[0]?.metadata[0]?.total || 0;
    const data = uniqueEasyPayNumbers[0]?.data || [];

    // Format the data for display
    const formattedData = data.map((item: any) => ({
      easypayNumber: item._id,
      transactionCount: item.transactionCount,
      totalAmount: item.transactions.reduce((sum: number, tx: any) => sum + (tx.amount || 0), 0),
      firstTransactionDate: item.transactions[0]?.date,
      lastTransactionDate: item.transactions[item.transactions.length - 1]?.date,
      transactionIds: item.transactions.map((tx: any) => tx._id)
    }));

    return NextResponse.json({
      success: true,
      data: {
        uniqueEasyPayNumbers: formattedData,
        pagination: {
          current: page,
          pageSize: pageSize,
          total: total,
          totalPages: Math.ceil(total / pageSize)
        }
      }
    }, { status: 200 });

  } catch (error: any) {
    console.error("Error fetching unique EasyPay numbers without policy:", error.message);
    return NextResponse.json(
      { message: "Internal Server Error ~ Error fetching unique EasyPay numbers without policy" },
      { status: 500 }
    );
  }
} 