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
  COMPLETED = "completed",
}

export interface IAttendee {
  name: string;
  email?: string;
  phone?: string;
  userId?: string; // used by filters like attendees: user._id
}

export interface ILocation {
  name: string;
  description?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  branchId?: string; // optional: physical location tied to a branch
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
  // Core
  name: string;                 // <-- will be exposed via virtual "title" for FullCalendar
  description: string;
  type: string;                 // "funeral" | "meeting" | "shift" | ...
  subType?: string;             // "funeral_pickup" | "funeral_bathing" | "funeral_tent" | "funeral_delivery" | "funeral_service" | "funeral_burial"
  branchId?: string;            // <-- added; your GET uses this

  // Related models
  relatedModel?: "funeral" | "none" | string; // future-proof
  relatedId?: mongoose.Types.ObjectId;        // e.g., funeral _id
  milestone?: "funeral_pickup" | "funeral_bathing" | "funeral_tent" | "funeral_delivery" | "funeral_service" | "funeral_burial" | string;

  // Meeting style
  isVirtualEvent?: boolean;
  virtualEventDetails?: IVirtualEventDetails;

  // Flags
  isSingleDayEvent?: boolean;
  isPrivate?: boolean;
  isAllDayEvent?: boolean;

  // Time (Date fields are source of truth)
  startDateTime?: Date;
  startTime?: string;           // "HH:mm" (optional, kept for legacy UI)
  start: string;                // ISO string (kept & auto-synced)

  endDateTime?: Date;
  endTime?: string;
  end: string;                  // ISO string (kept & auto-synced)

  durationHours?: number;
  durationMinutes?: number;

  // Other
  location?: ILocation;
  attendees?: IAttendee[];
  notes?: INote[];
  comments?: IComment[];
  attachments?: IAttachment[];

  status?: CalendarEventStatus;

  createdBy?: string;
  createdById?: string;

  createdAt?: Date;
  updatedAt?: Date;

  // Virtuals
  title?: string;               // alias of name for FullCalendar
  allDay?: boolean;             // alias of isAllDayEvent for FullCalendar
}

const NoteSchema = new Schema<INote>(
  {
    note: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    createdBy: { type: String, required: true },
    createdById: { type: String, required: true },
  },
  { _id: false }
);

const CommentSchema = new Schema<IComment>(
  {
    comment: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    createdBy: { type: String, required: true },
    createdById: { type: String, required: true },
  },
  { _id: false }
);

const AttachmentSchema = new Schema<IAttachment>(
  {
    label: { type: String, required: true },
    url: { type: String, required: true },
    contentType: { type: String, required: true },
    sizeBytes: { type: Number, required: true },
    createdAt: { type: Date, default: Date.now },
    createdBy: { type: String, required: true },
    createdById: { type: String, required: true },
  },
  { _id: false }
);

const AttendeeSchema = new Schema<IAttendee>(
  {
    name: { type: String, required: true },
    email: String,
    phone: String,
    userId: String,
  },
  { _id: false }
);

const LocationSchema = new Schema<ILocation>(
  {
    name: { type: String, required: true },
    description: String,
    address: String,
    latitude: Number,
    longitude: Number,
    branchId: String,
  },
  { _id: false }
);

const VirtualEventDetailsSchema = new Schema<IVirtualEventDetails>(
  {
    id: String,
    url: String,
    type: String,
    provider: String,
    joinUrl: String,
    password: String,
  },
  { _id: false }
);

