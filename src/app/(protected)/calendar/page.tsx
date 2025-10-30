"use client";

import React, { useEffect, useState } from 'react'
import { Alert, Button, Calendar, Checkbox, DatePicker, Divider, Drawer, Flex, Form, Input, message, Select, Space, Switch, TimePicker } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import { Building, Building2, User2 } from 'lucide-react'

import PageHeader from '@/app/components/page-header'
import CompanyCalendar from './company-calendar'
import BranchCalendar from './branch-calendar'
import PersonalCalendar from './personal-calendar'
import CalendarPageContextMenu from '@/app/components/context-menu/calendar-page-context-menu';
import { ICalendarEvent } from '@/app/models/calendar-event.schema';

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

  const handleAddEvent = (values: ICalendarEvent) => {
    try {
      let payload = values;

      payload.startDateTime = values.startDateTime;
      payload.endDateTime = values.endDateTime;
      payload.durationHours = payload.endDateTime.getHours() - payload.startDateTime.getHours();
      payload.durationMinutes = payload.endDateTime.getMinutes() - payload.startDateTime.getMinutes();
      payload.isSingleDayEvent = payload.startDateTime.toDateString() === payload.endDateTime.toDateString();
      payload.isAllDayEvent = payload.startDateTime.getHours() === 0 && payload.endDateTime.getHours() === 23 && payload.startDateTime.getMinutes() === 0 && payload.endDateTime.getMinutes() === 59;

    } catch (err) {
      console.error(err);
    } finally {
      setAddingEvent(false);
      message.error("Failed to add event. Please try again.");
    }
  }

  // Watch for changes on isVirtualEvent
  const isVirtualEvent = Form.useWatch("isVirtualEvent", addEventForm);
  const isPrivate = Form.useWatch("isPrivate", addEventForm);
  const isSingleDayEvent = Form.useWatch("isSingleDayEvent", addEventForm);
  const isAllDayEvent = Form.useWatch("isAllDayEvent", addEventForm);

  return (
    <div className="flex flex-1 overflow-hidden">
      <div className="flex-1 space-y-6 p-6">
        <PageHeader
          title={`${selectedCalendar.charAt(0).toUpperCase() + selectedCalendar.slice(1)} Calendar`}
          subtitle={`View and manage ${selectedCalendar === "company" ? "the company" : selectedCalendar === "branch" ? "your branch" : "your own"} calendar`}
          actions={[
            <Button key="add-event" type="dashed" onClick={() => setAddEventDrawerOpen(true)}>
              <PlusOutlined className="w-4 h-4" /> Add {calendarType} Event
            </Button>
          ]}
        />
        {selectedCalendar === 'company' && <CompanyCalendar />}
        {selectedCalendar === 'branch' && <BranchCalendar />}
        {selectedCalendar === 'personal' && <PersonalCalendar />}
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
            <Form.Item name="isVirtualEvent" valuePropName="checked">
              <Checkbox>Virtual Event</Checkbox>
            </Form.Item>
            <Form.Item name="isPrivate" valuePropName="checked">
              <Checkbox>Private Event</Checkbox>
            </Form.Item>
            <Form.Item name="isSingleDayEvent" valuePropName="checked">
              <Checkbox>Single Day Event</Checkbox>
            </Form.Item>
            <Form.Item name="isAllDayEvent" valuePropName="checked">
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
            <Form.Item className="w-1/2" label="Event Location" name="location" rules={[{ required: true, message: "Please enter the event location" }]}>
              <Input placeholder="Enter event location" />
            </Form.Item>
          </Flex>

          <Form.Item label="Event Description" name="description" rules={[{ required: true, message: "Please enter the event description" }]}>
            <Input.TextArea />
          </Form.Item>

          <hr className="mb-4" />

          {isVirtualEvent && <>
            {/* <h4 className="text-sm font-semibold mb-2">Virtual Meeting Details</h4> */}

            <Flex gap={16}>
              <Form.Item name="virtualEventDetails.provider" label="Meeting Provider" className="w-1/3">
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
              <Form.Item label="Event Date" className="w-1/3" name="date" rules={[{ required: true, message: "Please enter the event date" }]}>
                <DatePicker className="w-full" />
              </Form.Item>
              {!isAllDayEvent && <>
                <Form.Item label="Start Time" className="w-1/3" name="startTime" rules={[{ required: true, message: "Please enter the event time" }]}>
                  <TimePicker className="w-full" />
                </Form.Item>
                <Form.Item label="End Time" className="w-1/3" name="endTime" rules={[{ required: true, message: "Please enter the event time" }]}>
                  <TimePicker className="w-full" />
                </Form.Item>
              </>}
            </Flex>
          ) : (
            <Flex gap={16}>
              <Form.Item label="StartDate" className="w-1/3" name="startDate" rules={[{ required: true, message: "Please enter the event dates" }]}>
                <DatePicker className="w-full" />
              </Form.Item>
              <Form.Item label="EndDate" className="w-1/3" name="endDate" rules={[{ required: true, message: "Please enter the event dates" }]}>
                <DatePicker className="w-full" />
              </Form.Item>
            </Flex>
          )}

          {isSingleDayEvent || isAllDayEvent && <Form.Item label="Event Date" name="date" rules={[{ required: true, message: "Please enter the event date" }]}>
            <DatePicker showTime={!isAllDayEvent} />
          </Form.Item>}

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