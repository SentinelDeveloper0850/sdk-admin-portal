// staff-member.schema.ts
import mongoose, { Document, Schema } from "mongoose";

export type IdentityType = "SA_ID" | "PASSPORT" | "OTHER";

export interface IStaffIdentity {
  type: IdentityType;
  number: string;
  country?: string;
}

export interface IStaffMember extends Document {
  firstNames: string;
  initials: string;
  lastName: string;

  identity: IStaffIdentity;

  address?: IAddress;
  contact?: IContact;
  employment?: IEmployment;

  // Portal user link (optional)
  user?: mongoose.Types.ObjectId;

  createdAt?: Date;
  updatedAt?: Date;
  createdBy?: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId;
}

export interface IAddress {
  addressLine1: string;
  addressLine2?: string;
  suburb?: string;
  town?: string;
  province?: string;
  country?: string;
  postalCode?: string;
}

export interface IContact {
  email?: string;
  phone?: string;
}

export interface IEmployment {
  regionId?: string;
  branchId?: string;
  businessUnit?: string;
  department?: string;
  position?: string;
  startDate?: Date;
  endDate?: Date;
  isActive?: boolean;
  isPortalUser?: boolean;
  notes?: string;
}

const StaffIdentitySchema = new Schema<IStaffIdentity>(
  {
    type: {
      type: String,
      enum: ["SA_ID", "PASSPORT", "OTHER"],
      required: true,
      default: "SA_ID",
    },
    number: {
      type: String,
      required: true,
      trim: true,
    },
    country: {
      type: String,
      trim: true,
      uppercase: true,
    },
  },
  { _id: false }
);

const StaffMemberSchema = new Schema<IStaffMember>(
  {
    firstNames: { type: String, required: true, trim: true },
    initials: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },

    identity: { type: StaffIdentitySchema, required: true },

    address: { type: Schema.Types.Mixed, default: null },
    contact: { type: Schema.Types.Mixed, default: null },
    employment: { type: Schema.Types.Mixed, default: null },

    user: { type: Schema.Types.ObjectId, ref: "users", default: null },

    createdBy: { type: Schema.Types.ObjectId, ref: "users", default: null },
    updatedBy: { type: Schema.Types.ObjectId, ref: "users", default: null },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ---- Indexes
StaffMemberSchema.index(
  { "identity.type": 1, "identity.number": 1, "identity.country": 1 },
  { unique: true, name: "identity_unique" }
);

StaffMemberSchema.index({ user: 1 });
StaffMemberSchema.index({ "employment.branchId": 1 });
StaffMemberSchema.index({ "employment.regionId": 1 });
StaffMemberSchema.index({ "employment.isActive": 1 });

// ---- Virtuals
StaffMemberSchema.virtual("fullName").get(function () {
  return [this.firstNames, this.lastName].filter(Boolean).join(" ");
});

// ---- Normalization
StaffMemberSchema.pre("save", function (next) {
  if (this.isModified("identity") && this.identity) {
    this.identity.number = this.identity.number.trim().toUpperCase();
    if (this.identity.country) {
      this.identity.country = this.identity.country.trim().toUpperCase();
    }
  }
  next();
});

export const StaffMemberModel =
  mongoose.models.staff_members ||
  mongoose.model<IStaffMember>(
    "staff_members",
    StaffMemberSchema,
    "staff_members"
  );
