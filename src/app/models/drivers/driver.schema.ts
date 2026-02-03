import mongoose, { type Document, type Model, Schema } from "mongoose";

export type DriverStatus =
  | "OFF_DUTY"
  | "AVAILABLE"
  | "EN_ROUTE"
  | "ON_SITE"
  | "RETURNING"
  | "BLOCKED";

export interface IDriver extends Document {
  // Relationship
  staffMemberId: mongoose.Types.ObjectId; // ref to staff_members

  // Identity / operations
  driverCode: string; // human-friendly identifier, e.g. "DRV-0007" or "THABO001"
  active: boolean;

  // Optional operational fields (MVP-safe)
  status: DriverStatus;
  statusUpdatedAt?: Date;

  vehicle?: {
    registration?: string;
    make?: string;
    model?: string;
    color?: string;
  };

  // Auth (PIN login)
  pinHash?: string;
  pinUpdatedAt?: Date;
  pinExpiresAt?: Date; // optional: rotate monthly/quarterly etc
  pinFailedAttempts?: number;
  pinLockedUntil?: Date;

  // Audit
  createdAt?: Date;
  updatedAt?: Date;
  createdBy?: string;
  updatedBy?: string;
}

const VehicleSchema = new Schema(
  {
    registration: { type: String },
    make: { type: String },
    model: { type: String },
    color: { type: String },
  },
  { _id: false }
);

const DriverSchema = new Schema<IDriver>(
  {
    staffMemberId: {
      type: Schema.Types.ObjectId,
      ref: "staff_members",
      required: true,
    },

    driverCode: { type: String, required: true, unique: true, index: true },
    active: { type: Boolean, default: true, index: true },

    status: {
      type: String,
      enum: [
        "OFF_DUTY",
        "AVAILABLE",
        "EN_ROUTE",
        "ON_SITE",
        "RETURNING",
        "BLOCKED",
      ],
      default: "OFF_DUTY",
      index: true,
    },
    statusUpdatedAt: { type: Date },

    vehicle: { type: VehicleSchema },

    pinHash: { type: String },
    pinUpdatedAt: { type: Date },
    pinExpiresAt: { type: Date },
    pinFailedAttempts: { type: Number, default: 0 },
    pinLockedUntil: { type: Date },

    createdBy: { type: String },
    updatedBy: { type: String },
  },
  { timestamps: { createdAt: true, updatedAt: true } }
);

// One staff member can be (at most) one driver
DriverSchema.index({ staffMemberId: 1 }, { unique: true });

// Useful queries
DriverSchema.index({ active: 1, status: 1 });

export const DriverModel: Model<IDriver> =
  mongoose.models.drivers ||
  mongoose.model<IDriver>("drivers", DriverSchema, "drivers");
