"use client";

import { Bell, CheckCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/app/components/ui/button";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/app/components/ui/popover";
import { ScrollArea } from "@/app/components/ui/scroll-area";
import { useNotifications } from "@/app/hooks/use-notifications";
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

export function NotificationBell() {
    const router = useRouter();
    const [open, setOpen] = useState(false);

    const {
        notifications,
        unreadCount,
        isLoading,
        isError,
        refetch,
        markAsReadLocal,
        markAllAsReadLocal,
    } = useNotifications({
        unreadOnly: false,
        pollIntervalMs: 15_000,
        limit: 30,
    });

    const handleMarkAsRead = async (id: string, link?: string) => {
        // optimistic
        markAsReadLocal(id);

        try {
            await fetch(`/api/notifications/${id}/read`, {
                method: "PATCH",
                credentials: "include",
            });
        } catch (err) {
            console.error("Failed to mark notification as read", err);
            refetch();
        }

        if (link) {
            setOpen(false);
            router.push(link);
        }
    };

    const handleMarkAllAsRead = async () => {
        if (!unreadCount) return;

        markAllAsReadLocal();

        try {
            await fetch(`/api/notifications/read-all`, {
                method: "PATCH",
                credentials: "include",
            });
        } catch (err) {
            console.error("Failed to mark all notifications as read", err);
            refetch();
        }
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="relative"
                    aria-label="Notifications"
                >
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <span className="absolute -right-1 -top-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1 text-xs font-semibold text-destructive-foreground">
                            {unreadCount > 9 ? "9+" : unreadCount}
                        </span>
                    )}
                </Button>
            </PopoverTrigger>

            <PopoverContent
                align="end"
                className="z-50 min-w-96 p-0 rounded-md bg-white text-gray-900 border shadow-lg"
            // or if you're leaning into shadcn tokens:
            // className="z-50 min-w-96 p-0 rounded-md bg-card text-card-foreground border shadow-lg"
            >
                <div className="flex items-center justify-between border-b px-3 py-2">
                    <span className="text-sm font-medium">Notifications</span>

                    <button
                        type="button"
                        onClick={handleMarkAllAsRead}
                        disabled={!unreadCount}
                        className={cn(
                            "flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground",
                            !unreadCount && "cursor-not-allowed opacity-40"
                        )}
                    >
                        <CheckCheck className="h-3 w-3" />
                        Mark all as read
                    </button>
                </div>

                <ScrollArea className="h-80">
                    {isLoading && (
                        <div className="px-3 py-4 text-xs text-muted-foreground">
                            Loading…
                        </div>
                    )}

                    {isError && !isLoading && (
                        <div className="px-3 py-4 text-xs text-destructive">
                            Failed to load notifications.
                        </div>
                    )}

                    {!isLoading && !isError && notifications.length === 0 && (
                        <div className="px-3 py-4 text-xs text-muted-foreground">
                            No notifications yet.
                        </div>
                    )}

                    <ul className="flex flex-col gap-1 p-2">
                        {notifications.map((n) => {
                            const isUnread = !n.readAt;
                            return (
                                <li
                                    key={n._id}
                                    className={cn(
                                        "flex cursor-pointer flex-col rounded-md px-2 py-2 text-xs hover:bg-muted/70",
                                        isUnread && "bg-muted"
                                    )}
                                    onClick={() => handleMarkAsRead(n._id, n.link)}
                                >
                                    <div className="flex items-center justify-between gap-2">
                                        <span className="font-medium text-xs">{n.title}</span>
                                        <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                                            {formatRelative(n.createdAt)}
                                        </span>
                                    </div>
                                    <p className="mt-1 line-clamp-2 text-[11px] text-muted-foreground">
                                        {n.message}
                                    </p>
                                </li>
                            );
                        })}
                    </ul>
                </ScrollArea>
            </PopoverContent>
        </Popover>
    );
}
