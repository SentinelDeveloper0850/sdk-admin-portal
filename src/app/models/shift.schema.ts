import mongoose, { Schema, Document, Model } from "mongoose";

// Define the interface for TypeScript
export interface IShift extends Document {
  weekendStart: Date;
  saturday: string[];
  sunday: string[];
  groupNote?: string;
}

const shiftSchema: Schema = new Schema(
  {
    weekendStart: {
      type: Date, // Always a Saturday
      required: true,
      unique: true,
    },
    saturday: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    sunday: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    groupNote: {
      type: String, // e.g., "Everyone"
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

shiftSchema.index({ weekendStart: 1 });

export const ShiftModel: Model<IShift> = mongoose.model<IShift>("Shift", shiftSchema);

export default ShiftModel;