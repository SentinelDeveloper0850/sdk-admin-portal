import { Schema, model, models } from "mongoose";

export interface IPolicyConfiguration {
  _id?: string;
  name: string;
  type: string;
  value: string | number | boolean;
  description: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy: string;
}

const policyConfigurationSchema = new Schema<IPolicyConfiguration>(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    type: {
      type: String,
      required: true,
      lowercase: true,
      enum: ["string", "number", "boolean", "json"],
    },
    value: {
      type: Schema.Types.Mixed,
      required: true,
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
    collection: "policy_configurations",
  }
);

// Index for faster queries
policyConfigurationSchema.index({ name: 1 });
policyConfigurationSchema.index({ type: 1 });
policyConfigurationSchema.index({ isActive: 1 });

// Pre-save middleware to ensure type is lowercase
policyConfigurationSchema.pre("save", function (next) {
  if (this.type) {
    this.type = this.type.toLowerCase();
  }
  next();
});

// Validate JSON type values
policyConfigurationSchema.pre("save", function (next) {
  if (this.type === "json" && typeof this.value === "string") {
    try {
      JSON.parse(this.value);
    } catch (error) {
      return next(new Error("Invalid JSON format for value"));
    }
  }
  next();
});

export const PolicyConfiguration =
  models.policy_configurations ||
  model<IPolicyConfiguration>(
    "policy_configurations",
    policyConfigurationSchema,
    "policy_configurations"
  );
