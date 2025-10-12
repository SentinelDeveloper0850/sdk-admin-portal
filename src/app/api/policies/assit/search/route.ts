import { fetchAllPolicies } from "@/server/actions/easipol-policies";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { searchText } = await request.json();
    const response = await fetchAllPolicies(1, 50, "policyNumber", "asc", { searchText });

    if (response.success) {
      return NextResponse.json(response.data, { status: 200 });
    } else {
      return NextResponse.json(
        { message: response.message || "Failed to search policies" },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error("Error searching policies:", error.message);
    return NextResponse.json(
      { message: "Internal Server Error ~ Error searching policies" },
      { status: 500 }
    );
  }
}
