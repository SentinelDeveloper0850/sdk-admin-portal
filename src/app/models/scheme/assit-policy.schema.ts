import mongoose, { Schema } from "mongoose";
import { PolicyModel } from "./policy.schema";
import { SchemeSocietyModel } from "./scheme-society.schema";

// Define the interface for TypeScript
export interface IAssitPolicy {
  _id?: mongoose.Types.ObjectId | string;
  membershipID: string;
  linkedEasipolPolicyId?: mongoose.Types.ObjectId;
  linkedSocietyId?: mongoose.Types.ObjectId;
  lastName: string;
  initials: string;
  fullName: string; // This is the initials + lastName
  dateOfBirth: string;
  entryDate: Date;
  coverDate: Date;
  payAtNumber: string;
  totalPremium: number;
  totalPremiumString: string;
  waitingPeriod: number;
  category: string; // This is the group or society name like "FAMILY 18-74", "INDIVIDUAL 18-74", "FAMILY 75+", "INDIVIDUAL 75+", "FRIENDS Burial Society"
  hasLinkedSociety: boolean;
  hasLinkedEasipolPolicy: boolean;
}

// Define the schema
const AssitPolicySchema: Schema = new Schema({
  membershipID: { type: String, required: true },

  linkedEasipolPolicyId: { type: Schema.Types.ObjectId, ref: "policies", required: false },
  linkedEasipolPolicyNumber: { type: String, required: false },

  linkedSocietyId: { type: Schema.Types.ObjectId, ref: "scheme-societies", required: false },
  linkedSocietyName: { type: String, required: false },

  lastName: { type: String, required: true },
  initials: { type: String, required: true },
  fullName: { type: String, required: false, default: function (this: IAssitPolicy) { return this.initials + " " + this.lastName; } },
  dateOfBirth: { type: String, required: true },
  entryDate: { type: Date, required: true },
  coverDate: { type: Date, required: true },
  payAtNumber: { type: String, required: true },
  totalPremium: { type: Number, required: true },
  totalPremiumString: { type: String, required: true },
  waitingPeriod: { type: Number, required: true },
  category: { type: String, required: true },
  hasLinkedSociety: { type: Boolean, required: false, default: false },
  hasLinkedEasipolPolicy: { type: Boolean, required: false, default: false },
}, { timestamps: true });

// Populate the linkedEasipolPolicyId and linkedSocietyId
AssitPolicySchema.pre("save", async function (next) {
  if (this.hasLinkedEasipolPolicy) {
    this.linkedEasipolPolicyId = await PolicyModel.findOne({ policyNumber: this.membershipID });
  }
  if (this.hasLinkedSociety) {
    this.linkedSocietyId = await SchemeSocietyModel.findOne({ societyId: this.membershipID });
  }
  next();
});

// Export the model
export const AssitPolicyModel =
  mongoose.models["assit_policies"] ||
  mongoose.model<IAssitPolicy>("assit_policies", AssitPolicySchema);
