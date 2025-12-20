"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

export type TaskStatus = "BACKLOG" | "TODO" | "IN_PROGRESS" | "BLOCKED" | "DONE" | "CANCELED";
export type TaskPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

export interface Task {
    _id: string;
    title: string;
    description?: string;
    status: TaskStatus;
    priority: TaskPriority;
    dueAt?: string;
    completedAt?: string;
    assigneeUserId?: string;
    createdByUserId: string;
    tags?: string[];
    isArchived?: boolean;
    seenAt?: string;
    createdAt: string;
    updatedAt: string;
}

interface UseTasksOptions {
    pollIntervalMs?: number;
    limit?: number;
    openOnly?: boolean;
}

export function useTasks(options: UseTasksOptions = {}) {
    const { pollIntervalMs = 15_000, limit = 10, openOnly = true } = options;

    const [tasks, setTasks] = useState<Task[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isError, setIsError] = useState(false);

    const query = useMemo(() => {
        const params = new URLSearchParams();
        params.set("assignee", "me");
        params.set("archived", "false");
        params.set("limit", String(limit));
        if (openOnly) params.set("openOnly", "true");
        return params.toString();
    }, [limit, openOnly]);

    const fetchTasks = useCallback(async () => {
        try {
            setIsError(false);
            const res = await fetch(`/api/tasks?${query}`, { credentials: "include" });
            if (!res.ok) throw new Error("Failed to fetch tasks");
            const data = await res.json();
            setTasks(data.tasks ?? []);
        } catch (e) {
            console.error(e);
            setIsError(true);
        } finally {
            setIsLoading(false);
        }
    }, [query]);

    useEffect(() => {
        fetchTasks();
        const t = setInterval(fetchTasks, pollIntervalMs);
        return () => clearInterval(t);
    }, [fetchTasks, pollIntervalMs]);

    const refetch = useCallback(() => fetchTasks(), [fetchTasks]);

    return { tasks, isLoading, isError, refetch };
}
