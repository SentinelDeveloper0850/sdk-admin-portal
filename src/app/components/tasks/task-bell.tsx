"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { ClipboardList } from "lucide-react";

import { Button } from "@/app/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/app/components/ui/popover";
import { ScrollArea } from "@/app/components/ui/scroll-area";
import { useTasks } from "@/app/hooks/use-tasks";
import { cn } from "@/lib/utils";

function formatRelative(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / (1000 * 60));
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin} min ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay === 1) return "Yesterday";
  return date.toLocaleDateString();
}

function isOverdue(dueAt?: string, status?: string) {
  if (!dueAt) return false;
  if (status === "DONE" || status === "CANCELED") return false;
  return new Date(dueAt).getTime() < Date.now();
}

export function TaskBell() {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const { tasks, isLoading, isError } = useTasks({
    pollIntervalMs: 15_000,
    limit: 10,
    openOnly: true,
  });

  const openCount = useMemo(() => tasks.length, [tasks]);
  const unseenCount = useMemo(() => {
    return tasks.filter((t: any) => {
      if (!t.seenAt) return true;
      return new Date(t.updatedAt).getTime() > new Date(t.seenAt).getTime();
    }).length;
  }, [tasks]);

  return (
    <Popover
      open={open}
      onOpenChange={(isOpen) => {
        setOpen(isOpen);

        if (isOpen && tasks.length > 0) {
          fetch("/api/tasks/seen", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ taskIds: tasks.map((t) => t._id) }),
          });
        }
      }}
    >
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-5 w-6"
          aria-label="Tasks"
        >
          <ClipboardList className="h-5 w-5" />
          {unseenCount > 0 && (
            <span className="absolute -right-1.5 -top-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
              {unseenCount > 9 ? "9+" : unseenCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        className="z-50 min-w-96 rounded-md border bg-white p-0 text-gray-900 shadow-lg"
      >
        <div className="flex items-center justify-between border-b px-3 py-2">
          <span className="text-sm font-medium">My Tasks</span>

          <button
            type="button"
            onClick={() => {
              setOpen(false);
              router.push("/tasks");
            }}
            className="text-muted-foreground text-xs hover:text-foreground"
          >
            View all
          </button>
        </div>

        <ScrollArea className="h-80">
          {isLoading && (
            <div className="text-muted-foreground px-3 py-4 text-xs">
              Loading…
            </div>
          )}

          {isError && !isLoading && (
            <div className="text-destructive px-3 py-4 text-xs">
              Failed to load tasks.
            </div>
          )}

          {!isLoading && !isError && tasks.length === 0 && (
            <div className="text-muted-foreground px-3 py-4 text-xs">
              No open tasks. Either you’re a machine… or someone forgot to
              assign you work.
            </div>
          )}

          <ul className="flex flex-col gap-1 p-2">
            {tasks.map((t) => {
              const overdue = isOverdue(t.dueAt, t.status);
              const unseen =
                !t.seenAt ||
                new Date(t.updatedAt).getTime() > new Date(t.seenAt).getTime();
              return (
                <li
                  key={t._id}
                  className={cn(
                    "hover:bg-muted/70 flex cursor-pointer flex-col rounded-md px-2 py-2 text-xs",
                    overdue && "bg-destructive/10",
                    unseen && "bg-muted" // similar to notifications
                  )}
                  onClick={async () => {
                    setOpen(false);
                    // Optimistic UX: badge drops immediately if you store local state
                    // (optional depending on your hook design)

                    try {
                      await fetch(`/api/tasks/${t._id}/seen`, {
                        method: "PATCH",
                        credentials: "include",
                      });
                    } catch (e) {
                      console.error("Failed to mark task seen", e);
                    }

                    router.push(`/tasks?focus=${t._id}`);
                  }}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={cn(
                        "text-xs font-medium",
                        overdue && "text-destructive"
                      )}
                    >
                      {t.title}
                    </span>
                    <span className="text-muted-foreground whitespace-nowrap text-[10px]">
                      {formatRelative(t.updatedAt)}
                    </span>
                  </div>

                  <div className="mt-1 flex items-center justify-between">
                    <span className="text-muted-foreground text-[11px]">
                      {t.status.replaceAll("_", " ")} • {t.priority}
                      {t.dueAt
                        ? ` • Due ${new Date(t.dueAt).toLocaleDateString()}`
                        : ""}
                    </span>
                    {overdue && (
                      <span className="text-destructive text-[10px] font-semibold">
                        OVERDUE
                      </span>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
