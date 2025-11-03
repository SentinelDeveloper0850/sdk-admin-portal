import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import dayjs, { Dayjs } from 'dayjs';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function combineDateAndTime(date: Dayjs | string | Date, time?: Dayjs | string | Date) {
  const d = dayjs(date);
  if (!time) return d.second(0).millisecond(0);
  const t = dayjs(time);
  return d.hour(t.hour()).minute(t.minute()).second(0).millisecond(0);
}