import { Schema, model, models, type Document } from "mongoose";

/**
 * Enums
 */
export const TASK_STATUSES = [
    "BACKLOG",
    "TODO",
    "IN_PROGRESS",
    "BLOCKED",
    "DONE",
    "CANCELED",
] as const;

export const TASK_PRIORITIES = [
    "LOW",
    "MEDIUM",
    "HIGH",
    "URGENT",
] as const;

export type TaskStatus = (typeof TASK_STATUSES)[number];
export type TaskPriority = (typeof TASK_PRIORITIES)[number];

/**
 * Task Document Interface
 */
export interface ITask extends Document {
    title: string;
    description?: string;

    status: TaskStatus;
    priority: TaskPriority;

    dueAt?: Date;
    completedAt?: Date;

    assigneeUserId?: string;
    createdByUserId: string;

    tags?: string[];
    isArchived: boolean;
    seenAt?: Date | null;

    createdAt: Date;
    updatedAt: Date;
}

/**
 * Schema
 */
const TaskSchema = new Schema<ITask>(
    {
        title: {
            type: String,
            required: true,
            trim: true,
            maxlength: 200,
        },

        description: {
            type: String,
            trim: true,
            maxlength: 5000,
        },

        status: {
            type: String,
            enum: TASK_STATUSES,
            default: "TODO",
            index: true,
        },

        priority: {
            type: String,
            enum: TASK_PRIORITIES,
            default: "MEDIUM",
            index: true,
        },

        dueAt: {
            type: Date,
            index: true,
        },

        completedAt: {
            type: Date,
        },

        assigneeUserId: {
            type: String,
            index: true,
        },

        createdByUserId: {
            type: String,
            required: true,
            index: true,
        },

        tags: {
            type: [String],
            default: [],
            index: true,
        },

        isArchived: {
            type: Boolean,
            default: false,
            index: true,
        },
        seenAt: { type: Date, default: null },
    },
    {
        timestamps: true,
        collection: "system_tasks",
    }
);

/**
 * Indexes
 * (Overdue queries + dashboards will thank you later)
 */
TaskSchema.index({ dueAt: 1, status: 1 });
TaskSchema.index({ assigneeUserId: 1, status: 1 });
TaskSchema.index({ createdByUserId: 1, createdAt: -1 });

/**
 * Hooks
 */
TaskSchema.pre("save", function (next) {
    if (this.status === "DONE" && !this.completedAt) {
        this.completedAt = new Date();
    }

    if (this.status !== "DONE" && this.completedAt) {
        this.completedAt = undefined;
    }

    next();
});

/**
 * Model
 */
export const TaskModel =
    models.Task || model<ITask>("Task", TaskSchema);
