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

export async function GET(req: NextRequest) {
    const user = await getUserFromRequest(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);

    const search = searchParams.get("search")?.trim();
    const status = searchParams.get("status")?.toUpperCase();
    const priority = searchParams.get("priority")?.toUpperCase();
    const assignee = searchParams.get("assignee"); // "me" | userId
    const createdBy = searchParams.get("createdBy"); // "me" | userId
    const overdueOnly = searchParams.get("overdueOnly") === "true";
    const archived = searchParams.get("archived") === "true";
    const openOnly = searchParams.get("openOnly") === "true";

    const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") ?? "20")));
    const page = Math.max(1, Number(searchParams.get("page") ?? "1"));
    const skip = (page - 1) * limit;

    const privileged = isPrivilegedUser(user);

    const where: any = {
        isArchived: archived,
    };

    // Scope: non-privileged users only see tasks they created or are assigned to
    if (!privileged) {
        where.$or = [{ createdByUserId: user.id }, { assigneeUserId: user.id }];
    }

    // Filters
    if (status && TASK_STATUSES.includes(status as any)) where.status = status;
    if (priority && TASK_PRIORITIES.includes(priority as any)) where.priority = priority;

    if (assignee) {
        if (assignee === "me") where.assigneeUserId = user.id;
        else if (privileged) where.assigneeUserId = assignee;
        else where.assigneeUserId = user.id;
    }

    if (createdBy) {
        if (createdBy === "me") where.createdByUserId = user.id;
        else if (privileged) where.createdByUserId = createdBy;
        else where.createdByUserId = user.id;
    }

    if (overdueOnly) {
        where.dueAt = { $lt: new Date() };
        where.status = { $nin: ["DONE", "CANCELED"] };
    }

    if (openOnly) {
        where.status = { $nin: ["DONE", "CANCELED"] };
    }

    if (search) {
        where.$and = where.$and || [];
        where.$and.push({
            $or: [
                { title: { $regex: search, $options: "i" } },
                { description: { $regex: search, $options: "i" } },
                { tags: { $elemMatch: { $regex: search, $options: "i" } } },
            ],
        });
    }

    await connectToDatabase();

    const [tasks, total] = await Promise.all([
        TaskModel.find(where).sort({ updatedAt: -1 }).skip(skip).limit(limit).lean(),
        TaskModel.countDocuments(where),
    ]);

    return NextResponse.json({
        tasks,
        meta: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        },
    });
}

export async function POST(req: NextRequest) {
    const user = await getUserFromRequest(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json().catch(() => ({}));

    const title = String(body?.title || "").trim();
    if (!title) return NextResponse.json({ error: "Title is required" }, { status: 400 });

    const description = typeof body?.description === "string" ? body.description.trim() : undefined;

    const statusRaw = String(body?.status || "TODO").toUpperCase();
    const priorityRaw = String(body?.priority || "MEDIUM").toUpperCase();

    const status = TASK_STATUSES.includes(statusRaw as any) ? statusRaw : "TODO";
    const priority = TASK_PRIORITIES.includes(priorityRaw as any) ? priorityRaw : "MEDIUM";

    const dueAt = body?.dueAt ? new Date(body.dueAt) : undefined;
    const safeDueAt = dueAt instanceof Date && !Number.isNaN(dueAt.getTime()) ? dueAt : undefined;

    const assigneeUserId = body?.assigneeUserId ? String(body.assigneeUserId) : undefined;

    const tags = Array.isArray(body?.tags)
        ? body.tags.map((t: any) => String(t).trim()).filter(Boolean).slice(0, 20)
        : [];

    await connectToDatabase();

    const task = await TaskModel.create({
        title,
        description,
        status,
        priority,
        dueAt: safeDueAt,
        assigneeUserId,
        createdByUserId: user.id,
        tags,
        isArchived: false,
    });

    if (task.assigneeUserId) {
        await notifyTaskAssigned({
            recipientUserId: String(task.assigneeUserId),
            actorUserId: String(user._id),
            task: task,
        });
    }

    return NextResponse.json({ task }, { status: 201 });
}
