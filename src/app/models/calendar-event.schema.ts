import mongoose, { Document, Model, Schema } from "mongoose";

export interface INote {
  note: string;
  createdAt: Date;
  createdBy: string;
  createdById: string;
}

export interface IComment {
  comment: string;
  createdAt: Date;
  createdBy: string;
  createdById: string;
}

export interface IAttachment {
  label: string;
  url: string;
  contentType: string;
  sizeBytes: number;
  createdAt: Date;
  createdBy: string;
  createdById: string;
}

export enum CalendarEventStatus {
  DRAFT = "draft",
  PUBLISHED = "published",
  CANCELLED = "cancelled",
}

export interface IAttendee {
  name: string;
  email?: string;
  phone?: string;
  userId?: string;
}

export interface ILocation {
  name: string;
  description?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  branchId?: string;
}

export interface IVirtualEventDetails {
  id?: string;
  url?: string;
  type?: string;
  provider?: string;
  joinUrl?: string;
  password?: string;
}

export interface ICalendarEvent extends Document {
  name: string;
  description: string;
  type: string;
  
  isVirtualEvent: boolean;
  virtualEventDetails?: IVirtualEventDetails;

  isSingleDayEvent: boolean;
  isPrivate: boolean;
  isAllDayEvent: boolean;

  startDateTime: Date;
  endDateTime: Date;
  durationHours: number;
  durationMinutes: number;
  
  location: ILocation;
  attendees: IAttendee[];
  notes: INote[];
  comments: IComment[];
  attachments: IAttachment[];

  status: CalendarEventStatus;
  
  createdBy: string;
  createdById: string;

  createdAt?: Date;
  updatedAt?: Date;
}

const CalendarEventSchema = new Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  type: { type: String, required: true },

  isVirtualEvent: { type: Boolean, required: true },
  virtualEventDetails: { type: Schema.Types.Mixed, required: false },

  isSingleDayEvent: { type: Boolean, required: true },
  isPrivate: { type: Boolean, required: false, default: false },
  isAllDayEvent: { type: Boolean, required: false, default: false },

  startDateTime: { type: Date, required: true },
  endDateTime: { type: Date, required: true },
  durationHours: { type: Number, required: true },
  durationMinutes: { type: Number, required: true },

  location: { type: Schema.Types.Mixed, required: true },
  attendees: { type: [Schema.Types.Mixed], required: true },
  notes: { type: [Schema.Types.Mixed], required: true },
  comments: { type: [Schema.Types.Mixed], required: true },
  attachments: { type: [Schema.Types.Mixed], required: true },

  status: { type: String, required: true, enum: CalendarEventStatus },

  createdBy: { type: String, required: true },
  createdById: { type: String, required: true },

}, { timestamps: true });

export const CalendarEventModel = mongoose.models.CalendarEvent || mongoose.model<ICalendarEvent>("CalendarEvent", CalendarEventSchema);