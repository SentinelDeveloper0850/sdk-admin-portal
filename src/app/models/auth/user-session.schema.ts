// user-session.schema.ts
import crypto from "crypto";
import mongoose, { Document, Model, Schema, Types } from "mongoose";

export interface IUserSession extends Document {
    userId: Types.ObjectId;
    tokenHash: string;
    platform: "WEB" | "STAFF_APP";
    mode: "ONSITE" | "REMOTE";
    baseContext?: {
        regionId?: Types.ObjectId;
        branchId?: Types.ObjectId;
    } | null;
    activeContext?: {
        regionId?: Types.ObjectId;
        branchId?: Types.ObjectId;
    } | null;
    lastSeenAt: Date;
    expiresAt: Date;
    revokedAt?: Date | null;
    revokeReason?: string | null;
}

interface IUserSessionModel extends Model<IUserSession> {
    hashToken(raw: string): string;
}

const UserSessionSchema = new Schema<IUserSession>(
    {
        userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
        tokenHash: { type: String, required: true, unique: true, index: true },
        platform: { type: String, enum: ["WEB", "STAFF_APP"], default: "WEB" },
        mode: { type: String, enum: ["ONSITE", "REMOTE"], default: "ONSITE" },

        baseContext: {
            regionId: { type: Schema.Types.ObjectId, ref: "Region", default: null },
            branchId: { type: Schema.Types.ObjectId, ref: "Branch", default: null },
        },

        activeContext: {
            regionId: { type: Schema.Types.ObjectId, ref: "Region", default: null },
            branchId: { type: Schema.Types.ObjectId, ref: "Branch", default: null },
        },

        lastSeenAt: { type: Date, default: Date.now },
        expiresAt: { type: Date, required: true, index: true },

        revokedAt: { type: Date, default: null },
        revokeReason: { type: String, default: null },
    },
    { timestamps: true }
);

// ✅ Properly typed static
UserSessionSchema.statics.hashToken = function (raw: string): string {
    return crypto.createHash("sha256").update(raw).digest("hex");
};

const UserSessionModel =
    (mongoose.models.UserSession as IUserSessionModel) ||
    mongoose.model<IUserSession, IUserSessionModel>(
        "UserSession",
        UserSessionSchema
    );

export default UserSessionModel;
