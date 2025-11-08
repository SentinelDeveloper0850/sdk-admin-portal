"use client";

import { useEffect, useMemo, useState } from 'react';

import PageHeader from '@/app/components/page-header';
import CompanyCalendar from './company-calendar';
import sweetAlert from 'sweetalert';

const CalendarPage = () => {
  const [companyEvents, setCompanyEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const result = await fetch('/api/calendar/events?type=company');
      const data = await result.json();

      const events = data.events?.map((event: any) => ({
        id: event._id,
        title: event.name,
        start: `${event.start}`,
        startTime: event.startTime,
        end: event.end,
        description: event.description,
        color: "#ffac00",
        textColor: "#000",
        extendedProps: { ...event },
      })) || [];
      console.log("🚀 ~ fetchEvents ~ events:", events)

      setCompanyEvents(events);
    } catch (error) {
      console.error("Error loading company events:", error);
      sweetAlert({
        title: "Error loading company events",
        text: error instanceof Error ? error.message : "Failed to load company events",
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

  const fcEvents = useMemo(() => {
    return companyEvents
      .map(e => {
        console.log("🚀 ~ CalendarPage ~ e:", e)
        const startISO = e.startDateTime
          ? new Date(e.startDateTime).toISOString()
          : (e.start && !Number.isNaN(Date.parse(e.start)) ? new Date(e.start).toISOString() : null);

        const endISO = e.endDateTime
          ? new Date(e.endDateTime).toISOString()
          : (e.end && !Number.isNaN(Date.parse(e.end)) ? new Date(e.end).toISOString() : null);

        return startISO ? {
          id: String(e._id || e.id),
          title: e.title,
          start: startISO,
          end: endISO || undefined,
          allDay: !!e.isAllDayEvent,
          extendedProps: { ...e },
        } : null;
      })
      .filter(e => e !== null)
  }, [companyEvents]);

  return (
    <div className="flex flex-1 overflow-hidden">
      <div className="flex-1 space-y-6 p-6">
        <PageHeader
          title="Company Calendar"
          subtitle="View and manage the company calendar"
        />
        <CompanyCalendar events={fcEvents} loading={loading} onEventChange={saveCalendarChange} />
      </div>
    </div>
  )
}

export default CalendarPage