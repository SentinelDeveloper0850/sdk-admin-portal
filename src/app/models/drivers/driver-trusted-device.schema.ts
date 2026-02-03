import mongoose, { type Document, type Model, Schema } from "mongoose";

export interface IDriverTrustedDevice extends Document {
  driverId: mongoose.Types.ObjectId;
  deviceId: string; // uuid

  refreshTokenHash: string;

  device?: {
    platform?: string; // ios | android
    model?: string;
    appVersion?: string;
  };

  firstSeenAt?: Date;
  lastSeenAt?: Date;
  revokedAt?: Date;
  revokeReason?: string;

  createdAt?: Date;
  updatedAt?: Date;
}

const DeviceMetaSchema = new Schema(
  {
    platform: { type: String },
    model: { type: String },
    appVersion: { type: String },
  },
  { _id: false }
);

const DriverTrustedDeviceSchema = new Schema<IDriverTrustedDevice>(
  {
    driverId: {
      type: Schema.Types.ObjectId,
      ref: "drivers",
      required: true,
      index: true,
    },
    deviceId: { type: String, required: true, unique: true, index: true },

    refreshTokenHash: { type: String, required: true },

    device: { type: DeviceMetaSchema },

    firstSeenAt: { type: Date, default: Date.now },
    lastSeenAt: { type: Date, default: Date.now },

    revokedAt: { type: Date },
    revokeReason: { type: String },
  },
  { timestamps: { createdAt: true, updatedAt: true } }
);

DriverTrustedDeviceSchema.index({ driverId: 1, revokedAt: 1 });

export const DriverTrustedDeviceModel: Model<IDriverTrustedDevice> =
  mongoose.models.driver_trusted_devices ||
  mongoose.model<IDriverTrustedDevice>(
    "driver_trusted_devices",
    DriverTrustedDeviceSchema,
    "driver_trusted_devices"
  );
