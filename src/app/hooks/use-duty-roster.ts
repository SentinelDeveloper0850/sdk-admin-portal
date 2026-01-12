import { useCallback, useEffect, useState } from "react";

export type DutyRosterStaffRow = {
  _id: string;
  name: string;
  initials?: string;
  userId: string | null;
  branch: string | null;
  position: string | null;
  isPortalUser: boolean;
};

export type DutyRosterResponse = {
  success: boolean;
  roster: null | {
    _id: string;
    date: string; // YYYY-MM-DD
    note: string;
    staff: DutyRosterStaffRow[];
  };
  message?: string;
};

export function useDutyRoster(dateKey: string) {
  const [loading, setLoading] = useState(true);
  const [roster, setRoster] = useState<DutyRosterResponse["roster"]>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/roster?date=${encodeURIComponent(dateKey)}`, { cache: "no-store" });
      const json = (await res.json()) as DutyRosterResponse;
      if (!json?.success) {
        throw new Error(json?.message || "Failed to load roster");
      }
      setRoster(json.roster ?? null);
    } catch (e: any) {
      setRoster(null);
      setError(e?.message || "Failed to load roster");
    } finally {
      setLoading(false);
    }
  }, [dateKey]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { loading, roster, error, refresh };
}

