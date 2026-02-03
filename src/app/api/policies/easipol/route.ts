import { NextResponse } from "next/server";

import {
  fetchAllPolicies,
  importPolicy,
} from "@/server/actions/easipol-policies";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const sortBy = searchParams.get("sortBy") || "policyNumber";
    const sortOrder = searchParams.get("sortOrder") || "asc";

    // Parse filters from query parameters
    const filters: any = {};
    const status = searchParams.get("status");
    const productName = searchParams.get("productName");
    const branchName = searchParams.get("branchName");
    const searchText = searchParams.get("searchText");

    if (status) filters.status = status;
    if (productName) filters.productName = productName;
    if (branchName) filters.branchName = branchName;
    if (searchText) filters.searchText = searchText;

    const response = await fetchAllPolicies(
      page,
      limit,
      sortBy,
      sortOrder,
      filters
    );

    if (response.success) {
      return NextResponse.json(response.data, { status: 200 });
    } else {
      return NextResponse.json({ message: response.message }, { status: 500 });
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
