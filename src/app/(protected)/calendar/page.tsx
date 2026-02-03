"use client";

import { useEffect, useMemo, useState } from "react";

import sweetAlert from "sweetalert";

import CompanyCalendar from "./company-calendar";
import { getEventPalette, paletteToFullCalendarColors } from "./event-palette";

const CalendarPage = () => {
  const [companyEvents, setCompanyEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const result = await fetch("/api/calendar/events?type=company");
      const data = await result.json();

      const events =
        data.events?.map((event: any) => ({
          ...event,
          id: event._id ?? event.id,
        })) || [];

      setCompanyEvents(events);
    } catch (error) {
      console.error("Error loading company events:", error);
      sweetAlert({
        title: "Error loading company events",
        text:
          error instanceof Error
            ? error.message
            : "Failed to load company events",
        icon: "error",
        timer: 2000,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const saveCalendarChange = async (payload: {
    id: string;
    start: string | null;
    end: string | null;
    allDay: boolean;
    extendedProps: Record<string, any>;
  }) => {
    const res = await fetch(`/api/calendar/events/${payload.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        start: payload.start,
        end: payload.end,
        allDay: payload.allDay,
        extendedProps: payload.extendedProps,
        action: "move", // or "resize"/"receive" if you want to log audit trails
      }),
    });
    if (!res.ok) {
      throw new Error(res.statusText);
    }
    return true;
  };

  const markMilestoneComplete = async (eventId: string) => {
    const res = await fetch(`/api/calendar/events/${eventId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: "completed",
        action: "complete",
      }),
    });

    let data: any = null;
    try {
      data = await res.json();
      console.log("🚀 ~ markMilestoneComplete ~ data:", data);
    } catch (error) {
      console.error("Error marking milestone as completed:", error);
      return false;
    }

    if (!res.ok || data?.success === false) {
      return false;
    }

    fetchEvents();

    return true;
  };

  const fcEvents = useMemo(() => {
    return companyEvents
      .map((e) => {
        const startISO = e.startDateTime
          ? new Date(e.startDateTime).toISOString()
          : e.start && !Number.isNaN(Date.parse(e.start))
            ? new Date(e.start).toISOString()
            : null;

        const endISO = e.endDateTime
          ? new Date(e.endDateTime).toISOString()
          : e.end && !Number.isNaN(Date.parse(e.end))
            ? new Date(e.end).toISOString()
            : null;

        if (!startISO) return null;

        const palette = getEventPalette(e);
        const colorProps = paletteToFullCalendarColors(palette);

        return {
          id: String(e._id || e.id),
          title: e.name || e.title,
          start: startISO,
          end: endISO || undefined,
          allDay: !!e.isAllDayEvent,
          ...colorProps,
          extendedProps: {
            ...e,
            palette,
          },
        };
      })
      .filter((e) => e !== null);
  }, [companyEvents]);

  return (
    <div className="flex flex-1 overflow-hidden">
      <div className="flex-1 space-y-6 p-6">
        {/* <PageHeader
          title="Company Calendar"
          subtitle="View and manage the company calendar"
        /> */}
        <CompanyCalendar
          events={fcEvents}
          loading={loading}
          onEventChange={saveCalendarChange}
          onRefresh={fetchEvents}
          onMarkMilestoneComplete={markMilestoneComplete}
        />
      </div>
    </div>
  );
};

export default CalendarPage;
