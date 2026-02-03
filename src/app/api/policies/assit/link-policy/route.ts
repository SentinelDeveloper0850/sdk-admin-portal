import { NextResponse } from "next/server";

import { linkPolicy } from "@/server/actions/assit-policies";

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const response = await linkPolicy(payload);

    if (response?.success) {
      return NextResponse.json(response, { status: 200 });
    }

    return NextResponse.json(
      {
        message:
          "Internal Server Error ~ Error linking Easipol policy to ASSIT policy",
      },
      { status: 500 }
    );
  } catch (error: any) {
    console.error(
      "Error linking Easipol policy to ASSIT policy:",
      error.message
    );
    return NextResponse.json(
      {
        message:
          "Internal Server Error ~ Error linking Easipol policy to ASSIT policy",
      },
      { status: 500 }
    );
  }
}
