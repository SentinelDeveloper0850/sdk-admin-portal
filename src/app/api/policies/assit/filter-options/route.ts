import { NextResponse } from "next/server";

import { getFilterOptions } from "@/server/actions/easipol-policies";

export async function GET() {
  try {
    const response = await getFilterOptions();

    if (response.success) {
      return NextResponse.json(response.data, { status: 200 });
    } else {
      return NextResponse.json({ message: response.message }, { status: 500 });
    }
  } catch (error: any) {
    console.error("Error fetching filter options:", error.message);
    return NextResponse.json(
      { message: "Internal Server Error ~ Error fetching filter options" },
      { status: 500 }
    );
  }
}
