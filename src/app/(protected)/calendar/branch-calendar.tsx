import React, { useEffect, useState } from "react";

import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import FullCalendar from "@fullcalendar/react";

const BranchCalendar = () => {
  const [branchEvents, setBranchEvents] = useState<any[]>([]);

  useEffect(() => {}, []);

  const handleEventClick = (info: any) => {
    console.log(info);
  };

  return (
    <div className="">
      <FullCalendar
        plugins={[dayGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        weekends={true}
        events={branchEvents}
        eventClick={handleEventClick}
        height="auto"
      />
    </div>
  );
};

export default BranchCalendar;
