"use client";

import { PlusOutlined } from '@ant-design/icons';
import { Alert, Button, Checkbox, DatePicker, Drawer, Flex, Form, Input, message, Select, TimePicker } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import dayjs from 'dayjs';
import { combineDateAndTime } from '@/lib/utils';

import CalendarPageContextMenu from '@/app/components/context-menu/calendar-page-context-menu';
import PageHeader from '@/app/components/page-header';
import { ICalendarEvent } from '@/app/models/calendar-event.schema';
import axios from 'axios';
import BranchCalendar from './branch-calendar';
import CompanyCalendar from './company-calendar';
import PersonalCalendar from './personal-calendar';
import sweetAlert from 'sweetalert';

const eventTypes = [
  {
    name: "Appointment",
    value: "appointment",
  },
  {
    name: "Presentation",
    value: "presentation",
  },
  {
    name: "Funeral",
    value: "funeral",
  },
  {
    name: "Training",
    value: "training",
  },
  {
    name: "Workshop",
    value: "workshop",
  },
  {
    name: "Meeting",
    value: "meeting",
  },
  {
    name: "Other",
    value: "other",
  }
]

const meetingProviders = [
  {
    name: "Discord",
    value: "discord",
  },
  {
    name: "Google Meet",
    value: "google-meet",
  },
  {
    name: "Microsoft Teams",
    value: "microsoft-teams",
  },
  {
    name: "Zoom",
    value: "zoom",
  }
]

