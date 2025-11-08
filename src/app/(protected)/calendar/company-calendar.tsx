import React, { useEffect, useRef, useState } from 'react';
import timeGridPlugin from '@fullcalendar/timegrid';
import dayGridPlugin from '@fullcalendar/daygrid';
import FullCalendar from '@fullcalendar/react';
import type { EventDropArg, EventRemoveArg } from '@fullcalendar/core';
import interactionPlugin, { Draggable } from '@fullcalendar/interaction';
import Loading from '@/app/components/ui/loading';
import sweetAlert from 'sweetalert';
import { Badge, Descriptions, Divider, Tag, Typography, Space, Button, Popconfirm, Drawer, Flex } from 'antd';
import { ClockCircleOutlined, EnvironmentOutlined, TeamOutlined, EditOutlined, DeleteOutlined, LinkOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import localizedFormat from 'dayjs/plugin/localizedFormat';


dayjs.extend(utc);
dayjs.extend(localizedFormat);

const fmtRange = (
  startISO?: string,
  endISO?: string,
  allDay?: boolean
) => {
  if (!startISO) return '—';

  const s = dayjs(startISO);
  const e = endISO ? dayjs(endISO) : null;

  if (allDay) {
    // All-day: show date only; if multi-day, show range of dates
    if (e && !s.isSame(e, 'day')) {
      return `${s.format('ddd, D MMM YYYY')} → ${e.format('ddd, D MMM YYYY')} (All day)`;
    }
    return `${s.format('ddd, D MMM YYYY')} (All day)`;
  }

  // Timed event
  if (e && !s.isSame(e, 'day')) {
    // Cross-day event
    return `${s.format('ddd, D MMM YYYY HH:mm')} → ${e.format('ddd, D MMM YYYY HH:mm')}`;
  }
  // Same day
  const endTime = e ? e.format('HH:mm') : '';
  return `${s.format('ddd, D MMM YYYY')} • ${s.format('HH:mm')}${endTime ? '–' + endTime : ''}`;
};

const asLocationText = (loc?: any) => {
  if (!loc) return '—';
  if (typeof loc === 'string') return loc;
  const parts = [loc.name, loc.address].filter(Boolean);
  return parts.join(' · ') || '—';
};

const googleMapsHref = (loc?: any) => {
  if (!loc) return undefined;
  if (typeof loc === 'string') {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(loc)}`;
  }
  if (loc.latitude && loc.longitude) {
    return `https://www.google.com/maps/search/?api=1&query=${loc.latitude},${loc.longitude}`;
  }
  if (loc.address || loc.name) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
      `${loc.name ?? ''} ${loc.address ?? ''}`.trim()
    )}`;
  }
  return undefined;
};

const { Paragraph, Text } = Typography;

interface CompanyEvent {
  id: string;
  title: string;
  start: string;          // ISO datetime
  end?: string;           // ISO datetime
  allDay?: boolean;
  // Everything else goes in extendedProps
  extendedProps?: {
    name?: string;
    description?: string;
    location?: string;
    type?: 'funeral' | 'meeting' | 'shift' | string;
    startTime?: string;   // "HH:mm:ss" or "HH:mm"
    [key: string]: any;
  };
}

interface IProps {
  events: CompanyEvent[];
  loading: boolean;
  /**
   * Persist server-side updates when an event is moved or resized.
   * Return `true` to accept the change, or `false` (or throw) to revert.
   */
  onEventChange?: (updated: {
    id: string;
    start: string | null; // ISO
    end: string | null;   // ISO
    allDay: boolean;
    extendedProps: Record<string, any>;
    action: 'move' | 'resize' | 'receive';
  }) => Promise<boolean> | boolean;
  /**
   * Optional external draggable items container id (see ExternalDraggables below).
   */
  externalDraggablesContainerId?: string;
}

const CompanyCalendar = ({
  events = [],
  loading = false,
  onEventChange,
  externalDraggablesContainerId,
}: IProps) => {
  console.log("🚀 ~ CompanyCalendar ~ events:", events)
  const [eventDetailsDrawerOpen, setEventDetailsDrawerOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const calendarRef = useRef<FullCalendar | null>(null);

  // Enable dragging from an external list if provided
  useEffect(() => {
    if (!externalDraggablesContainerId) return;
    const containerEl = document.getElementById(externalDraggablesContainerId);
    if (!containerEl) return;

    // Each child of containerEl with class .fc-draggable becomes draggable
    // and must carry data-event JSON in a data attribute.
    new Draggable(containerEl, {
      itemSelector: '.fc-draggable',
      eventData: (el) => {
        const payload = el.getAttribute('data-event');
        try {
          const parsed = payload ? JSON.parse(payload) : {};
          // Minimum fields FullCalendar expects:
          return {
            title: parsed.title || el.getAttribute('data-title') || 'Untitled',
            start: parsed.start || undefined,
            end: parsed.end || undefined,
            allDay: !!parsed.allDay,
            extendedProps: parsed.extendedProps || {},
          };
        } catch {
          return { title: el.textContent?.trim() || 'Untitled' };
        }
      },
    });
  }, [externalDraggablesContainerId]);

  const calendarViews = ['timeGridDay', 'dayGridWeek', 'dayGridMonth'];

  const renderEventContent = (eventInfo: any) => {
    console.log("🚀 ~ renderEventContent ~ eventInfo:", eventInfo)
    // Prefer extendedProps.name but safely fall back to title
    const { extendedProps } = eventInfo.event;
    const { type } = extendedProps.extendedProps;
    const name = extendedProps?.name || eventInfo.event.title;

    const startTimeRaw = extendedProps?.startTime as string | undefined;
    const startTime = startTimeRaw
      ? startTimeRaw.split(':').slice(0, 2).join(':')
      : eventInfo.timeText; // calendar's computed time if not provided

    console.log("🚀 ~ renderEventContent ~ type:", type)
    const bgColor = type === "funeral_burial" ? "bg-primary" : "bg-gray-200";

    return (
      <div className={`flex flex-col px-2 py-1 text-xs font-bold cursor-pointer ${bgColor} text-black dark:text-black hover:bg-orange-500 rounded-r-lg shadow-sm`}>
        <p className="truncate">{name}</p>
        {startTime && <p>{startTime}</p>}
      </div>
    );
  };

  const confirmOrRevert = async (
    prompt: string,
    proceed: () => Promise<boolean> | boolean,
    revert: () => void
  ) => {
    const ok = await new Promise<boolean>((resolve) => {
      sweetAlert({
        title: 'Confirm change',
        text: prompt,
        icon: 'warning',
        buttons: ['Cancel', 'Confirm'],
        dangerMode: false,
      }).then((willDo: boolean) => resolve(!!willDo));
    });

    if (!ok) {
      revert();
      return;
    }

    try {
      const accepted = await proceed();
      if (!accepted) revert();
    } catch {
      revert();
    }
  };

  const handleEventDrop = (info: EventDropArg) => {
    const { event, revert } = info;
    console.log("🚀 ~ handleEventDrop ~ event:", event)

    confirmOrRevert(
      'Move this event to the new date/time?',
      async () => {
        if (!onEventChange) return true;
        return onEventChange({
          id: event.extendedProps.id,
          start: event.start ? event.start.toISOString() : null,
          end: event.end ? event.end.toISOString() : null,
          allDay: event.allDay,
          extendedProps: { ...event.extendedProps },
          action: 'move',
        });
      },
      revert
    );
  };

  const handleEventResize = (info: any) => {
    const { event, revert } = info;

    confirmOrRevert(
      'Change this event’s duration?',
      async () => {
        if (!onEventChange) return true;
        return onEventChange({
          id: event.extendedProps.id,
          start: event.start ? event.start.toISOString() : null,
          end: event.end ? event.end.toISOString() : null,
          allDay: event.allDay,
          extendedProps: { ...event.extendedProps },
          action: 'resize',
        });
      },
      revert
    );
  };

  const handleEventReceive = (info: EventRemoveArg) => {
    const { event, revert } = info;
    // If the external item had no id, FullCalendar generates one; your API can return
    // a "real" id and you can set it with event.setProp('id', newId)
    confirmOrRevert(
      'Add this item to the calendar?',
      async () => {
        if (!onEventChange) return true;
        const accepted = await onEventChange({
          id: event.extendedProps.id,
          start: event.start ? event.start.toISOString() : null,
          end: event.end ? event.end.toISOString() : null,
          allDay: event.allDay,
          extendedProps: { ...event.extendedProps },
          action: 'receive',
        });
        return accepted;
      },
      revert
    );
  };

  console.log("🚀 ~ CompanyCalendar ~ selectedEvent:", selectedEvent)
  // Build a normalized view model from selectedEvent and the FC event core fields you added
  const details = selectedEvent && {
    title: selectedEvent.name || selectedEvent.title || 'Untitled',
    type: selectedEvent.extendedProps.type,
    status: selectedEvent.extendedProps.status ?? 'draft',
    startISO: selectedEvent.startISO || selectedEvent.start, // you set this on click earlier
    endISO: selectedEvent.endISO || selectedEvent.end,
    allDay: !!selectedEvent.allDay || !!selectedEvent.isAllDayEvent,
    location: selectedEvent.extendedProps.location,
    description: selectedEvent.extendedProps.description,
    attendees: Array.isArray(selectedEvent.extendedProps.attendees) ? selectedEvent.extendedProps.attendees : [],
  };

  const selectedEventStartTime =
    selectedEvent?.startTime
      ? selectedEvent.startTime.split(':').slice(0, 2).join(':')
      : undefined;

  return (
    <div className="">
      {loading ? (
        <Loading type="fullscreen" message="Loading calendar events..." />
      ) : (
        <FullCalendar
          ref={calendarRef as any}
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          weekends
          height="auto"
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay',
          }}
          views={{
            timeGridDay: { slotDuration: '00:30:00' },
            timeGridWeek: { slotDuration: '00:30:00' },
          }}
          events={events}
          eventContent={renderEventContent}
          eventClick={(info) => {
            setSelectedEvent({
              ...info.event.extendedProps,
              // surface core fields too
              id: info.event.id,
              title: info.event.title,
              startISO: info.event.start?.toISOString(),
              endISO: info.event.end?.toISOString(),
              allDay: info.event.allDay,
            });
            setEventDetailsDrawerOpen(true);
          }}
          // 🔑 Enable drag + resize
          editable
          eventStartEditable
          eventDurationEditable
          droppable={!!externalDraggablesContainerId}
          // Optional: prevent overlapping if you model shifts/roster
          // eventOverlap={false}
          // Optional: business hours visualization
          // businessHours={{ daysOfWeek: [1,2,3,4,5], startTime: '08:00', endTime: '17:00' }}
          // Handlers
          eventDrop={handleEventDrop}
          eventResize={handleEventResize}
          eventRemove={handleEventReceive}
        />
      )}

      {/* Event Details Drawer */}
      <Drawer
        title={<Flex justify="space-between" align="center">
          <Text>{details?.title}</Text>
          <Space>
            <Tag color={details?.status === 'published' ? 'green' : details?.status === 'cancelled' ? 'red' : 'gold'}>
              {String(details?.status).toUpperCase()}
            </Tag>
            {details?.type && <Tag color={details?.type === 'funeral' ? 'red' : details?.type === 'meeting' ? 'blue' : details?.type === 'shift' ? 'green' : 'gold'}>{String(details?.type).toUpperCase()}</Tag>}
          </Space>
        </Flex>}
        placement="right"
        width="40%"
        open={eventDetailsDrawerOpen}
        onClose={() => setEventDetailsDrawerOpen(false)}
        destroyOnClose
        footer={
          <Space>
            <Button type="primary" className="text-black" icon={<EditOutlined />} onClick={() => {/* open edit drawer/modal */ }}>
              Edit
            </Button>
            <Button danger icon={<DeleteOutlined />} onClick={() => {
              // await fetch(`/api/calendar/events/${selectedEvent.id}`, { method: 'DELETE' });
              // fetchEvents(); setEventDetailsDrawerOpen(false);
            }}>Delete</Button>
          </Space>
        }
      >
        {details && (
          // Bathing Details: Time of Bathing, Address
          // Tent Erection Details: Time of Erection, Address, Equipment (Tent Package) 
          // Delivery Details: Grave Marker, Time of Delivery, Address, Programs, Via (Detour with address), Family Escorting Coffin?, Equipment (Screen, Chest Truck) 
          // Burial Details: Cemetery, Time of Burial, Address, Coffin Type
          // Tent Collection Details: Time of Collection, Address
          <div className="space-y-4">
            {/* When & Where */}
            <Descriptions
              column={1}
              items={[
                {
                  key: 'when',
                  label: 'When',
                  children: (
                    <Space>
                      <ClockCircleOutlined />
                      <Text>{fmtRange(details.startISO, details.endISO, details.allDay)}</Text>
                    </Space>
                  ),
                },
                {
                  key: 'where',
                  label: 'Location',
                  children: (
                    <Space align="start">
                      <EnvironmentOutlined />
                      <div>
                        <div>{asLocationText(details.location)} | {googleMapsHref(details.location) && <a href={googleMapsHref(details.location)} target="_blank" rel="noreferrer"> Open in Maps <LinkOutlined /></a>}</div>
                        
                      </div>
                    </Space>
                  ),
                },
              ]}
            />

            {/* Attendees */}
            {!!details.attendees?.length && (
              <>
                <Divider className="my-2" />
                <div>
                  <Space style={{ marginBottom: 8 }}>
                    <TeamOutlined />
                    <Text strong>Attendees</Text>
                  </Space>
                  <Space wrap>
                    {details.attendees.map((a: any, i: number) => {
                      const label = a?.name || a?.email || a?.phone || 'Attendee';
                      return <Badge key={i} status="processing" text={label} />;
                    })}
                  </Space>
                </div>
              </>
            )}

            {/* Description (collapsible / copyable) */}
            {details.description && (
              <>
                <Divider className="my-2" />
                <div>
                  <Text strong>Description</Text>
                  <Paragraph style={{ marginTop: 4 }} ellipsis={{ rows: 4, expandable: true, symbol: 'more' }} copyable>
                    {details.description}
                  </Paragraph>
                </div>
              </>
            )}

            <Divider className="my-2" />
          </div>
        )}
      </Drawer>
    </div>
  );
};

export default CompanyCalendar;
