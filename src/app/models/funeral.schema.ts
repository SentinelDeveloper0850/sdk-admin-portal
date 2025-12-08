import { DeceasedAgeGroup, IAddress, INote, ScheduledItemStatus } from "@/types";
import { IDeceased, IFuneral, IFuneralAssignment, IInformant, IScheduledItem, ITransportDetail } from "@/types/funeral";
import mongoose, { Schema } from "mongoose";

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
    status: { type: String, default: "pending" },
    calendarEventId: { type: Schema.Types.ObjectId, ref: "CalendarEvents" },
  },
  { _id: false }
);

const AddressSchema = new Schema<IAddress>({
  name: { type: String, required: true },
  addressLine1: { type: String, required: false },
  addressLine2: { type: String, required: false },
  suburb: { type: String, required: false },
  townOrCity: { type: String, required: false },
  province: { type: String, required: false, default: "Gauteng" },
  country: { type: String, required: false, default: "South Africa" },
  postalCode: { type: String, required: false },
});

const NoteSchema = new Schema<INote>({
  note: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  createdBy: { type: String, required: true },
  createdById: { type: String, required: true },
});

const PickupSchema = new Schema({
  enabled: { type: Boolean, default: false },
  dateTime: { type: Date, required: true },
  durationMinutes: { type: Number, required: false, default: 60 },
  deceasedAgeGroup: { type: String, required: true, enum: Object.values(DeceasedAgeGroup) },
  address: { type: AddressSchema, required: true },
  notes: { type: [NoteSchema], required: false, default: [] },
  status: { type: String, enum: Object.values(ScheduledItemStatus), default: ScheduledItemStatus.PENDING },
  calendarEventId: { type: Schema.Types.ObjectId, ref: "CalendarEvents" },
})

const BathingSchema = new Schema({
  enabled: { type: Boolean, default: false },
  dateTime: { type: Date, required: true },
  durationMinutes: { type: Number, required: false, default: 60 },
  address: { type: AddressSchema, required: true },
  notes: { type: [NoteSchema], required: false, default: [] },
  status: { type: String, enum: Object.values(ScheduledItemStatus), default: ScheduledItemStatus.PENDING },
  calendarEventId: { type: Schema.Types.ObjectId, ref: "CalendarEvents" },
});

const TentErectionSchema = new Schema({
  enabled: { type: Boolean, default: false },
  dateTime: { type: Date, required: true },
  durationMinutes: { type: Number, required: false, default: 60 },
  address: { type: AddressSchema, required: true },
  notes: { type: [NoteSchema], required: false, default: [] },
  status: { type: String, enum: Object.values(ScheduledItemStatus), default: ScheduledItemStatus.PENDING },
  calendarEventId: { type: Schema.Types.ObjectId, ref: "CalendarEvents" },
});

const DeliverySchema = new Schema({
  enabled: { type: Boolean, default: false },
  dateTime: { type: Date, required: true },
  durationMinutes: { type: Number, required: false, default: 60 },
  address: { type: AddressSchema, required: true },
  notes: { type: [NoteSchema], required: false, default: [] },
  status: { type: String, enum: Object.values(ScheduledItemStatus), default: ScheduledItemStatus.PENDING },
  calendarEventId: { type: Schema.Types.ObjectId, ref: "CalendarEvents" },
});

const ChurchEscortSchema = new Schema({
  enabled: { type: Boolean, default: false },
  origin: { type: AddressSchema, required: true },
  destination: { type: AddressSchema, required: true },
  dateTime: { type: Date, required: true },
  durationMinutes: { type: Number, required: false, default: 60 },
  address: { type: AddressSchema, required: true },
  notes: { type: [NoteSchema], required: false, default: [] },
  status: { type: String, enum: Object.values(ScheduledItemStatus), default: ScheduledItemStatus.PENDING },
  calendarEventId: { type: Schema.Types.ObjectId, ref: "CalendarEvents" },
});

const BurialSchema = new Schema({
  enabled: { type: Boolean, default: false },
  dateTime: { type: Date, required: true },
  durationMinutes: { type: Number, required: false, default: 60 },
  address: { type: AddressSchema, required: true },
  notes: { type: [NoteSchema], required: false, default: [] },
  status: { type: String, enum: Object.values(ScheduledItemStatus), default: ScheduledItemStatus.PENDING },
  calendarEventId: { type: Schema.Types.ObjectId, ref: "CalendarEvents" },
});

const FuneralSchema: Schema = new Schema(
  {
    referenceNumber: { type: String, required: true, unique: true },
    policyNumber: String,

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
    pickUp: { type: PickupSchema, default: () => ({ enabled: false }) },         // hospital/gov mortuary pickup
    bathing: { type: BathingSchema, default: () => ({ enabled: false }) },        // family bathing
    tentErection: { type: TentErectionSchema, default: () => ({ enabled: false }) },   // tent at family house
    delivery: { type: DeliverySchema, default: () => ({ enabled: false }) },       // deliver coffined deceased
    serviceEscort: { type: ChurchEscortSchema, default: () => ({ enabled: false }) },  // escort family to church
    burial: { type: BurialSchema, default: () => ({ enabled: false }) },         // cemetery burial
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
  mongoose.models.funerals ||
  mongoose.model<IFuneral>("funerals", FuneralSchema, "funerals");
