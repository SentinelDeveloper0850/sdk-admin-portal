// src/app/models/funeral.schema.ts
import mongoose, { Schema } from "mongoose";

import type { ILocation } from "@/app/models/calendar-event.schema";
import type {
  IDeceased,
  IFuneral,
  IFuneralAssignment,
  IInformant,
  ITransportDetail,
} from "@/types/funeral";

export enum FuneralStatus {
  DRAFT = "draft",
  CONFIRMED = "confirmed",
  IN_PROGRESS = "in_progress",
  COMPLETED = "completed",
  CANCELLED = "cancelled",
  POSTPONED = "postponed",
}

export enum PaymentStatus {
  UNPAID = "unpaid",
  PARTIAL = "partial",
  PAID = "paid",
  WAIVED = "waived",
}

export enum FuneralMilestoneType {
  PICKUP = "pickup",
  BATHING = "bathing",
  TENT_ERECTION = "tent_erection",
  DELIVERY = "delivery",
  SERVICE = "service",
  ESCORT = "escort",
  BURIAL = "burial",
}

export enum ScheduledItemStatus {
  PENDING = "pending",
  CONFIRMED = "confirmed",
  CANCELLED = "cancelled",
  COMPLETED = "completed",
}

type FuneralNote = {
  note: string;
  createdAt: Date;
  createdBy: string;
  createdById: string;
};

const NoteSchema = new Schema<FuneralNote>(
  {
    note: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    createdBy: { type: String, required: true },
    createdById: { type: String, required: true },
  },
  { _id: false }
);

const InformantSchema = new Schema<IInformant>(
  {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    idNumber: String,
    passportNumber: String,
    address: String,
    phoneNumber: String,
    email: String,
    relationship: String,
  },
  { _id: false }
);

const DeceasedSchema = new Schema<IDeceased>(
  {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    idNumber: String,
    passportNumber: String,
    dateOfBirth: Date,
    dateOfDeath: Date,
    gender: { type: String, enum: ["male", "female", "other"] },
  },
  { _id: false }
);

const AssignmentSchema = new Schema<IFuneralAssignment>(
  {
    role: { type: String, required: true }, // later: enum if you want
    staffId: { type: String },
    staffName: { type: String },
    contact: { type: String },
    notes: { type: String },
  },
  { _id: false }
);

const TransportSchema = new Schema<ITransportDetail>(
  {
    vehicleId: String,
    driverId: String,
    registration: String,
    departureTime: Date,
    arrivalTime: Date,
    notes: String,
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

const CompletedBySchema = new Schema(
  {
    id: { type: String, required: true },
    name: { type: String, required: true },
  },
  { _id: false }
);

const MilestoneSchema = new Schema(
  {
    type: { type: String, required: true }, // pickup, bathing, ...
    enabled: { type: Boolean, default: false },

    startDateTime: Date,
    endDateTime: Date,
    durationMinutes: Number,

    location: { type: Schema.Types.Mixed },

    origin: { type: Schema.Types.Mixed },
    destination: { type: Schema.Types.Mixed },

    status: {
      type: String,
      enum: ["pending", "completed", "cancelled"],
      default: "pending",
    },

    // Burial info
    cemeteryCode: { type: String },
    graveNumber: { type: String },
    via: { type: LocationSchema, required: false },

    completedAt: { type: Date },
    completedBy: { type: CompletedBySchema },

    calendarEventId: { type: Schema.Types.ObjectId, ref: "calendar_events" },

    notes: { type: [NoteSchema], default: [] },
  },
  { _id: false }
);

const FuneralSchema: Schema = new Schema(
  {
    referenceNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    policyNumber: { type: String, index: true },

    branchId: { type: String, required: true, index: true },

    informant: { type: InformantSchema, required: true },
    deceased: { type: DeceasedSchema, required: true },

    /**
     * “Service basics” for quick listing/filtering.
     * The actual schedule should be represented by milestones, but these are useful
     * for legacy + fast queries.
     */
    serviceDateTime: { type: Date, index: true },
    burialDateTime: { type: Date, index: true },
    isSameDay: { type: Boolean, default: true },

    // Where the main service happens (not the escort)
    serviceLocation: { type: LocationSchema, required: false },

    assignments: { type: [AssignmentSchema], default: [] },
    transport: { type: [TransportSchema], default: [] },

    /**
     * Financial summary (detail can live in a Payments collection later)
     */
    estimatedCost: { type: Number, min: 0 },
    actualCost: { type: Number, min: 0 },
    paymentStatus: {
      type: String,
      enum: Object.values(PaymentStatus),
      default: PaymentStatus.UNPAID,
      index: true,
    },

    status: {
      type: String,
      enum: Object.values(FuneralStatus),
      default: FuneralStatus.DRAFT,
      index: true,
    },

    /**
     * Single, consistent milestones array.
     * You can query by milestones.type + milestones.startDateTime.
     */
    milestones: { type: [MilestoneSchema], default: [] },

    notes: { type: [NoteSchema], default: [] },

    createdBy: { type: String, required: true },
    createdById: { type: String, required: true, index: true },

    updatedBy: { type: String },
    updatedById: { type: String },
  },
  { timestamps: true }
);

// Helpful virtuals and indexes
FuneralSchema.virtual("deceasedFullName").get(function (this: any) {
  const d = this.deceased;
  return d ? `${d.firstName} ${d.lastName}` : "";
});

// Common query paths
FuneralSchema.index({ branchId: 1, serviceDateTime: 1 });
FuneralSchema.index({ branchId: 1, status: 1, serviceDateTime: 1 });
FuneralSchema.index({ "milestones.type": 1, "milestones.startDateTime": 1 });
FuneralSchema.index({ "milestones.calendarEventId": 1 });

export const FuneralModel =
  mongoose.models.funerals ||
  mongoose.model<IFuneral>("funerals", FuneralSchema, "funerals");
