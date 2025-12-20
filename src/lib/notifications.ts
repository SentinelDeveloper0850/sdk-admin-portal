import { NotificationModel } from "@/app/models/notification.schema"; // adjust import path

type TaskLike = {
    _id: string;
    title: string;
    priority?: string;
    status?: string;
    dueAt?: string | null;
};

export async function notifyTaskAssigned(params: {
    recipientUserId: string;
    actorUserId?: string;
    task: TaskLike;
}) {
    const { recipientUserId, actorUserId, task } = params;

    // tiny de-dupe: prevent double inserts on retries within 30s
    const thirtySecondsAgo = new Date(Date.now() - 30_000);
    const existing = await NotificationModel.findOne({
        recipientUserId,
        type: "TASK_ASSIGNED",
        "data.taskId": String(task._id),
        createdAt: { $gte: thirtySecondsAgo },
    }).lean();

    if (existing) return;

    await NotificationModel.create({
        recipientUserId,
        actorUserId,
        type: "TASK_ASSIGNED",
        title: "Task assigned",
        message: task.title,
        link: `/tasks?focus=${task._id}`,
        severity: "INFO",
        data: {
            taskId: String(task._id),
            actorUserId,
            priority: task.priority,
            status: task.status,
            dueAt: task.dueAt ?? null,
        },
        readAt: null,
    });
}
