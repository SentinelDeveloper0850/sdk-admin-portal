import mongoose, { Schema } from "mongoose";
import { EFuneralStatus, EPaymentStatus, IDeceased, IFuneral, IFuneralAssignment, IInformant, IScheduledItem, ITransportDetail } from "@/types/funeral";

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
    role: { type: String, required: true },
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

const ScheduledItemSchema = new Schema<IScheduledItem>(
  {
    enabled: { type: Boolean, default: false },
    startDateTime: Date,
    endDateTime: Date,
    location: { type: Schema.Types.Mixed },
    notes: String,
    calendarEventId: { type: Schema.Types.ObjectId, ref: "calendar-events" },
  },
  { _id: false }
);

const FuneralSchema: Schema = new Schema(
  {
    referenceNumber: { type: String, required: true, unique: true },
    policyNumber: String,
    calendarEventId: { type: Schema.Types.ObjectId, ref: "calendar-events" },

    informant: { type: InformantSchema, required: true },
    deceased: { type: DeceasedSchema, required: true },

    serviceDateTime: { type: Date, required: false },
    burialDateTime: { type: Date, required: false },
    isSameDay: { type: Boolean, default: true },

    location: { type: Schema.Types.Mixed },
    cemetery: String,
    graveNumber: String,

    branchId: String,
    assignments: { type: [AssignmentSchema], default: [] },
    transport: { type: [TransportSchema], default: [] },

    estimatedCost: Number,
    actualCost: Number,
    paymentStatus: { type: String, default: "unpaid" },

    status: {
      type: String,
      default: "planned",
    },

    // #region Milestones we care about on the calendar (for FullCalendar)
    pickUp: { type: ScheduledItemSchema, default: () => ({ enabled: false }) },         // hospital/gov mortuary pickup
    bathing: { type: ScheduledItemSchema, default: () => ({ enabled: false }) },        // family bathing
    tentErection: { type: ScheduledItemSchema, default: () => ({ enabled: false }) },   // tent at family house
    delivery: { type: ScheduledItemSchema, default: () => ({ enabled: false }) },       // deliver coffined deceased
    serviceEscort: { type: ScheduledItemSchema, default: () => ({ enabled: false }) },  // escort family to church
    burial: { type: ScheduledItemSchema, default: () => ({ enabled: false }) },         // cemetery burial
    // #endregion

    notes: String,
    createdBy: String,
    createdById: String,
  },
  { timestamps: true }
);

// Helpful virtuals and indexes
FuneralSchema.virtual("deceasedFullName").get(function (this: IFuneral) {
  return `${this.deceased.firstName} ${this.deceased.lastName}`;
});

FuneralSchema.index({ branchId: 1, serviceDateTime: 1 });
FuneralSchema.index({ policyNumber: 1 });
FuneralSchema.index({ calendarEventId: 1 });

export const FuneralModel =
  mongoose.models?.["funerals"]
  || mongoose.model<IFuneral>("funerals", FuneralSchema);