const CalendarPage = () => {
  const [selectedCalendar, setSelectedCalendar] = useState<string>('company');
  const [companyEvents, setCompanyEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const calendarType = selectedCalendar === "company" ? "Company" : selectedCalendar === "branch" ? "Branch" : "Personal";

  const [addEventDrawerOpen, setAddEventDrawerOpen] = useState(false);
  const [addEventForm] = Form.useForm<ICalendarEvent>();
  const [addingEvent, setAddingEvent] = useState(false);
  const [staffMembers, setStaffMembers] = useState<any[]>([]);

  useEffect(() => {
    addEventForm.setFieldsValue({
      isVirtualEvent: false,
      virtualEventDetails: {},
      isPrivate: calendarType === "Company" ? false : calendarType === "Branch" ? false : true,
      isSingleDayEvent: true,
      isAllDayEvent: false,
    });
  }, [calendarType, addEventForm]);

  useEffect(() => {
    const loadStaffMembers = async () => {
      const result = await fetch('/api/staff');
      const data = await result.json();
      setStaffMembers(data.staffMembers || []);
    }
    loadStaffMembers();
  }, []);

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

  const handleAddEvent = async (values: ICalendarEvent) => {
    try {
      setAddingEvent(true);

      // values.start and values.startTime are Dayjs from AntD DatePicker/TimePicker
      const startDT = combineDateAndTime(values.start as any, values.startTime as any); // Dayjs
      if (!startDT.isValid()) throw new Error('Invalid start date/time');

      // optional end handling: if you have end + endTime, combine; else use duration; else default 60m
      let endDT: dayjs.Dayjs | null = null;
      if (values.end) {
        endDT = combineDateAndTime(values.end as any, values.endTime as any);
        if (!endDT.isValid()) endDT = null;
      } else if (values.durationHours || values.durationMinutes) {
        endDT = startDT
          .add(values.durationHours ?? 0, 'hour')
          .add(values.durationMinutes ?? 0, 'minute');
      } else {
        endDT = startDT.add(60, 'minute'); // sensible default
      }

      const payload = {
        // canonical fields the backend should store
        name: values.name,
        description: values.description,
        type: values.type,
        isAllDayEvent: !!values.isAllDayEvent,
        isPrivate: !!values.isPrivate,
        isVirtualEvent: !!values.isVirtualEvent,
        virtualEventDetails: values.virtualEventDetails ?? undefined,
        location: values.location ?? undefined,
        attendees: values.attendees ?? [],
        branchId: (values as any).branchId, // if you capture it on the form

        // canonical: use Date fields
        startDateTime: startDT.toDate(),
        endDateTime: endDT?.toDate(),

        // (optional) keep UI helpers if you want them in the doc
        start: startDT.toISOString(),                // string mirror
        end: endDT?.toISOString(),                   // string mirror
        startTime: startDT.format('HH:mm'),
        endTime: endDT?.format('HH:mm'),
        durationHours: values.durationHours,
        durationMinutes: values.durationMinutes,
      };

      const res = await axios.post('/api/calendar/events', payload);
      if (res.status !== 201) throw new Error(res.data?.message || 'Failed to add event');

      sweetAlert({ title: 'Event added successfully', icon: 'success', timer: 2000 });
      setAddEventDrawerOpen(false);
      addEventForm.resetFields();
      fetchEvents();
    } catch (err: any) {
      console.error(err);
      sweetAlert({
        title: 'Error adding event',
        text: err?.message || 'Failed to add event',
        icon: 'error',
        timer: 2000,
      });
    } finally {
      setAddingEvent(false);
    }
  };

  // Watch for changes on isVirtualEvent
  const isVirtualEvent = Form.useWatch("isVirtualEvent", addEventForm);
  const isPrivate = Form.useWatch("isPrivate", addEventForm);
  const isSingleDayEvent = Form.useWatch("isSingleDayEvent", addEventForm);
  const isAllDayEvent = Form.useWatch("isAllDayEvent", addEventForm);
  const isFuneralEvent = Form.useWatch("type", addEventForm) === "funeral";

  const saveCalendarChange = async (payload: {
    id: string;
    start: string | null;
    end: string | null;
    allDay: boolean;
    extendedProps: Record<string, any>;
  }) => {
    console.log("🚀 ~ saveCalendarChange ~ payload:", payload)
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
          id: String(e._id),
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
          title={`${selectedCalendar.charAt(0).toUpperCase() + selectedCalendar.slice(1)} Calendar`}
          // subtitle={`View and manage ${selectedCalendar === "company" ? "the company" : selectedCalendar === "branch" ? "your branch" : "your own"} calendar`}
          subtitle="View and manage the company calendar"
          actions={[
            <Button key="add-event" type="dashed" onClick={() => setAddEventDrawerOpen(true)}>
              <PlusOutlined className="w-4 h-4" /> Add {calendarType} Event
            </Button>
          ]}
        />
        {selectedCalendar === 'company' && <CompanyCalendar events={fcEvents} loading={loading} onEventChange={saveCalendarChange} />}
        {/* {selectedCalendar === 'branch' && <BranchCalendar />}
        {selectedCalendar === 'personal' && <PersonalCalendar />} */}
      </div>

      {/* Page Context Menu Container */}
      <aside className="sticky top-0 h-screen shrink-0 transition-all duration-200 hidden md:block">
        <CalendarPageContextMenu selectedCalendar={selectedCalendar} setSelectedCalendar={setSelectedCalendar} />
      </aside>

      {addEventDrawerOpen && <Drawer
        title={`Add ${calendarType} Event`}
        open={addEventDrawerOpen}
        onClose={() => {
          setAddEventDrawerOpen(false);
          addEventForm.resetFields();
        }}
        width="50%"
        destroyOnClose
        footer={
          <div className="flex justify-end gap-2">
            <Button type="dashed" color="danger" onClick={() => {
              setAddEventDrawerOpen(false);
              addEventForm.resetFields();
            }}>Cancel</Button>
            <Button type="primary" className="text-black" loading={addingEvent} onClick={() => addEventForm.submit()}>Add Event</Button>
          </div>
        }
      >
        <Form layout="vertical" form={addEventForm} onFinish={handleAddEvent}>

          <h4 className="text-md font-semibold mb-2">Event Options</h4>
          <Flex gap={16}>
            <Form.Item name="isVirtualEvent" valuePropName="checked" initialValue={false}>
              <Checkbox>Virtual Event</Checkbox>
            </Form.Item>
            <Form.Item name="isPrivate" valuePropName="checked" initialValue={false}>
              <Checkbox>Private Event</Checkbox>
            </Form.Item>
            <Form.Item name="isSingleDayEvent" valuePropName="checked" initialValue={true}>
              <Checkbox>Single Day Event</Checkbox>
            </Form.Item>
            <Form.Item name="isAllDayEvent" valuePropName="checked" initialValue={false}>
              <Checkbox>All Day Event</Checkbox>
            </Form.Item>
          </Flex>


          <hr className="mb-4" />

          {isPrivate && <Alert message="This event is private and will only be visible to the selected internal attendees." type="info" showIcon banner className="mb-4 text-xs" />}

          <h4 className="text-md font-semibold mb-2">Event Details</h4>
          <Flex gap={16}>
            <Form.Item className="w-1/2" label="Event Name" name="name" rules={[{ required: true, message: "Please enter the event name" }]}>
              <Input placeholder="Enter event name" />
            </Form.Item>
            <Form.Item className="w-1/2" label="Event Type" name="type" rules={[{ required: true, message: "Please select the event type" }]}>
              <Select placeholder="Select event type" options={eventTypes.map((type) => ({ label: type.name, value: type.value }))} />
            </Form.Item>
            <Form.Item className="w-1/2" label="Event Location" name="location">
              <Input placeholder="Enter event location" />
            </Form.Item>
          </Flex>

          <Form.Item label="Event Description" name="description">
            <Input.TextArea />
          </Form.Item>

          <hr className="mb-4" />

          {isVirtualEvent && <>
            {/* <h4 className="text-sm font-semibold mb-2">Virtual Meeting Details</h4> */}

            <Flex gap={16}>
              <Form.Item name="virtualEventDetails.provider" label="Meeting Provider" className="w-1/3" initialValue="discord">
                <Select placeholder="Select meeting provider" options={meetingProviders.map((provider) => ({ label: provider.name, value: provider.value }))} />
              </Form.Item>
              <Form.Item name="virtualEventDetails.id" label="Meeting ID" className="w-1/3">
                <Input placeholder="Enter meeting ID" />
              </Form.Item>
            </Flex>

            <Flex gap={16}>
              <Form.Item name="virtualEventDetails.joinUrl" label="Meeting Join URL" className="w-2/3">
                <Input placeholder="Enter meeting join URL" />
              </Form.Item>
              <Form.Item name="virtualEventDetails.password" label="Meeting Password" className="w-1/3">
                <Input placeholder="Enter meeting password" />
              </Form.Item>
            </Flex>

            <hr className="mb-4" />
          </>}

          {isSingleDayEvent ? (
            <Flex gap={16}>
              <Form.Item label="Event Date" className="w-1/3" name="start" rules={[{ required: true, message: "Please enter the event date" }]}>
                <DatePicker className="w-full" />
              </Form.Item>
              {!isAllDayEvent && <>
                <Form.Item label="Start Time" className="w-1/3" name="startTime" rules={[{ required: true, message: "Please enter the event time" }]}>
                  <TimePicker className="w-full" />
                </Form.Item>
                {!isFuneralEvent && <Form.Item label="End Time" className="w-1/3" name="endTime" rules={[{ required: true, message: "Please enter the event time" }]}>
                  <TimePicker className="w-full" />
                </Form.Item>}
              </>}
            </Flex>
          ) : (
            <Flex gap={16}>
              <Form.Item label="Start Date" className="w-1/3" name="start" rules={[{ required: true, message: "Please enter the event dates" }]}>
                <DatePicker className="w-full" />
              </Form.Item>
              <Form.Item label="End Date" className="w-1/3" name="end" rules={[{ required: true, message: "Please enter the event dates" }]}>
                <DatePicker className="w-full" />
              </Form.Item>
            </Flex>
          )}

          <hr className="mb-4" />

          <h4 className="text-md font-semibold mb-2">Internal Attendees</h4>
          <Select placeholder="Select internal attendees" className="w-full mb-4" mode="tags">
            {staffMembers.map((staffMember) => <Select.Option key={staffMember._id} value={staffMember._id}>{staffMember.initials} {staffMember.lastName}</Select.Option>)}
          </Select>
        </Form>
      </Drawer>}
    </div>
  )
}

export default CalendarPage