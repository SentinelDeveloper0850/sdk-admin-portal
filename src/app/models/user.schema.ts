import bcrypt from "bcrypt";
import mongoose, { Document, Schema } from "mongoose";

// Define the interface for TypeScript
export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  role: string;
}

// Define the schema
const userSchema: Schema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, default: "user" },
}, { timestamps: true });

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password as string, salt);
  next();
});

// Check if the model is already compiled
const UserModel = mongoose.models.User || mongoose.model<IUser>("User", userSchema);

export default UserModel;
