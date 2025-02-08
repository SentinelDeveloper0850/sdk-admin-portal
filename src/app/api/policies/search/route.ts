import { searchPolicies } from "@/server/actions/policies";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { searchText } = await request.json();
    const response = await searchPolicies(searchText);

    if (response.success) {
      return NextResponse.json(response.data, { status: 200 });
    }
  } catch (error: any) {
    console.error("Error searching policies:", error.message);
    return NextResponse.json(
      { message: "Internal Server Error ~ Error searching policies" },
      { status: 500 }
    );
  }
}
