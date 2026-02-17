// region.schema.ts
import mongoose, { Document, Schema } from "mongoose";

export interface IRegion extends Document {
  id: string;
  name: string;
  code: string;
  province?: string;
  manager?: mongoose.Types.ObjectId;
  isActive?: boolean;
  createdBy?: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}

const PROVINCES = [
  "Gauteng",
  "Western Cape",
  "KwaZulu-Natal",
  "Eastern Cape",
  "Free State",
  "Mpumalanga",
  "Limpopo",
  "North West",
  "Northern Cape",
] as const;

const regionSchema = new Schema<IRegion>(
  {
    id: { type: String, required: true, unique: true, index: true, trim: true },
    name: { type: String, required: true, trim: true, maxlength: 100 },
    code: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
      maxlength: 10,
    },

    province: {
      type: String,
      enum: {
        values: [...PROVINCES],
        message: "Please select a valid province",
      },
    },

    manager: { type: Schema.Types.ObjectId, ref: "users", default: null },
    isActive: { type: Boolean, default: true },

    createdBy: { type: Schema.Types.ObjectId, ref: "users", default: null },
    updatedBy: { type: Schema.Types.ObjectId, ref: "users", default: null },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

regionSchema.pre("save", function (next) {
  if (this.isModified("code") && typeof this.code === "string") {
    this.code = this.code.toUpperCase();
  }
  next();
});

export const RegionModel =
  mongoose.models.regions ||
  mongoose.model<IRegion>("regions", regionSchema, "regions");

export default RegionModel;
