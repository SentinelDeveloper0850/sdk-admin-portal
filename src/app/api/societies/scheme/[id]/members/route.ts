import { NextRequest, NextResponse } from "next/server";

import { fetchSocietyMembersById } from "@/server/actions/societies";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { message: "Society ID is required" },
        { status: 400 }
      );
    }

    const response = await fetchSocietyMembersById(id);

    if (response.success) {
      return NextResponse.json(
        { success: true, members: response.data },
        { status: response.success ? 200 : 404 }
      );
    } else {
      return NextResponse.json(
        { success: false, message: response.message },
        { status: 404 }
      );
    }
  } catch (error: any) {
    console.error("Error fetching society members:", error.message);
    return NextResponse.json(
      {
        success: false,
        message: "Internal Server Error ~ Error fetching society members",
      },
      { status: 500 }
    );
  }
}
