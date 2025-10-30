import React, { useEffect, useState } from 'react'
import dayGridPlugin from '@fullcalendar/daygrid'
import FullCalendar from '@fullcalendar/react'
import interactionPlugin from '@fullcalendar/interaction'

const CompanyCalendar = () => {
  const [companyEvents, setCompanyEvents] = useState<any[]>([]);

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
        events={companyEvents}
        eventClick={handleEventClick}
        height="auto"
      />
      </div>
  )
}

export default CompanyCalendar