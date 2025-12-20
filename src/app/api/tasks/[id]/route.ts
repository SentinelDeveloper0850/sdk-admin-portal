import { NextRequest, NextResponse } from "next/server";

import { TASK_PRIORITIES, TASK_STATUSES, TaskModel } from "@/app/models/system/task.schema";
import { getUserFromRequest } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import { notifyTaskAssigned } from "@/lib/notifications";

function isPrivilegedUser(user: any) {
    const role =
        user?.role ||
        user?.globalRole ||
        user?.orgRole ||
        (Array.isArray(user?.roles) ? user.roles.join(",") : undefined);

    const roleStr = String(role || "").toUpperCase();

    return Boolean(
        user?.isAdmin ||
        user?.isOps ||
        roleStr.includes("ADMIN") ||
        roleStr.includes("OPS") ||
        roleStr.includes("SUPER")
    );
}

function canAccessTask(user: any, task: any) {
    if (!user?.id) return false;
    if (isPrivilegedUser(user)) return true;
    return task?.createdByUserId === user.id || task?.assigneeUserId === user.id;
}

export async function GET(req: NextRequest, ctx: { params: { id: string } }) {
    const user = await getUserFromRequest(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectToDatabase();

    const task = await TaskModel.findById(ctx.params.id).lean();
    if (!task) return NextResponse.json({ error: "Task not found" }, { status: 404 });

    if (!canAccessTask(user, task)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({ task });
}

export async function PATCH(req: NextRequest, ctx: { params: { id: string } }) {
    const user = await getUserFromRequest(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const privileged = isPrivilegedUser(user);

    await connectToDatabase();

    const task = await TaskModel.findById(ctx.params.id);
    if (!task) return NextResponse.json({ error: "Task not found" }, { status: 404 });

    const oldAssignee = task.assigneeUserId ? String(task.assigneeUserId) : null;
    const newAssignee = body.assigneeUserId === undefined ? oldAssignee : body.assigneeUserId ? String(body.assigneeUserId) : null; // explicit unassign (null)

    if (!canAccessTask(user, task.toObject())) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // assigneeUserId
    if (typeof body?.assigneeUserId !== "undefined") {
        const nextAssignee = body.assigneeUserId ? String(body.assigneeUserId) : undefined;

        if (!privileged) {
            const isSelf = nextAssignee === user.id;
            const isClearing = !nextAssignee;
            if (!isSelf && !isClearing) {
                return NextResponse.json({ error: "You can only assign tasks to yourself" }, { status: 403 });
            }
        }

        task.assigneeUserId = nextAssignee;
    }

    // title
    if (typeof body?.title === "string") {
        const title = body.title.trim();
        if (!title) return NextResponse.json({ error: "Title cannot be empty" }, { status: 400 });
        task.title = title;
    }

    // description
    if (typeof body?.description === "string") {
        task.description = body.description.trim();
    }

    // status
    if (typeof body?.status === "string") {
        const nextStatus = body.status.toUpperCase();
        if (!TASK_STATUSES.includes(nextStatus as any)) {
            return NextResponse.json({ error: "Invalid status" }, { status: 400 });
        }
        task.status = nextStatus as any;
    }

    // priority
    if (typeof body?.priority === "string") {
        const nextPriority = body.priority.toUpperCase();
        if (!TASK_PRIORITIES.includes(nextPriority as any)) {
            return NextResponse.json({ error: "Invalid priority" }, { status: 400 });
        }
        task.priority = nextPriority as any;
    }

    // dueAt
    if (typeof body?.dueAt !== "undefined") {
        if (!body.dueAt) {
            task.dueAt = undefined;
        } else {
            const d = new Date(body.dueAt);
            if (Number.isNaN(d.getTime())) {
                return NextResponse.json({ error: "Invalid dueAt date" }, { status: 400 });
            }
            task.dueAt = d;
        }
    }

    // tags
    if (typeof body?.tags !== "undefined") {
        if (!Array.isArray(body.tags)) {
            return NextResponse.json({ error: "Tags must be an array" }, { status: 400 });
        }
        task.tags = body.tags.map((t: any) => String(t).trim()).filter(Boolean).slice(0, 20);
    }

    // isArchived (creator can archive own; privileged can archive any)
    if (typeof body?.isArchived === "boolean") {
        const isCreator = String(task.createdByUserId) === String(user.id);
        if (!privileged && !isCreator) {
            return NextResponse.json({ error: "Only the creator can archive this task" }, { status: 403 });
        }
        task.isArchived = body.isArchived;
    }

    const updatedTask = await task.save();

    const assigneeChanged = oldAssignee !== newAssignee;

    if (assigneeChanged && newAssignee) {
        await notifyTaskAssigned({
            recipientUserId: newAssignee,
            actorUserId: String(user._id),
            task: updatedTask,
        });
    }

    return NextResponse.json({ task: updatedTask });
}
