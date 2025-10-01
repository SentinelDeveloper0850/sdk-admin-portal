import dayjs from 'dayjs'
import React from 'react'
import { Card, Statistic } from 'antd'

const { Countdown } = Statistic;

const CashUpCountdown = ({ cutOffTime }: { cutOffTime: string }) => {
  return (
    <Card className='bg-muted border-border border dark:border-[#333]' size='small'>
      <Countdown
        title="Submission Deadline" 
        value={dayjs(cutOffTime, 'HH:mm:ss').valueOf()}
      />
    </Card>
  )
}

export default CashUpCountdown