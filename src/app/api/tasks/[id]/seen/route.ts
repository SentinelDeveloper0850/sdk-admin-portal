import { NextRequest, NextResponse } from "next/server";

import { TaskModel } from "@/app/models/system/task.schema";
import { getUserFromRequest } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";

export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserFromRequest(req);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await ctx.params;

    if (!id) {
      return NextResponse.json({ error: "Missing task ID" }, { status: 400 });
    }

    await connectToDatabase();

    const task = await TaskModel.findOneAndUpdate(
      {
        _id: id,
        assigneeUserId: user.id,
      },
      {
        $set: { seenAt: new Date() },
      },
      { new: true }
    );

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    return NextResponse.json({ task });
  } catch (error) {
    console.error("TASK_SEEN_ERROR", error);
    return NextResponse.json(
      { error: "Failed to mark task as seen" },
      { status: 500 }
    );
  }
}
