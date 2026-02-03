import { NextRequest, NextResponse } from "next/server";

import { TaskModel } from "@/app/models/system/task.schema";
import { getUserFromRequest } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { taskIds } = await req.json();

    if (!Array.isArray(taskIds) || taskIds.length === 0) {
      return NextResponse.json({ ok: true });
    }

    await TaskModel.updateMany(
      {
        _id: { $in: taskIds },
        assigneeUserId: user.id,
      },
      {
        $set: { seenAt: new Date() },
      }
    );

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("TASKS_SEEN_ERROR", error);
    return NextResponse.json(
      { error: "Failed to mark tasks as seen" },
      { status: 500 }
    );
  }
}
