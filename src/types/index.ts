import { Schema } from "mongoose";

export interface INote {
  note: string;
  createdAt: Date;
  createdBy: string;
  createdById: string;
}

export enum ScheduledItemStatus {
  PENDING = "pending", // not started
  COMPLETED = "completed", // completed
  CANCELLED = "cancelled", // cancelled
}

export enum DeceasedAgeGroup {
  BABY = "baby",
  CHILD = "child",
  ADULT = "adult",
}

export interface IAddress {
  name: string;
  addressLine1?: string;
  addressLine2?: string;
  suburb?: string;
  townOrCity?: string;
  province?: string; // This is the province of the address
  country?: string; // This is the country of the address
  postalCode?: string;
}

interface IPickup {
  enabled: boolean;
  dateTime: Date;
  durationMinutes: number;
  deceasedAgeGroup: DeceasedAgeGroup;
  address: IAddress;
  notes: string[]; // notes for the pickup
  calendarEventId?: Schema.Types.ObjectId;
  status?: ScheduledItemStatus;
}
