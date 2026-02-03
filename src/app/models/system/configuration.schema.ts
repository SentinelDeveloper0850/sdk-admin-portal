import { Schema, model, models } from "mongoose";

export interface IConfiguration {
  _id?: string;
  key: string;
  value: string | number | boolean;
  category: string;
  description: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy: string;
}

const configurationSchema = new Schema<IConfiguration>(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    value: {
      type: Schema.Types.Mixed,
      required: true,
    },
    category: {
      type: String,
      required: true,
      lowercase: true,
      enum: [
        "system",
        "security",
        "email",
        "notification",
        "payment",
        "policy",
      ],
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: String,
      required: true,
    },
    updatedBy: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
    collection: "configurations",
  }
);

// Index for faster queries
configurationSchema.index({ key: 1 });
configurationSchema.index({ category: 1 });
configurationSchema.index({ isActive: 1 });

// Pre-save middleware to ensure key is uppercase
configurationSchema.pre("save", function (next) {
  if (this.key) {
    this.key = this.key.toUpperCase();
  }
  if (this.category) {
    this.category = this.category.toLowerCase();
  }
  next();
});

export const ConfigurationModel =
  models.configurations ||
  model<IConfiguration>(
    "configurations",
    configurationSchema,
    "configurations"
  );
