import { NextResponse } from "next/server";

import { getDashboardData } from "@/server/actions/dashboard";

export async function GET() {
  const result = await getDashboardData();

  if (!result.success) {
    return NextResponse.json(
      { success: false, message: result.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    data: result.data,
  });
}
