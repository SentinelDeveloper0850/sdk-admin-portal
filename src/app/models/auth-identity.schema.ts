import mongoose, { Document, Model, Schema } from "mongoose";

export interface IAuthIdentity extends Document {
  userId: string;
  provider: string;
  providerUserId: string;
  clerkUserId: string;
  emailAtLinkTime: string;
  lastLoginAt: Date;
}

const AuthIdentitySchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: "users",
    index: true,
    required: true,
    unique: true
  },
  provider: {
    type: String,
    enum: ["google", "clerk"],
    required: true
  },
  providerUserId: {
    type: String,
    index: true,
    unique: true,
    default: undefined,
  },
  clerkUserId: {
    type: String,
    index: true,
    required: true,
    unique: true
  },
  emailAtLinkTime: {
    type: String,
    unique: true,
    lowercase: true,
    trim: true
  },
  lastLoginAt: {
    type: Date,
    unique: true
  },
}, {
  timestamps: true,
  versionKey: false
});

/**
 * Indexes & constraints
 * - Unique per Clerk user
 * - Unique per provider identity (e.g., Google sub)
 * - Optional guard: a user cannot link two identities from the same provider
 */
AuthIdentitySchema.index({ clerkUserId: 1 }, { unique: true });
AuthIdentitySchema.index(
  { provider: 1, providerUserId: 1 },
  { unique: true, partialFilterExpression: { providerUserId: { $type: "string" } } }
);
AuthIdentitySchema.index(
  { userId: 1, provider: 1 },
  { unique: true } // comment out if you *want* multiple google identities per user (rare)
);

// Helpful for recent sign-ins dashboard
AuthIdentitySchema.index({ lastLoginAt: -1 });

export const AuthIdentityModel: Model<IAuthIdentity> =
  mongoose.models.auth_identities || mongoose.model<IAuthIdentity>("auth_identities", AuthIdentitySchema, "auth_identities");

export default AuthIdentityModel;