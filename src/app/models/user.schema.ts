import bcrypt from "bcrypt";
import mongoose, { Document, Model, Schema } from "mongoose";

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
  avatarUrl?: string;
  preferences?: {
    theme?: "light" | "dark" | "system";
    notifications?: boolean;
  };
  createdAt?: Date;
  updatedAt?: Date;
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
    avatarUrl: { type: String, default: "" },
    preferences: { type: preferencesSchema, default: () => ({}) },
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
  mongoose.models.users || mongoose.model<IUser>("users", userSchema);

export default UserModel;
