import { NextResponse } from "next/server";

import { fetchAllPolicies, getFilterOptions, importPolicies } from "@/server/actions/assit-policies";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const sortBy = searchParams.get("sortBy") || "membershipID";
    const sortOrder = searchParams.get("sortOrder") || "asc";
    const withFilters = (searchParams.get("withFilters") || "false").toLowerCase() === "true";

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

    const response = await fetchAllPolicies(page, limit, sortBy, sortOrder, filters);

    if (response.success) {
      let payload: any = response.data;
      if (withFilters) {
        const filtersResp = await getFilterOptions();
        if (filtersResp.success) {
          payload = { ...payload, filterOptions: filtersResp.data };
        }
      }
      return NextResponse.json(payload, { status: 200 });
    } else {
      return NextResponse.json(
        { message: response.message },
        { status: 500 }
      );
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
    const response = await importPolicies(payload);

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