const CalendarEventSchema = new Schema<ICalendarEvent>(
  {
    // Core
    name: { type: String, required: true },
    description: { type: String, required: false },
    type: { type: String, required: true },
    subType: { type: String, required: false },
    branchId: { type: String, required: false }, // <-- added

    // Meeting style
    isVirtualEvent: { type: Boolean, default: false },
    virtualEventDetails: { type: VirtualEventDetailsSchema, required: false },

    // Flags
    isSingleDayEvent: { type: Boolean, default: true },
    isPrivate: { type: Boolean, default: false },
    isAllDayEvent: { type: Boolean, default: false },

    // Time (Dates are canonical; string fields are synced for clients)
    startDateTime: { type: Date },
    start: { type: String },        // ISO; auto-filled from startDateTime
    startTime: { type: String },    // "HH:mm" (optional UI helper)

    endDateTime: { type: Date },
    end: { type: String },          // ISO; auto-filled from endDateTime
    endTime: { type: String },      // "HH:mm"

    durationHours: { type: Number },
    durationMinutes: { type: Number },

    // Other
    location: { type: LocationSchema, required: false },
    attendees: { type: [AttendeeSchema], required: false, default: [] },
    notes: { type: [NoteSchema], required: false, default: [] },
    comments: { type: [CommentSchema], required: false, default: [] },
    attachments: { type: [AttachmentSchema], required: false, default: [] },

    // Related models
    relatedModel: { type: String, required: false },
    relatedId: { type: Schema.Types.ObjectId, required: false },
    milestone: { type: String, required: false },

    status: {
      type: String,
      enum: Object.values(CalendarEventStatus),
      default: CalendarEventStatus.DRAFT,
    },

    createdBy: { type: String },
    createdById: { type: String },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

/**
 * Virtuals for FullCalendar compatibility
 * - title: uses name
 * - allDay: mirrors isAllDayEvent
 */
CalendarEventSchema.virtual("title").get(function (this: ICalendarEvent) {
  return this.name;
});
CalendarEventSchema.virtual("allDay").get(function (this: ICalendarEvent) {
  return !!this.isAllDayEvent;
});

/**
 * Keep string fields (start/end) in sync with Date fields.
 * Also compute isSingleDayEvent if both dates exist.
 */
CalendarEventSchema.pre("save", function (next) {
  if (this.startDateTime) {
    this.start = this.startDateTime.toISOString();
    // Default startTime if not provided
    if (!this.startTime) {
      const d = this.startDateTime;
      this.startTime = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
    }
  }
  if (this.endDateTime) {
    this.end = this.endDateTime.toISOString();
    if (!this.endTime) {
      const d = this.endDateTime;
      this.endTime = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
    }
  }

  // Derive endDateTime from duration if missing
  if (this.startDateTime && !this.endDateTime && (this.durationHours || this.durationMinutes)) {
    const ms =
      (this.durationHours ? this.durationHours * 60 : 0) * 60 * 1000 +
      (this.durationMinutes ? this.durationMinutes : 0) * 60 * 1000;
    this.endDateTime = new Date(this.startDateTime.getTime() + ms);
    this.end = this.endDateTime.toISOString();
  }

  // Normalize all-day: strip time to midnight if desired (optional)
  if (this.isAllDayEvent && this.startDateTime) {
    const s = new Date(this.startDateTime);
    s.setHours(0, 0, 0, 0);
    this.startDateTime = s;
    this.start = s.toISOString();
    if (this.endDateTime) {
      const e = new Date(this.endDateTime);
      e.setHours(0, 0, 0, 0);
      this.endDateTime = e;
      this.end = e.toISOString();
    }
  }

  // isSingleDayEvent
  if (this.startDateTime && this.endDateTime) {
    const sameDay =
      this.startDateTime.getFullYear() === this.endDateTime.getFullYear() &&
      this.startDateTime.getMonth() === this.endDateTime.getMonth() &&
      this.startDateTime.getDate() === this.endDateTime.getDate();
    this.isSingleDayEvent = sameDay;
  }

  next();
});

/**
 * Helpful indexes for range queries and common filters
 */
CalendarEventSchema.index({ startDateTime: 1 });
CalendarEventSchema.index({ branchId: 1, startDateTime: 1 });
CalendarEventSchema.index({ createdById: 1, startDateTime: 1 });
CalendarEventSchema.index({ type: 1, startDateTime: 1 });

export const CalendarEventModel: Model<ICalendarEvent> =
  mongoose.models?.CalendarEvents || mongoose.model<ICalendarEvent>("CalendarEvents", CalendarEventSchema);
