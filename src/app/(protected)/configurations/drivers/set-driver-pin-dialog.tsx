"use client";

import { useState } from "react";

export default function SetDriverPinDialog({
    driverId,
    driverCode,
    hasPin,
}: {
    driverId: string;
    driverCode: string;
    hasPin: boolean;
}) {
    const [open, setOpen] = useState(false);
    const [pin, setPin] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function submit() {
        setError(null);

        const cleaned = pin.trim();
        if (!/^\d{4,6}$/.test(cleaned)) {
            setError("PIN must be 4–6 digits.");
            return;
        }

        setLoading(true);
        try {
            const res = await fetch("/api/admin/drivers/set-pin", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ driverId, pin: cleaned }),
            });

            const data = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(data?.error || "Failed to set PIN");

            // Close + refresh page to reflect "PIN set"
            setOpen(false);
            setPin("");
            window.location.reload();
        } catch (e: any) {
            setError(e?.message ?? "Something went wrong");
        } finally {
            setLoading(false);
        }
    }

    return (
        <>
            <button
                onClick={() => setOpen(true)}
                className="rounded-xl border px-3 py-2 text-xs font-semibold hover:bg-muted"
            >
                {hasPin ? "Rotate PIN" : "Set PIN"}
            </button>

            {open && (
                <div className="fixed inset-0 z-50">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/50"
                        onClick={() => !loading && setOpen(false)}
                    />

                    {/* Dialog */}
                    <div className="absolute left-1/2 top-1/2 w-[92vw] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border bg-background p-5 shadow-xl">
                        <div className="space-y-1">
                            <div className="text-lg font-bold">
                                {hasPin ? "Rotate PIN" : "Set PIN"} — {driverCode}
                            </div>
                            <div className="text-sm text-muted-foreground">
                                Enter a 4–6 digit PIN. The driver will use this to sign in on their phone.
                            </div>
                        </div>

                        <div className="mt-4 space-y-2">
                            <label className="text-xs font-semibold text-muted-foreground">
                                PIN (4–6 digits)
                            </label>
                            <input
                                value={pin}
                                onChange={(e) => setPin(e.target.value)}
                                inputMode="numeric"
                                pattern="\d*"
                                maxLength={6}
                                className="w-full rounded-xl border bg-background px-3 py-2 text-sm"
                                placeholder="e.g. 4286"
                                disabled={loading}
                            />

                            {error && (
                                <div className="text-sm text-red-600">{error}</div>
                            )}
                        </div>

                        <div className="mt-5 flex items-center justify-end gap-2">
                            <button
                                onClick={() => !loading && setOpen(false)}
                                className="rounded-xl border px-4 py-2 text-sm font-semibold hover:bg-muted"
                                disabled={loading}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={submit}
                                className="rounded-xl bg-black px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                                disabled={loading}
                            >
                                {loading ? "Saving..." : "Save PIN"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
