import React, { useEffect, useState } from 'react'
import dayGridPlugin from '@fullcalendar/daygrid'
import FullCalendar from '@fullcalendar/react'
import interactionPlugin from '@fullcalendar/interaction'

const PersonalCalendar = () => {
  const [personalEvents, setPersonalEvents] = useState<any[]>([]);

  useEffect(() => {
    
  }, []);

  const handleEventClick = (info: any) => {
    console.log(info);
  };

  return (
    <div className="">
      <FullCalendar
        plugins={[dayGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        weekends={true}
        events={personalEvents}
        eventClick={handleEventClick}
        height="auto"
      />
      </div>
  )
}

export default PersonalCalendar