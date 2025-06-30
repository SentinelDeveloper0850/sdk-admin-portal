import { NextRequest, NextResponse } from "next/server";

import { getUserFromRequest } from "@/lib/auth";
// custom JWT helper
import { updateUserProfile } from "@/server/actions/users";

export async function PATCH(req: NextRequest) {
  const user = await getUserFromRequest(req);

  if (!user || !user._id) {
    return NextResponse.json(
      { success: false, message: "Unauthorized" },
      { status: 401 }
    );
  }

  const userId = user._id.toString();

  const body = await req.json();
  const result = await updateUserProfile(userId, body);

  return NextResponse.json(result);
}
