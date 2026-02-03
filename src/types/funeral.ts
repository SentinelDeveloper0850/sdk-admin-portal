import mongoose, { Document } from "mongoose";

import { ILocation } from "@/app/models/calendar-event.schema";

export enum EFuneralStatus {
  PLANNED = "planned",
  IN_PROGRESS = "in_progress",
  COMPLETED = "completed",
  CANCELLED = "cancelled",
}

export enum EPaymentStatus {
  UNPAID = "unpaid",
  PARTIAL = "partial",
  PAID = "paid",
}

// ---------- Types ----------
export type IFuneralStatus =
  | "planned"
  | "in_progress"
  | "completed"
  | "cancelled";
export type IPaymentStatus = "unpaid" | "partial" | "paid";

export interface IInformant {
  firstName: string;
  lastName: string;
  idNumber?: string;
  passportNumber?: string;
  address?: string;
  phoneNumber?: string;
  email?: string;
  relationship?: string;
}

export interface IDeceased {
  firstName: string;
  lastName: string;
  idNumber?: string;
  passportNumber?: string;
  dateOfBirth?: Date;
  dateOfDeath?: Date;
  gender?: "male" | "female" | "other";
}

export interface IFuneralAssignment {
  role: string; // e.g. "Driver", "Undertaker", "Speaker"
  staffId?: string; // reference to StaffMember
  staffName?: string;
  contact?: string;
  notes?: string;
}

export interface ITransportDetail {
  vehicleId?: string;
  driverId?: string;
  registration?: string;
  departureTime?: Date;
  arrivalTime?: Date;
  notes?: string;
}

export interface IScheduledItem {
  enabled: boolean; // whether this milestone applies
  startDateTime?: Date; // when it happens
  endDateTime?: Date;
  location?: ILocation;
  notes?: string;
  calendarEventId?: mongoose.Types.ObjectId; // link to calendar-events
  status?: string; // current status of the milestone (e.g., completed)
}

export interface IFuneral extends Document {
  // Core identifiers
  referenceNumber: string; // "FNR-2025-0001"
  policyNumber?: string; // optional link to policy
  calendarEventId?: mongoose.Types.ObjectId; // link to calendar-events

  // Deceased information
  deceased: IDeceased;
  informant: IInformant;

  // Ceremony details
  serviceDateTime?: Date;
  burialDateTime?: Date;
  isSameDay?: boolean;

  location?: ILocation; // chapel, church, or cemetery
  cemetery?: string;
  graveNumber?: string;

  // Logistics
  branchId?: string;
  assignments?: IFuneralAssignment[];
  transport?: ITransportDetail[];

  // Finance & operations
  estimatedCost?: number;
  actualCost?: number;
  paymentStatus?: "unpaid" | "partial" | "paid";

  // Milestones we care about on the calendar (for FullCalendar)
  pickUp?: IScheduledItem;
  bathing?: IScheduledItem;
  tentErection?: IScheduledItem;
  delivery?: IScheduledItem;
  serviceEscort?: IScheduledItem;
  burial?: IScheduledItem;

  // Status & meta
  status?: "planned" | "in_progress" | "completed" | "cancelled";
  notes?: string;
  createdBy?: string;
  createdById?: string;
  createdAt?: Date;
  updatedAt?: Date;
}
