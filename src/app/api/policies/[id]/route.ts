import { NextRequest, NextResponse } from "next/server";

import { deletePolicyById, fetchPolicyById } from "@/server/actions/policies";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { message: "Policy ID is required" },
        { status: 400 }
      );
    }

    const response = await fetchPolicyById(id);

    if (response.success) {
      return NextResponse.json(
        { success: true, policy: response.data },
        { status: 200 }
      );
    } else {
      return NextResponse.json(
        { success: false, message: response.message },
        { status: 404 }
      );
    }
  } catch (error: any) {
    console.error("Error fetching policy:", error.message);
    return NextResponse.json(
      { success: false, message: "Internal Server Error ~ Error fetching policy" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { message: "Policy ID is required" },
        { status: 400 }
      );
    }

    const response = await deletePolicyById(id);

    if (response.success) {
      return NextResponse.json(
        { success: true, message: "Policy deleted successfully" },
        { status: 200 }
      );
    } else {
      return NextResponse.json(
        { success: false, message: response.message },
        { status: 404 }
      );
    }
  } catch (error: any) {
    console.error("Error deleting policy:", error.message);
    return NextResponse.json(
      { success: false, message: "Internal Server Error ~ Error deleting policy" },
      { status: 500 }
    );
  }
} 