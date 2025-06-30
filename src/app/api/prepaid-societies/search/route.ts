import { NextResponse } from "next/server";

import { ISociety } from "@/app/models/society.schema";
import { searchSocieties } from "@/server/actions/societies";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { searchText } = body;

    if (!searchText || typeof searchText !== "string") {
      return NextResponse.json(
        { message: "Missing or invalid search text" },
        { status: 400 }
      );
    }

    const response:
      | {
          success: boolean;
          societies: any[];
          count: number;
          message?: undefined;
        }
      | {
          success: boolean;
          message: string;
          societies?: undefined;
          count?: undefined;
        } = await searchSocieties(searchText);

    if (response?.success) {
      return NextResponse.json({
        societies: response?.societies,
        count: response?.count,
      });
    }

    return NextResponse.json(
      { message: response?.message || "Unexpected response format" },
      { status: 500 }
    );
  } catch (error: any) {
    console.error(error);
    return NextResponse.json(
      { message: error.message || "Search failed" },
      { status: 500 }
    );
  }
}
