import Loading from '@/app/components/ui/loading';
import { ClockCircleOutlined, DeleteOutlined, EditOutlined, EnvironmentOutlined, LinkOutlined, TeamOutlined } from '@ant-design/icons';
import type { EventDropArg, EventRemoveArg } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin, { Draggable } from '@fullcalendar/interaction';
import FullCalendar from '@fullcalendar/react';
import timeGridPlugin from '@fullcalendar/timegrid';
import { Alert, Badge, Button, Descriptions, Divider, Drawer, Flex, Skeleton, Space, Tag, Typography } from 'antd';
import dayjs from 'dayjs';
import localizedFormat from 'dayjs/plugin/localizedFormat';
import utc from 'dayjs/plugin/utc';
import { useEffect, useRef, useState } from 'react';
import sweetAlert from 'sweetalert';
import { getEventPalette } from './event-palette';


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

const toTitleCase = (value?: string | null) =>
  value
    ? value
      .toLowerCase()
      .split(' ')
      .map((word) => (word ? word[0].toUpperCase() + word.slice(1) : word))
      .join(' ')
    : undefined;

const formatKey = (value?: string | null) =>
  value ? toTitleCase(value.replace(/[_-]+/g, ' ')) : undefined;

const normalizeId = (value: any): string | null => {
  if (!value) return null;
  if (typeof value === 'string') return value;
  if (typeof value === 'object') {
    if ('$oid' in value) return (value as any).$oid;
    if (typeof (value as any).toString === 'function') return (value as any).toString();
  }
  return null;
};

