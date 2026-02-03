import mongoose, { Document, Model, Schema } from "mongoose";

export interface IDutyRoster extends Document {
  date: Date; // normalized to start-of-day
  staffMemberIds: mongoose.Types.ObjectId[]; // may include non-portal staff
  note?: string;
  createdById?: string;
  updatedById?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const dutyRosterSchema = new Schema(
  {
    date: {
      type: Date,
      required: true,
      unique: true,
      index: true,
    },
    staffMemberIds: [
      {
        type: Schema.Types.ObjectId,
        ref: "staff_members",
        required: true,
      },
    ],
    note: { type: String, required: false, default: "" },
    createdById: { type: String, required: false, default: null },
    updatedById: { type: String, required: false, default: null },
  },
  { timestamps: true }
);

export const DutyRosterModel: Model<IDutyRoster> =
  mongoose.models.duty_rosters ||
  mongoose.model<IDutyRoster>("duty_rosters", dutyRosterSchema, "duty_rosters");
