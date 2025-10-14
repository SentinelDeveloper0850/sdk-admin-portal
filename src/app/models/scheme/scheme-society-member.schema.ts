import mongoose, { Document, Schema } from "mongoose";

export interface ISocietyMember extends Document {
  societyId: mongoose.Types.ObjectId;
  firstNames: string;
  initials: string;
  lastName: string;
  idNumber: string;
  premium: number;
  cellNumber: string;
  emailAddress: string;
  address: string;
}

const SocietyMemberSchema: Schema = new Schema(
  {
    societyId: { type: Schema.Types.ObjectId, ref: "SchemeSociety", required: true },
    firstNames: { type: String, required: true },
    initials: { type: String, required: true },
    lastName: { type: String, required: true },
    idNumber: { type: String, required: true },
    premium: { type: Number, required: true },
    cellNumber: { type: String, required: true },
    emailAddress: { type: String, required: true },
    address: { type: String, required: true },
  },
  {
    timestamps: true,
  }
);

// Export the model
export const SocietyMemberModel =
  mongoose.models["society-members"] ||
  mongoose.model<ISocietyMember>("society-members", SocietyMemberSchema);