const FUNERAL_MILESTONE_BY_EVENT_TYPE: Record<string, { label: string; field: 'pickUp' | 'bathing' | 'tentErection' | 'delivery' | 'serviceEscort' | 'burial' }> = {
  funeral_pickup: { label: 'Pickup', field: 'pickUp' },
  funeral_bathing: { label: 'Family Bathing', field: 'bathing' },
  funeral_tent: { label: 'Tent Erection', field: 'tentErection' },
  funeral_delivery: { label: 'Delivery', field: 'delivery' },
  funeral_service: { label: 'Service Escort', field: 'serviceEscort' },
  funeral_burial: { label: 'Burial', field: 'burial' },
};

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
  const [eventDetailsDrawerOpen, setEventDetailsDrawerOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [funeralDetails, setFuneralDetails] = useState<any | null>(null);
  const [funeralLoading, setFuneralLoading] = useState(false);
  const [funeralError, setFuneralError] = useState<string | null>(null);
  const calendarRef = useRef<FullCalendar | null>(null);
  const latestFuneralRequestRef = useRef(0);

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
    const eventData = eventInfo.event.extendedProps || {};
    const palette = eventData.palette || getEventPalette(eventData);
    const name = eventData.name || eventInfo.event.title;
    const startTimeRaw = eventData.startTime as string | undefined;
    const startTime = startTimeRaw
      ? startTimeRaw.split(':').slice(0, 2).join(':')
      : eventInfo.timeText;
    const typeLabel = formatKey(eventData.subType || eventData.milestone || eventData.type);

    return (
      <div
        className="w-full flex flex-col gap-0.5 px-2 py-1 text-xs font-semibold cursor-pointer rounded-sm shadow-sm transition-colors"
        style={{
          backgroundColor: palette.background,
          color: palette.text,
          borderLeft: `3px solid ${palette.border}`,
        }}
      >
        {typeLabel && (
          <span className="text-[10px] font-semibold uppercase tracking-wide opacity-80">
            {typeLabel}
          </span>
        )}
        <p className="truncate">{name.split(": ")[1] || name}</p>
        {startTime && <p className="text-[11px] font-medium">{startTime}</p>}
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

  useEffect(() => {
    if (!eventDetailsDrawerOpen) {
      setFuneralLoading(false);
      return;
    }

    if (!selectedEvent || selectedEvent.relatedModel !== 'funeral') {
      setFuneralDetails(null);
      setFuneralError(null);
      setFuneralLoading(false);
      return;
    }

    const relatedId = normalizeId(selectedEvent.relatedId);
    if (!relatedId) {
      setFuneralDetails(null);
      setFuneralLoading(false);
      setFuneralError('Missing linked funeral reference.');
      return;
    }

    latestFuneralRequestRef.current += 1;
    const requestId = latestFuneralRequestRef.current;

    setFuneralLoading(true);
    setFuneralError(null);

    const loadFuneral = async () => {
      try {
        const res = await fetch(`/api/funerals/${relatedId}`);
        const data = await res.json();
        if (!res.ok || !data?.success) {
          throw new Error(data?.message || 'Failed to load funeral details.');
        }
        if (latestFuneralRequestRef.current === requestId) {
          setFuneralDetails(data.funeral ?? null);
        }
      } catch (error: any) {
        if (latestFuneralRequestRef.current === requestId) {
          setFuneralDetails(null);
          setFuneralError(error?.message || 'Failed to load funeral details.');
        }
      } finally {
        if (latestFuneralRequestRef.current === requestId) {
          setFuneralLoading(false);
        }
      }
    };

    loadFuneral();
  }, [eventDetailsDrawerOpen, selectedEvent?.relatedModel, selectedEvent?.relatedId]);

  // Build a normalized view model from selectedEvent and the FC event core fields you added
  const details = selectedEvent && {
    title: selectedEvent.name || selectedEvent.title || 'Untitled',
    type: selectedEvent.type,
    status: selectedEvent.status ?? 'draft',
    startISO: selectedEvent.startISO || selectedEvent.start,
    endISO: selectedEvent.endISO || selectedEvent.end,
    allDay: !!selectedEvent.allDay || !!selectedEvent.isAllDayEvent,
    location: selectedEvent.location,
    description: selectedEvent.description,
    attendees: Array.isArray(selectedEvent.attendees) ? selectedEvent.attendees : [],
    milestone: selectedEvent.milestone || selectedEvent.subType,
    palette: selectedEvent.palette || getEventPalette(selectedEvent),
  };

  const typeTagLabel = formatKey(details?.milestone || details?.type);
  const milestoneKey = String(selectedEvent?.milestone || selectedEvent?.type || '').toLowerCase();
  const funeralMilestoneMeta = FUNERAL_MILESTONE_BY_EVENT_TYPE[milestoneKey];
  const funeralMilestoneSlot = funeralMilestoneMeta && funeralDetails ? funeralDetails[funeralMilestoneMeta.field] : undefined;

  const funeralDetailsContent = (() => {
    if (funeralLoading) {
      return <Skeleton active title={false} paragraph={{ rows: 4 }} />;
    }
    if (funeralError) {
      return (
        <Alert
          type="error"
          showIcon
          message="Unable to load funeral"
          description={funeralError}
        />
      );
    }
    if (!funeralDetails) {
      return <Text type="secondary">No additional funeral details available.</Text>;
    }

    const deceasedName = `${funeralDetails.deceased?.firstName ?? ''} ${funeralDetails.deceased?.lastName ?? ''}`.trim() || '—';
    const informantName = `${funeralDetails.informant?.firstName ?? ''} ${funeralDetails.informant?.lastName ?? ''}`.trim();
    const informantContact = [funeralDetails.informant?.phoneNumber, funeralDetails.informant?.email].filter(Boolean).join(' • ');
    const milestoneRange = funeralMilestoneSlot?.startDateTime
      ? fmtRange(
        funeralMilestoneSlot.startDateTime ? new Date(funeralMilestoneSlot.startDateTime).toISOString() : undefined,
        funeralMilestoneSlot.endDateTime ? new Date(funeralMilestoneSlot.endDateTime).toISOString() : undefined,
        false
      )
      : undefined;
    const milestoneLocation = funeralMilestoneSlot?.location ? asLocationText(funeralMilestoneSlot.location) : undefined;

    const items = [
      {
        key: 'reference',
        label: 'Reference',
        children: (
          <Space>
            {funeralDetails.referenceNumber ? <Text code>{funeralDetails.referenceNumber}</Text> : '—'}
            {funeralDetails.status && (
              <Tag color={
                funeralDetails.status === 'completed'
                  ? 'green'
                  : funeralDetails.status === 'in_progress'
                    ? 'blue'
                    : funeralDetails.status === 'cancelled'
                      ? 'red'
                      : 'gold'
              }>
                {String(formatKey(funeralDetails.status))}
              </Tag>
            )}
          </Space>
        ),
      },
      {
        key: 'deceased',
        label: 'Deceased',
        children: (
          <Space direction="vertical" size={0}>
            <Text>{deceasedName}</Text>
            {funeralDetails.deceased?.dateOfDeath && (
              <Text type="secondary">
                Date of death: {dayjs(funeralDetails.deceased.dateOfDeath).format('ddd, D MMM YYYY')}
              </Text>
            )}
          </Space>
        ),
      },
      {
        key: 'informant',
        label: 'Informant',
        children: (
          <Space direction="vertical" size={0}>
            <Text>{informantName || '—'}</Text>
            {informantContact && <Text type="secondary">{informantContact}</Text>}
          </Space>
        ),
      },
      funeralMilestoneMeta && {
        key: 'milestone',
        label: `${funeralMilestoneMeta.label} Details`,
        children: (
          <Space direction="vertical" size={2}>
            {milestoneRange && <Text>{milestoneRange}</Text>}
            {(milestoneLocation || funeralMilestoneSlot?.notes) && (
              <div>
                {milestoneLocation && <div>{milestoneLocation}</div>}
                {funeralMilestoneSlot?.notes && (
                  <Text type="secondary">{funeralMilestoneSlot.notes}</Text>
                )}
              </div>
            )}
          </Space>
        ),
      },
      (funeralDetails.cemetery || funeralDetails.branchId) && {
        key: 'location',
        label: 'Location',
        children: (
          <Space direction="vertical" size={0}>
            {funeralDetails.cemetery && <Text>{funeralDetails.cemetery}</Text>}
            {funeralDetails.branchId && <Text type="secondary">Branch: {funeralDetails.branchId}</Text>}
          </Space>
        ),
      },
      funeralDetails.notes && {
        key: 'notes',
        label: 'Notes',
        children: (
          <Paragraph style={{ marginBottom: 0 }} ellipsis={{ rows: 3, expandable: true }}>
            {funeralDetails.notes}
          </Paragraph>
        ),
      },
    ].filter(Boolean) as any;

    return <Descriptions column={1} size="small" items={items} />;
  })();

  const statusLabel = details?.status ? formatKey(details.status) : undefined;
  const statusTagColor =
    details?.status === 'published'
      ? 'green'
      : details?.status === 'cancelled'
        ? 'red'
        : details?.status === 'draft'
          ? 'gold'
          : details?.status
            ? 'blue'
            : undefined;
  const typeTagStyle = details?.palette
    ? {
      backgroundColor: details.palette.background,
      color: details.palette.text,
      borderColor: details.palette.border,
    }
    : undefined;
  const typeTagColorFallback = typeTagStyle ? undefined : 'gold';

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
            const eventData = info.event.extendedProps || {};
            setSelectedEvent({
              ...eventData,
              // surface core fields too
              id: info.event.id,
              title: info.event.title,
              startISO: info.event.start?.toISOString(),
              endISO: info.event.end?.toISOString(),
              allDay: info.event.allDay,
            });
            setFuneralDetails(null);
            setFuneralError(null);
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
            {statusLabel && (
              <Tag color={statusTagColor}>
                {statusLabel.toUpperCase()}
              </Tag>
            )}
            {typeTagLabel && (
              <Tag style={typeTagStyle} color={typeTagColorFallback}>
                {typeTagLabel}
              </Tag>
            )}
          </Space>
        </Flex>}
        placement="right"
        width="40%"
        open={eventDetailsDrawerOpen}
        onClose={() => {
          setEventDetailsDrawerOpen(false);
          setSelectedEvent(null);
          setFuneralDetails(null);
          setFuneralError(null);
          setFuneralLoading(false);
          latestFuneralRequestRef.current += 1;
        }}
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

            {selectedEvent?.relatedModel === 'funeral' && (
              <>
                <Divider className="my-2" />
                <div>
                  <Space style={{ marginBottom: 8 }}>
                    <Text strong>Funeral Details</Text>
                    {funeralMilestoneMeta?.label && (
                      <Tag style={typeTagStyle} color={typeTagColorFallback}>
                        {funeralMilestoneMeta.label}
                      </Tag>
                    )}
                  </Space>
                  {funeralDetailsContent}
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
