import { fetchAllPolicies, importPolicy } from "@/server/actions/policies";
import { NextResponse } from "next/server";

export async function GET(_request: Request) {
  try {
    const response = await fetchAllPolicies();

    if (response.success) {
      return NextResponse.json(response.data, { status: 200 });
    }
  } catch (error: any) {
    console.error("Error fetching policies:", error.message);
    return NextResponse.json(
      { message: "Internal Server Error ~ Error fetching policies" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const response = await importPolicy(payload);

    if (response?.success) {
      return NextResponse.json(response, { status: 200 });
    }

    return NextResponse.json(
      { message: "Internal Server Error ~ Error importing policy" },
      { status: 500 }
    );
  } catch (error: any) {
    console.error("Error importing policy:", error.message);
    return NextResponse.json(
      { message: "Internal Server Error ~ Error importing policy" },
      { status: 500 }
    );
  }
}
