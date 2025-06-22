import { NextResponse } from "next/server";
import { fetchAllSocieties } from "@/server/actions/societies";

export async function GET() {
  try {
    const response = await fetchAllSocieties();

    if (response?.data?.societies) {
      const { societies, count } = response.data;
      return NextResponse.json({ societies, count });
    }

    return NextResponse.json(
      { message: response?.message || "Unexpected response format" },
      { status: 500 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || "Failed to fetch prepaid societies" },
      { status: 500 }
    );
  }
}
