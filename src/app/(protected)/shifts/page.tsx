"use client";

import React, { useEffect, useState } from "react";

import { PlusOutlined, SwapOutlined } from "@ant-design/icons";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import FullCalendar from "@fullcalendar/react";
import { Button, Drawer, Tag } from "antd";
import dayjs, { Dayjs } from "dayjs";

import PageHeader from "@/app/components/page-header";
import { getAllShiftsForCalendar } from "@/server/actions/shifts";

interface CalendarShift {
  id: string;
  weekendStart: string;
  saturday: { _id: string; name: string }[];
  sunday: { _id: string; name: string }[];
  groupNote?: string;
}

const ShiftsPage = () => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedShift, setSelectedShift] = useState<CalendarShift | null>(
    null
  );
  const [events, setEvents] = useState<any[]>([]);

  useEffect(() => {
    const loadShifts = async () => {
      const result = await getAllShiftsForCalendar();

      if (!Array.isArray(result)) {
        console.error("Failed to load shifts:", result.message);
        return;
      }

      const parsedEvents = result.flatMap((shift) => [
        ...shift.saturday.map((user) => ({
          title: `Sat: ${user.name}`,
          start: shift.weekendStart,
          allDay: true,
          extendedProps: { ...shift, day: "Saturday" },
        })),
        ...shift.sunday.map((user) => ({
          title: `Sun: ${user.name}`,
          start: dayjs(shift.weekendStart).add(1, "day").toISOString(),
          allDay: true,
          extendedProps: { ...shift, day: "Sunday" },
        })),
      ]);

      setEvents(parsedEvents);
    };

    loadShifts();
  }, []);

  const handleEventClick = (info: any) => {
    setSelectedShift(info.event.extendedProps);
    setDrawerOpen(true);
  };

  return (
    <div style={{ padding: 20 }}>
      <PageHeader
        title="Weekend Roster"
        subtitle="View, manage, and request shift swaps"
        actions={[
          <Button icon={<PlusOutlined />} key="add">
            Add Shift
          </Button>,
        ]}
      />

      <FullCalendar
        plugins={[dayGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        weekends={true}
        events={events}
        eventClick={handleEventClick}
        height="auto"
      />

      <Drawer
        title={`Shift Details`}
        placement="right"
        width={400}
        onClose={() => setDrawerOpen(false)}
        open={drawerOpen}
      >
        {selectedShift ? (
          <div className="space-y-4">
            <div>
              <p className="font-semibold">Saturday:</p>
              {selectedShift.saturday.map((u) => (
                <Tag key={u._id}>{u.name}</Tag>
              ))}
            </div>
            <div>
              <p className="font-semibold">Sunday:</p>
              {selectedShift.sunday.map((u) => (
                <Tag key={u._id}>{u.name}</Tag>
              ))}
            </div>
            {selectedShift.groupNote && (
              <div>
                <p className="font-semibold">Group Note:</p>
                <p>{selectedShift.groupNote}</p>
              </div>
            )}
            <div>
              <Button icon={<SwapOutlined />} type="primary" block>
                Request Swap
              </Button>
            </div>
          </div>
        ) : null}
      </Drawer>
    </div>
  );
};

export default ShiftsPage;
