import { type ClassValue, clsx } from "clsx";
import dayjs, { Dayjs } from 'dayjs';
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function combineDateAndTime(date: Dayjs | string | Date, time?: Dayjs | string | Date) {
  const d = dayjs(date);
  if (!time) return d.second(0).millisecond(0);
  const t = dayjs(time);
  return d.hour(t.hour()).minute(t.minute()).second(0).millisecond(0);
}

export function formatPolicyNumber(policyNumber: string) {
  return policyNumber
    .trim()
    .replace(/[^a-zA-Z0-9]/g, "")
    .toUpperCase()
}

/**
 * Derives a short, human-readable region code from a region name.
 *
 * Examples:
 *  - "South Coast"        → "SC"
 *  - "Johannesburg"       → "JHB"
 *  - "KwaZulu-Natal"      → "KZN"
 *  - "North West Province" → "NWP"
 */
export function deriveRegionCode(
  regionName: string,
  options?: {
    maxLength?: number;
    fallbackLength?: number;
  }
): string {
  const { maxLength = 3, fallbackLength = 3 } = options || {};

  if (!regionName?.trim()) return "";

  // Normalize
  const cleaned = regionName
    .trim()
    .replace(/[^a-zA-Z\s-]/g, "")
    .replace(/-/g, " ")
    .toUpperCase();

  const words = cleaned.split(/\s+/).filter(Boolean);

  // Multi-word: take first letter of each word
  if (words.length > 1) {
    return words
      .map(word => word[0])
      .join("")
      .slice(0, maxLength);
  }

  // Single word fallback: take first N letters
  return words[0].slice(0, fallbackLength);
}

export function debounce<T extends (...args: any[]) => void>(fn: T, delayMs = 300) {
  let timer: ReturnType<typeof setTimeout> | null = null;

  return (...args: Parameters<T>) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delayMs);
  };
}