import mongoose from "mongoose";

const VehicleSchema = new mongoose.Schema({
  id: { type: String, required: true },
  name: { type: String, required: true },
  registrationNumber: { type: String, required: true },
  fleetId: { type: String, required: true },
  vin: { type: String },

  type: { type: String, required: true },
  make: { type: String },
  model: { type: String },
  year: { type: Number },
  engineType: { type: String },
  fuelCapacity: { type: Number },
  fuelType: { type: String },
  mileage: { type: Number },
  seatingCapacity: { type: Number },
  loadCapacity: { type: Number },

  status: { type: String, default: "Active" },
  currentLocation: { type: String },
  assignedDriverId: { type: String },
  lastTripId: { type: String },

  maintenanceSchedule: [
    {
      date: { type: Date },
      type: { type: String },
      status: { type: String },
    },
  ],
  accidentHistory: [
    {
      date: { type: Date },
      description: { type: String },
      repairCost: { type: Number },
    },
  ],
  serviceHistory: [
    {
      date: { type: Date },
      type: { type: String },
      cost: { type: Number },
    },
  ],

  gpsEnabled: { type: Boolean, default: false },
  trackerId: { type: String },
  lastKnownLocation: {
    latitude: { type: Number },
    longitude: { type: Number },
    timestamp: { type: Date },
  },

  owner: { type: String },
  purchaseDate: { type: Date },
  purchasePrice: { type: Number },
  insuranceDetails: {
    provider: { type: String },
    policyNumber: { type: String },
    expiryDate: { type: Date },
  },
  registrationDocument: { type: String },
  warrantyDetails: {
    expiryDate: { type: Date },
    provider: { type: String },
  },

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  createdBy: { type: String },
  updatedBy: { type: String },
});

export const VehicleModel = mongoose.model("Vehicle", VehicleSchema);
