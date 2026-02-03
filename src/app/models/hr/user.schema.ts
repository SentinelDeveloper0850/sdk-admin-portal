import bcrypt from "bcrypt";
import mongoose, { Document, Model, Schema } from "mongoose";

import { IEmployee } from "./employee.schema";

// Define the interface for TypeScript
export interface IUser extends Document {
  name: string;
  email: string;
  phone?: string;
  address?: string;
  password: string;
  role?: string; // legacy (keep for now)
  roles?: string[]; // new — primary source of truth moving forward
  status: string;
  mustChangePassword?: boolean;
  avatarUrl?: string;
  employeeId?: string; // Optional FK to Employee
  employee?: IEmployee;
  preferences?: {
    theme?: "light" | "dark" | "system";
    notifications?: boolean;
  };
  lastSeenAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date;
  deletedBy?: string;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const preferencesSchema = new mongoose.Schema(
  {
    theme: {
      type: String,
      enum: ["light", "dark", "system"],
      default: "system",
    },
    notifications: {
      type: Boolean,
      default: true,
    },
  },
  { _id: false }
); // prevent creating _id for subdocument

// Define the schema
const userSchema: Schema<IUser> = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String, default: "" },
    address: { type: String, default: "" },
    password: { type: String, required: true },
    role: { type: String, default: "member", required: false },
    roles: { type: Array<String>, default: ["member"], required: false },
    status: { type: String, default: "Inactive" },
    deletedAt: { type: Date, required: false },
    deletedBy: { type: String, required: false },
    mustChangePassword: { type: Boolean, default: false, required: false },
    avatarUrl: { type: String, default: "" },
    preferences: { type: preferencesSchema, default: () => ({}) },
    // Presence timestamp updated via heartbeat API
    lastSeenAt: { type: Date, required: false, default: null },
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: false,
      default: null,
    },
  },
  { timestamps: true }
);

// Hash password before saving
userSchema.pre<IUser>("save", async function (next) {
  if (!this.isModified("password")) return next();

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare passwords
userSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

// Check if the model is already compiled
export const UserModel: Model<IUser> =
  mongoose.models.users || mongoose.model<IUser>("users", userSchema, "users");

export default UserModel;
