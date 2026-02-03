import React from "react";

import { Card, Statistic } from "antd";
import dayjs from "dayjs";

const { Countdown } = Statistic;

const CashUpCountdown = ({ cutOffTime }: { cutOffTime: string }) => {
  const [hh, mm, ss] = cutOffTime.split(":").map((x) => Number(x || 0));
  const now = dayjs();
  let target = now.hour(hh).minute(mm).second(ss).millisecond(0);
  if (target.isBefore(now)) {
    target = target.add(1, "day");
  }

  return (
    <Card
      className="bg-muted border-border border dark:border-[#333]"
      size="small"
    >
      <Countdown title="Submission Deadline" value={target.valueOf()} />
    </Card>
  );
};

export default CashUpCountdown;
