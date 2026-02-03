import { CSSProperties, useEffect, useMemo, useRef, useState } from "react";

import {
  CheckCircleFilled,
  CheckCircleOutlined,
  ClockCircleOutlined,
  DeleteOutlined,
  EditOutlined,
  EnvironmentOutlined,
  LinkOutlined,
  ReloadOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import type { EventDropArg, EventRemoveArg } from "@fullcalendar/core";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin, { Draggable } from "@fullcalendar/interaction";
import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import {
  Alert,
  Badge,
  Button,
  Descriptions,
  DescriptionsProps,
  Divider,
  Drawer,
  Flex,
  Select,
  Skeleton,
  Space,
  Tag,
  Typography,
  message,
} from "antd";
import dayjs from "dayjs";
import localizedFormat from "dayjs/plugin/localizedFormat";
import utc from "dayjs/plugin/utc";
import sweetAlert from "sweetalert";

import Loading from "@/app/components/ui/loading";
import { CalendarEventStatus } from "@/app/models/calendar-event.schema";

import { EventPalette, getEventPalette } from "./event-palette";

dayjs.extend(utc);
dayjs.extend(localizedFormat);

const fmtRange = (startISO?: string, endISO?: string, allDay?: boolean) => {
  if (!startISO) return "—";

  const s = dayjs(startISO);
  const e = endISO ? dayjs(endISO) : null;

  if (allDay) {
    // All-day: show date only; if multi-day, show range of dates
    if (e && !s.isSame(e, "day")) {
      return `${s.format("ddd, D MMM YYYY")} → ${e.format("ddd, D MMM YYYY")} (All day)`;
    }
    return `${s.format("ddd, D MMM YYYY")} (All day)`;
  }

  // Timed event
  if (e && !s.isSame(e, "day")) {
    // Cross-day event
    return `${s.format("ddd, D MMM YYYY HH:mm")} → ${e.format("ddd, D MMM YYYY HH:mm")}`;
  }
  // Same day
  const endTime = e ? e.format("HH:mm") : "";
  return `${s.format("ddd, D MMM YYYY")} • ${s.format("HH:mm")}${endTime ? "–" + endTime : ""}`;
};

const asLocationText = (loc?: any) => {
  if (!loc) return "—";
  if (typeof loc === "string") return loc;
  const parts = [loc.name, loc.address].filter(Boolean);
  return parts.join(" · ") || "—";
};

const googleMapsHref = (loc?: any) => {
  if (!loc) return undefined;
  if (typeof loc === "string") {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(loc)}`;
  }
  if (loc.latitude && loc.longitude) {
    return `https://www.google.com/maps/search/?api=1&query=${loc.latitude},${loc.longitude}`;
  }
  if (loc.address || loc.name) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
      `${loc.name ?? ""} ${loc.address ?? ""}`.trim()
    )}`;
  }
  return undefined;
};

const { Paragraph, Text } = Typography;

const toTitleCase = (value?: string | null) =>
  value
    ? value
        .toLowerCase()
        .split(" ")
        .map((word) => (word ? word[0].toUpperCase() + word.slice(1) : word))
        .join(" ")
    : undefined;

const formatKey = (value?: string | null) =>
  value ? toTitleCase(value.replace(/[_-]+/g, " ")) : undefined;

const normalizeId = (value: any): string | null => {
  if (!value) return null;
  if (typeof value === "string") return value;
  if (typeof value === "object") {
    if ("$oid" in value) return (value as any).$oid;
    if (typeof (value as any).toString === "function")
      return (value as any).toString();
  }
  return null;
};

const FUNERAL_MILESTONE_BY_EVENT_TYPE: Record<
  string,
  {
    label: string;
    field:
      | "pickUp"
      | "bathing"
      | "tentErection"
      | "delivery"
      | "serviceEscort"
      | "burial";
  }
> = {
  funeral_pickup: { label: "Pickup", field: "pickUp" },
  funeral_bathing: { label: "Family Bathing", field: "bathing" },
  funeral_tent: { label: "Tent Erection", field: "tentErection" },
  funeral_delivery: { label: "Delivery", field: "delivery" },
  funeral_service: { label: "Service Escort", field: "serviceEscort" },
  funeral_burial: { label: "Burial", field: "burial" },
};

interface CompanyEvent {
  id: string;
  title: string;
  start: string; // ISO datetime
  end?: string; // ISO datetime
  allDay?: boolean;
  // Everything else goes in extendedProps
  extendedProps?: {
    name?: string;
    description?: string;
    location?: string;
    type?: "funeral" | "meeting" | "shift" | string;
    startTime?: string; // "HH:mm:ss" or "HH:mm"
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
    end: string | null; // ISO
    allDay: boolean;
    extendedProps: Record<string, any>;
    action: "move" | "resize" | "receive";
  }) => Promise<boolean> | boolean;
  /**
   * Optional external draggable items container id (see ExternalDraggables below).
   */
  externalDraggablesContainerId?: string;
  /**
   * Refresh calendar events from the server.
   */
  onRefresh?: () => void;
  /**
   * Mark a funeral milestone as completed.
   * Return false to prevent the default success handling.
   */
  onMarkMilestoneComplete?: (
    eventId: string
  ) => Promise<boolean | void> | boolean | void;
}

interface EventDetailsViewModel {
  title: string;
  type?: string;
  status?: string;
  startISO?: string;
  endISO?: string;
  allDay?: boolean;
  location?: any;
  description?: string;
  attendees: any[];
  milestone?: string;
  palette?: EventPalette;
}

type DescriptionItem = NonNullable<DescriptionsProps["items"]>[number];

const formatDuration = (
  hours?: number | string | null,
  minutes?: number | string | null
) => {
  const toNumber = (value?: number | string | null) => {
    if (value === undefined || value === null) return 0;
    const num = typeof value === "number" ? value : Number(value);
    return Number.isFinite(num) ? num : 0;
  };
  const h = toNumber(hours);
  const m = toNumber(minutes);
  if (!h && !m) return undefined;
  const parts = [];
  if (h) parts.push(`${h} hr${h === 1 ? "" : "s"}`);
  if (m) parts.push(`${m} min${m === 1 ? "" : "s"}`);
  return parts.join(" ");
};

const formatDateTime = (value?: string | Date | null) => {
  if (!value) return undefined;
  return dayjs(value).format("ddd, D MMM YYYY • HH:mm");
};

const WhenWhereSection = ({ details }: { details: EventDetailsViewModel }) => (
  <Descriptions
    column={1}
    items={[
      {
        key: "when",
        label: "When",
        children: (
          <Space>
            <ClockCircleOutlined />
            <Text>
              {fmtRange(details.startISO, details.endISO, details.allDay)}
            </Text>
          </Space>
        ),
      },
      {
        key: "where",
        label: "Location",
        children: (
          <Space align="start">
            <EnvironmentOutlined />
            <div>
              <div>
                {asLocationText(details.location)}{" "}
                {googleMapsHref(details.location) && (
                  <a
                    href={googleMapsHref(details.location)}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {" "}
                    Open in Maps <LinkOutlined />
                  </a>
                )}
              </div>
            </div>
          </Space>
        ),
      },
    ]}
  />
);

const AttendeesSection = ({ details }: { details: EventDetailsViewModel }) => {
  if (!details.attendees?.length) return null;
  return (
    <>
      <Divider className="my-2" />
      <div>
        <Space style={{ marginBottom: 8 }}>
          <TeamOutlined />
          <Text strong>Attendees</Text>
        </Space>
        <Space wrap>
          {details.attendees.map((a: any, i: number) => {
            const label = a?.name || a?.email || a?.phone || "Attendee";
            return <Badge key={i} status="processing" text={label} />;
          })}
        </Space>
      </div>
    </>
  );
};

const DescriptionSection = ({
  details,
}: {
  details: EventDetailsViewModel;
}) => {
  if (!details.description) return null;
  return (
    <>
      <Divider className="my-2" />
      <div>
        <Text strong>Description</Text>
        <Paragraph
          style={{ marginTop: 4 }}
          ellipsis={{ rows: 4, expandable: true, symbol: "more" }}
          copyable
        >
          {details.description}
        </Paragraph>
      </div>
    </>
  );
};

const BaseEventSections = ({ details }: { details: EventDetailsViewModel }) => (
  <>
    <WhenWhereSection details={details} />
    <AttendeesSection details={details} />
    <DescriptionSection details={details} />
  </>
);

interface DrawerContentProps {
  details: EventDetailsViewModel;
  selectedEvent: any;
  funeralDetails: any;
  funeralLoading: boolean;
  funeralError: string | null;
  funeralDetailsContent: React.ReactNode;
  milestoneMeta?: {
    label: string;
    field:
      | "pickUp"
      | "bathing"
      | "tentErection"
      | "delivery"
      | "serviceEscort"
      | "burial";
  };
  milestoneSlot?: any;
  typeTagStyle?: CSSProperties;
  typeTagColorFallback?: string;
}

type DrawerRenderer = (props: DrawerContentProps) => JSX.Element | null;

const AdditionalDescriptionsSection = ({
  title,
  items,
}: {
  title: string;
  items: DescriptionItem[];
}) => {
  if (!items.length) return null;
  return (
    <>
      <Divider className="my-2" />
      <div>
        <Text strong>{title}</Text>
        <Descriptions column={1} size="small" items={items} />
      </div>
    </>
  );
};

const DefaultEventDrawerContent: DrawerRenderer = ({ details }) => (
  <div className="space-y-4">
    <BaseEventSections details={details} />
  </div>
);

const FuneralDrawerContent: DrawerRenderer = ({
  details,
  funeralDetailsContent,
}) => (
  <div className="space-y-4">
    <BaseEventSections details={details} />
    <Divider className="my-2" />
    <div>
      <Space style={{ marginBottom: 8 }}>
        <Text strong>Funeral Overview</Text>
      </Space>
      {funeralDetailsContent}
    </div>
  </div>
);

const FuneralMilestoneDrawerContent: DrawerRenderer = ({
  details,
  funeralDetailsContent,
  milestoneMeta,
  typeTagStyle,
  typeTagColorFallback,
}) => (
  <div className="space-y-4">
    <BaseEventSections details={details} />
    <Divider className="my-2" />
    <div>
      <Space style={{ marginBottom: 8 }}>
        <Text strong>
          {milestoneMeta?.label
            ? `${milestoneMeta.label} Details`
            : "Funeral Details"}
        </Text>
        {milestoneMeta?.label && (
          <Tag style={typeTagStyle} color={typeTagColorFallback}>
            {milestoneMeta.label}
          </Tag>
        )}
      </Space>
      {funeralDetailsContent}
    </div>
  </div>
);

const MeetingDrawerContent: DrawerRenderer = ({ details, selectedEvent }) => {
  const virtualDetails = selectedEvent?.virtualEventDetails ?? {};
  const joinUrl = virtualDetails?.joinUrl || virtualDetails?.url;
  const meetingItems: DescriptionItem[] = [];

  const organizer = selectedEvent?.organizer || selectedEvent?.createdBy;
  if (organizer)
    meetingItems.push({
      key: "organizer",
      label: "Organizer",
      children: organizer,
    });

  if (typeof selectedEvent?.isVirtualEvent === "boolean") {
    meetingItems.push({
      key: "mode",
      label: "Mode",
      children: selectedEvent.isVirtualEvent ? "Virtual" : "In person",
    });
  }

  if (virtualDetails?.provider) {
    meetingItems.push({
      key: "provider",
      label: "Platform",
      children: virtualDetails.provider,
    });
  }

  if (joinUrl) {
    meetingItems.push({
      key: "join",
      label: "Join Link",
      children: (
        <a href={joinUrl} target="_blank" rel="noreferrer">
          Join meeting <LinkOutlined />
        </a>
      ),
    });
  }

  if (virtualDetails?.password) {
    meetingItems.push({
      key: "password",
      label: "Password",
      children: virtualDetails.password,
    });
  }

  if (virtualDetails?.dialIn || virtualDetails?.phone) {
    meetingItems.push({
      key: "dialIn",
      label: "Dial-in",
      children: virtualDetails.dialIn || virtualDetails.phone,
    });
  }

  if (selectedEvent?.agenda) {
    meetingItems.push({
      key: "agenda",
      label: "Agenda",
      children: selectedEvent.agenda,
    });
  }

  return (
    <div className="space-y-4">
      <BaseEventSections details={details} />
      <AdditionalDescriptionsSection
        title="Meeting Details"
        items={meetingItems}
      />
    </div>
  );
};

const ShiftDrawerContent: DrawerRenderer = ({ details, selectedEvent }) => {
  const assigned =
    selectedEvent?.assignedTo ||
    selectedEvent?.assignedStaff ||
    (Array.isArray(details.attendees) && details.attendees.length
      ? details.attendees
          .map((a: any) => a?.name || a?.email || a?.phone)
          .filter(Boolean)
          .join(", ")
      : undefined);

  const shiftItems: DescriptionItem[] = [];

  const role =
    selectedEvent?.role || selectedEvent?.shiftRole || selectedEvent?.position;
  if (role) shiftItems.push({ key: "role", label: "Role", children: role });

  if (assigned)
    shiftItems.push({
      key: "assigned",
      label: "Assigned To",
      children: assigned,
    });

  if (selectedEvent?.branchId) {
    shiftItems.push({
      key: "branch",
      label: "Branch",
      children: selectedEvent.branchId,
    });
  }

  const duration = formatDuration(
    selectedEvent?.durationHours,
    selectedEvent?.durationMinutes
  );
  if (duration)
    shiftItems.push({ key: "duration", label: "Duration", children: duration });

  if (selectedEvent?.notes) {
    shiftItems.push({
      key: "notes",
      label: "Notes",
      children: selectedEvent.notes,
    });
  }

  return (
    <div className="space-y-4">
      <BaseEventSections details={details} />
      <AdditionalDescriptionsSection title="Shift Details" items={shiftItems} />
    </div>
  );
};

const TrainingDrawerContent: DrawerRenderer = ({ details, selectedEvent }) => {
  const trainingItems: DescriptionItem[] = [];

  if (selectedEvent?.trainer || selectedEvent?.facilitator) {
    trainingItems.push({
      key: "trainer",
      label: "Trainer",
      children: selectedEvent.trainer || selectedEvent.facilitator,
    });
  }

  if (selectedEvent?.topic || selectedEvent?.course) {
    trainingItems.push({
      key: "topic",
      label: "Topic",
      children: selectedEvent.topic || selectedEvent.course,
    });
  }

  const duration = formatDuration(
    selectedEvent?.durationHours,
    selectedEvent?.durationMinutes
  );
  if (duration)
    trainingItems.push({
      key: "duration",
      label: "Duration",
      children: duration,
    });

  if (selectedEvent?.materials) {
    trainingItems.push({
      key: "materials",
      label: "Materials",
      children: selectedEvent.materials,
    });
  }

  if (selectedEvent?.registrationUrl) {
    trainingItems.push({
      key: "registration",
      label: "Registration",
      children: (
        <a
          href={selectedEvent.registrationUrl}
          target="_blank"
          rel="noreferrer"
        >
          View registration <LinkOutlined />
        </a>
      ),
    });
  }

  return (
    <div className="space-y-4">
      <BaseEventSections details={details} />
      <AdditionalDescriptionsSection
        title="Training Details"
        items={trainingItems}
      />
    </div>
  );
};

const TaskDrawerContent: DrawerRenderer = ({ details, selectedEvent }) => {
  const taskItems: DescriptionItem[] = [];

  const taskStatus = selectedEvent?.taskStatus || selectedEvent?.status;
  if (taskStatus) {
    taskItems.push({
      key: "status",
      label: "Task Status",
      children: formatKey(taskStatus) || taskStatus,
    });
  }

  if (selectedEvent?.priority) {
    taskItems.push({
      key: "priority",
      label: "Priority",
      children: formatKey(selectedEvent.priority) || selectedEvent.priority,
    });
  }

  const dueDate =
    selectedEvent?.dueDate ||
    selectedEvent?.due ||
    selectedEvent?.endDateTime ||
    selectedEvent?.end ||
    selectedEvent?.expectedCompletion;
  const formattedDue = formatDateTime(dueDate);
  if (formattedDue) {
    taskItems.push({ key: "due", label: "Due", children: formattedDue });
  }

  const owner =
    selectedEvent?.owner ||
    selectedEvent?.ownerName ||
    selectedEvent?.assignedTo ||
    (Array.isArray(details.attendees) && details.attendees.length
      ? details.attendees
          .map((a: any) => a?.name || a?.email || a?.phone)
          .filter(Boolean)
          .join(", ")
      : undefined);
  if (owner) {
    taskItems.push({ key: "owner", label: "Owner", children: owner });
  }

  if (selectedEvent?.notes) {
    taskItems.push({
      key: "notes",
      label: "Notes",
      children: selectedEvent.notes,
    });
  }

  return (
    <div className="space-y-4">
      <BaseEventSections details={details} />
      <AdditionalDescriptionsSection title="Task Details" items={taskItems} />
    </div>
  );
};

const EVENT_DRAWER_COMPONENTS: Record<string, DrawerRenderer> = {
  funeral: FuneralDrawerContent,
  funeral_pickup: FuneralMilestoneDrawerContent,
  funeral_bathing: FuneralMilestoneDrawerContent,
  funeral_tent: FuneralMilestoneDrawerContent,
  funeral_delivery: FuneralMilestoneDrawerContent,
  funeral_service: FuneralMilestoneDrawerContent,
  funeral_burial: FuneralMilestoneDrawerContent,
  meeting: MeetingDrawerContent,
  shift: ShiftDrawerContent,
  training: TrainingDrawerContent,
  task: TaskDrawerContent,
  default: DefaultEventDrawerContent,
};

const CompanyCalendar = ({
  events = [],
  loading = false,
  onEventChange,
  externalDraggablesContainerId,
  onRefresh,
  onMarkMilestoneComplete,
}: IProps) => {
  const [eventDetailsDrawerOpen, setEventDetailsDrawerOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [funeralDetails, setFuneralDetails] = useState<any | null>(null);
  const [funeralLoading, setFuneralLoading] = useState(false);
  const [funeralError, setFuneralError] = useState<string | null>(null);
  const [selectedMilestones, setSelectedMilestones] = useState<string[]>([]);
  const [markCompleteLoading, setMarkCompleteLoading] = useState(false);
  const calendarRef = useRef<FullCalendar | null>(null);
  const latestFuneralRequestRef = useRef(0);

  const milestoneFilterOptions = useMemo(
    () =>
      Object.entries(FUNERAL_MILESTONE_BY_EVENT_TYPE).map(([value, meta]) => ({
        label: meta.label,
        value,
      })),
    []
  );

  const displayedEvents = useMemo(() => {
    if (!selectedMilestones.length) {
      return events;
    }

    return events.filter((event) => {
      const props = (event as any)?.extendedProps ?? {};
      const keyCandidate = props.milestone || props.type || "";
      const key =
        typeof keyCandidate === "string"
          ? keyCandidate.toLowerCase()
          : String(keyCandidate).toLowerCase();
      return selectedMilestones.includes(key);
    });
  }, [events, selectedMilestones]);

  // Enable dragging from an external list if provided
  useEffect(() => {
    if (!externalDraggablesContainerId) return;
    const containerEl = document.getElementById(externalDraggablesContainerId);
    if (!containerEl) return;

    // Each child of containerEl with class .fc-draggable becomes draggable
    // and must carry data-event JSON in a data attribute.
    new Draggable(containerEl, {
      itemSelector: ".fc-draggable",
      eventData: (el) => {
        const payload = el.getAttribute("data-event");
        try {
          const parsed = payload ? JSON.parse(payload) : {};
          // Minimum fields FullCalendar expects:
          return {
            title: parsed.title || el.getAttribute("data-title") || "Untitled",
            start: parsed.start || undefined,
            end: parsed.end || undefined,
            allDay: !!parsed.allDay,
            extendedProps: parsed.extendedProps || {},
          };
        } catch {
          return { title: el.textContent?.trim() || "Untitled" };
        }
      },
    });
  }, [externalDraggablesContainerId]);

  const calendarViews = ["timeGridDay", "dayGridWeek", "dayGridMonth"];

  const renderEventContent = (eventInfo: any) => {
    const eventData = eventInfo.event.extendedProps || {};
    console.log("🚀 ~ renderEventContent ~ eventData:", eventData);
    const palette = eventData.palette || getEventPalette(eventData);
    const name = eventData.name || eventInfo.event.title;
    const startTimeRaw = eventData.startTime as string | undefined;
    const startTime = startTimeRaw
      ? startTimeRaw.split(":").slice(0, 2).join(":")
      : eventInfo.timeText;
    const typeLabel = formatKey(
      eventData.subType || eventData.milestone || eventData.type
    );
    const isCompleted =
      String(eventData.status || "").toLowerCase() ===
      CalendarEventStatus.COMPLETED.toString().toLowerCase();
    console.log("🚀 ~ renderEventContent ~ isCompleted:", isCompleted);

    return (
      <div
        className="flex w-full cursor-pointer flex-col gap-0.5 rounded-sm px-2 py-1 text-xs font-semibold shadow-sm transition-colors"
        style={{
          backgroundColor: palette.background,
          color: palette.text,
          borderLeft: `3px solid ${palette.border}`,
          position: "relative",
        }}
      >
        {(typeLabel || isCompleted) && (
          <div className="flex items-start justify-between gap-1">
            {typeLabel ? (
              <span className="text-[10px] font-semibold uppercase tracking-wide opacity-80">
                {typeLabel}
              </span>
            ) : (
              <span />
            )}
            {isCompleted && (
              <CheckCircleFilled style={{ color: "#52c41a", fontSize: 12 }} />
            )}
          </div>
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
        title: "Confirm change",
        text: prompt,
        icon: "warning",
        buttons: ["Cancel", "Confirm"],
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
      "Move this event to the new date/time?",
      async () => {
        if (!onEventChange) return true;
        return onEventChange({
          id: event.extendedProps.id,
          start: event.start ? event.start.toISOString() : null,
          end: event.end ? event.end.toISOString() : null,
          allDay: event.allDay,
          extendedProps: { ...event.extendedProps },
          action: "move",
        });
      },
      revert
    );
  };

  const handleEventResize = (info: any) => {
    const { event, revert } = info;

    confirmOrRevert(
      "Change this event’s duration?",
      async () => {
        if (!onEventChange) return true;
        return onEventChange({
          id: event.extendedProps.id,
          start: event.start ? event.start.toISOString() : null,
          end: event.end ? event.end.toISOString() : null,
          allDay: event.allDay,
          extendedProps: { ...event.extendedProps },
          action: "resize",
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
      "Add this item to the calendar?",
      async () => {
        if (!onEventChange) return true;
        const accepted = await onEventChange({
          id: event.extendedProps.id,
          start: event.start ? event.start.toISOString() : null,
          end: event.end ? event.end.toISOString() : null,
          allDay: event.allDay,
          extendedProps: { ...event.extendedProps },
          action: "receive",
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

    if (!selectedEvent || selectedEvent.relatedModel !== "funeral") {
      setFuneralDetails(null);
      setFuneralError(null);
      setFuneralLoading(false);
      return;
    }

    const relatedId = normalizeId(selectedEvent.relatedId);
    if (!relatedId) {
      setFuneralDetails(null);
      setFuneralLoading(false);
      setFuneralError("Missing linked funeral reference.");
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
          throw new Error(data?.message || "Failed to load funeral details.");
        }
        if (latestFuneralRequestRef.current === requestId) {
          setFuneralDetails(data.funeral ?? null);
        }
      } catch (error: any) {
        if (latestFuneralRequestRef.current === requestId) {
          setFuneralDetails(null);
          setFuneralError(error?.message || "Failed to load funeral details.");
        }
      } finally {
        if (latestFuneralRequestRef.current === requestId) {
          setFuneralLoading(false);
        }
      }
    };

    loadFuneral();
  }, [
    eventDetailsDrawerOpen,
    selectedEvent?.relatedModel,
    selectedEvent?.relatedId,
  ]);

  // Build a normalized view model from selectedEvent and the FC event core fields you added
  const details = selectedEvent && {
    title: selectedEvent.name || selectedEvent.title || "Untitled",
    type: selectedEvent.type,
    status: selectedEvent.status ?? "draft",
    startISO: selectedEvent.startISO || selectedEvent.start,
    endISO: selectedEvent.endISO || selectedEvent.end,
    allDay: !!selectedEvent.allDay || !!selectedEvent.isAllDayEvent,
    location: selectedEvent.location,
    description: selectedEvent.description,
    attendees: Array.isArray(selectedEvent.attendees)
      ? selectedEvent.attendees
      : [],
    milestone: selectedEvent.milestone || selectedEvent.subType,
    palette: selectedEvent.palette || getEventPalette(selectedEvent),
  };

  const typeTagLabel = formatKey(details?.milestone || details?.type);
  const milestoneKey = String(
    selectedEvent?.milestone || selectedEvent?.type || ""
  ).toLowerCase();
  const funeralMilestoneMeta = FUNERAL_MILESTONE_BY_EVENT_TYPE[milestoneKey];
  const funeralMilestoneSlot =
    funeralMilestoneMeta && funeralDetails
      ? funeralDetails[funeralMilestoneMeta.field]
      : undefined;

  const isFuneralMilestoneEvent = Boolean(funeralMilestoneMeta);

  const handleMarkMilestoneComplete = async () => {
    if (!selectedEvent?.id || !onMarkMilestoneComplete) {
      return;
    }

    setMarkCompleteLoading(true);
    try {
      const result = await onMarkMilestoneComplete(String(selectedEvent.id));
      if (!result) {
        return;
      }

      sweetAlert({
        title: "Milestone marked as completed",
        text: "Milestone marked as completed",
        icon: "success",
        timer: 2000,
      });

      setSelectedEvent((prev: any) =>
        prev ? { ...prev, status: "completed" } : prev
      );
    } catch (err: any) {
      const errMessage =
        err instanceof Error
          ? err.message
          : "Failed to mark milestone as completed";
      message.error(errMessage);
      sweetAlert({
        title: "Failed to mark milestone as completed",
        text: errMessage,
        icon: "error",
        timer: 2000,
      });
    } finally {
      setMarkCompleteLoading(false);
    }
  };

  const markCompleteButton =
    isFuneralMilestoneEvent &&
    String(selectedEvent?.status || "").toLowerCase() !== "completed" &&
    !!onMarkMilestoneComplete ? (
      <Button
        type="primary"
        icon={<CheckCircleOutlined />}
        onClick={handleMarkMilestoneComplete}
        loading={markCompleteLoading}
      >
        Mark Completed
      </Button>
    ) : null;

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
      return (
        <Text type="secondary">No additional funeral details available.</Text>
      );
    }

    const deceasedName =
      `${funeralDetails.deceased?.firstName ?? ""} ${funeralDetails.deceased?.lastName ?? ""}`.trim() ||
      "—";
    const informantName =
      `${funeralDetails.informant?.firstName ?? ""} ${funeralDetails.informant?.lastName ?? ""}`.trim();
    const informantContact = [
      funeralDetails.informant?.phoneNumber,
      funeralDetails.informant?.email,
    ]
      .filter(Boolean)
      .join(" • ");
    const milestoneRange = funeralMilestoneSlot?.startDateTime
      ? fmtRange(
          funeralMilestoneSlot.startDateTime
            ? new Date(funeralMilestoneSlot.startDateTime).toISOString()
            : undefined,
          funeralMilestoneSlot.endDateTime
            ? new Date(funeralMilestoneSlot.endDateTime).toISOString()
            : undefined,
          false
        )
      : undefined;
    const milestoneLocation = funeralMilestoneSlot?.location
      ? asLocationText(funeralMilestoneSlot.location)
      : undefined;

    const items = [
      {
        key: "reference",
        label: "Reference",
        children: (
          <Space>
            {funeralDetails.referenceNumber ? (
              <Text code>{funeralDetails.referenceNumber}</Text>
            ) : (
              "—"
            )}
            {funeralDetails.status && (
              <Tag
                color={
                  funeralDetails.status === "completed"
                    ? "green"
                    : funeralDetails.status === "in_progress"
                      ? "blue"
                      : funeralDetails.status === "cancelled"
                        ? "red"
                        : "gold"
                }
              >
                {String(formatKey(funeralDetails.status))}
              </Tag>
            )}
          </Space>
        ),
      },
      {
        key: "deceased",
        label: "Deceased",
        children: (
          <Space direction="vertical" size={0}>
            <Text>{deceasedName}</Text>
            {funeralDetails.deceased?.dateOfDeath && (
              <Text type="secondary">
                Date of death:{" "}
                {dayjs(funeralDetails.deceased.dateOfDeath).format(
                  "ddd, D MMM YYYY"
                )}
              </Text>
            )}
          </Space>
        ),
      },
      {
        key: "informant",
        label: "Informant",
        children: (
          <Space direction="vertical" size={0}>
            <Text>{informantName || "—"}</Text>
            {informantContact && (
              <Text type="secondary">{informantContact}</Text>
            )}
          </Space>
        ),
      },
      funeralMilestoneMeta && {
        key: "milestone",
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
      !funeralMilestoneMeta &&
        funeralDetails.serviceDateTime && {
          key: "service",
          label: "Service Time",
          children: formatDateTime(funeralDetails.serviceDateTime),
        },
      !funeralMilestoneMeta &&
        funeralDetails.burialDateTime && {
          key: "burial",
          label: "Burial Time",
          children: formatDateTime(funeralDetails.burialDateTime),
        },
      (funeralDetails.cemetery || funeralDetails.branchId) && {
        key: "location",
        label: "Location",
        children: (
          <Space direction="vertical" size={0}>
            {funeralDetails.cemetery && <Text>{funeralDetails.cemetery}</Text>}
            {funeralDetails.branchId && (
              <Text type="secondary">Branch: {funeralDetails.branchId}</Text>
            )}
          </Space>
        ),
      },
      !funeralMilestoneMeta &&
        funeralDetails.graveNumber && {
          key: "graveNumber",
          label: "Grave Number",
          children: funeralDetails.graveNumber,
        },
      funeralDetails.notes && {
        key: "notes",
        label: "Notes",
        children: (
          <Paragraph
            style={{ marginBottom: 0 }}
            ellipsis={{ rows: 3, expandable: true }}
          >
            {funeralDetails.notes}
          </Paragraph>
        ),
      },
    ].filter(Boolean) as any;

    return <Descriptions column={1} size="small" items={items} />;
  })();

  const statusLabel = details?.status ? formatKey(details.status) : undefined;
  const statusTagColor =
    details?.status === "published"
      ? "green"
      : details?.status === "cancelled"
        ? "red"
        : details?.status === "draft"
          ? "gold"
          : details?.status
            ? "blue"
            : undefined;
  const typeTagStyle = details?.palette
    ? {
        backgroundColor: details.palette.background,
        color: details.palette.text,
        borderColor: details.palette.border,
      }
    : undefined;
  const typeTagColorFallback = typeTagStyle ? undefined : "gold";
  const drawerKeySource =
    selectedEvent?.subType ||
    selectedEvent?.milestone ||
    selectedEvent?.type ||
    "default";
  const drawerKey =
    typeof drawerKeySource === "string"
      ? drawerKeySource.toLowerCase()
      : "default";
  const DrawerContentComponent =
    EVENT_DRAWER_COMPONENTS[drawerKey] || EVENT_DRAWER_COMPONENTS.default;

  const milestoneFiltersActive = selectedMilestones.length > 0;

  return (
    <div className="">
      <Flex
        align="center"
        justify="space-between"
        gap={12}
        wrap="wrap"
        className="mb-4"
      >
        <Space wrap>
          <Select
            mode="multiple"
            allowClear
            placeholder="Filter funeral milestones"
            maxTagCount="responsive"
            style={{ minWidth: 220 }}
            value={selectedMilestones}
            options={milestoneFilterOptions}
            onChange={(values) =>
              setSelectedMilestones(
                Array.isArray(values) ? (values as string[]) : []
              )
            }
            disabled={!milestoneFilterOptions.length}
          />
          <Button
            onClick={() => setSelectedMilestones([])}
            disabled={!milestoneFiltersActive}
          >
            Clear Filters
          </Button>
        </Space>
        <Space>
          <Button
            icon={<ReloadOutlined />}
            onClick={() => onRefresh?.()}
            disabled={!onRefresh}
            loading={loading}
            type="default"
          >
            Refresh
          </Button>
        </Space>
      </Flex>

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
            left: "prev,next today",
            center: "title",
            right: "dayGridMonth,timeGridWeek,timeGridDay",
          }}
          views={{
            timeGridDay: { slotDuration: "00:30:00" },
            timeGridWeek: { slotDuration: "00:30:00" },
          }}
          events={displayedEvents}
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
        title={
          <Flex justify="space-between" align="center">
            <Text>{details?.title}</Text>
            <Space>
              {statusLabel && (
                <Tag color={statusTagColor}>{statusLabel.toUpperCase()}</Tag>
              )}
              {typeTagLabel && (
                <Tag style={typeTagStyle} color={typeTagColorFallback}>
                  {typeTagLabel}
                </Tag>
              )}
            </Space>
          </Flex>
        }
        placement="right"
        width="40%"
        extra={markCompleteButton}
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
          !selectedEvent ||
          (selectedEvent?.type || selectedEvent?.milestone || "")
            .toString()
            .toLowerCase()
            .startsWith("funeral") ? null : (
            <Space>
              <Button
                type="primary"
                className="text-black"
                icon={<EditOutlined />}
                onClick={() => {
                  /* open edit drawer/modal */
                }}
              >
                Edit
              </Button>
              <Button
                danger
                icon={<DeleteOutlined />}
                onClick={() => {
                  // await fetch(`/api/calendar/events/${selectedEvent.id}`, { method: 'DELETE' });
                  // fetchEvents(); setEventDetailsDrawerOpen(false);
                }}
              >
                Delete
              </Button>
            </Space>
          )
        }
      >
        {details ? (
          <DrawerContentComponent
            details={details}
            selectedEvent={selectedEvent ?? {}}
            funeralDetails={funeralDetails}
            funeralLoading={funeralLoading}
            funeralError={funeralError}
            funeralDetailsContent={funeralDetailsContent}
            milestoneMeta={funeralMilestoneMeta}
            milestoneSlot={funeralMilestoneSlot}
            typeTagStyle={typeTagStyle}
            typeTagColorFallback={typeTagColorFallback}
          />
        ) : (
          <Text type="secondary">Select an event to view its details.</Text>
        )}
      </Drawer>
    </div>
  );
};

export default CompanyCalendar;
