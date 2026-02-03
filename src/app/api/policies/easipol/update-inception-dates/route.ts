import { NextResponse } from "next/server";

import { updateInceptionDates } from "@/server/actions/easipol-policies";

export async function GET(request: Request) {
  try {
    const response = await updateInceptionDates();
    if (response?.success) {
      return NextResponse.json({ message: response.message }, { status: 200 });
    } else {
      return NextResponse.json({ message: response?.message }, { status: 500 });
    }
  } catch (error) {
    console.error("Error updating inception dates:", error);
    return NextResponse.json(
      { message: "Error updating inception dates" },
      { status: 500 }
    );
  }
}
