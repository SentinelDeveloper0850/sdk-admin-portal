import mongoose, { Schema } from "mongoose";

const NotificationSchema = new Schema(
    {
        recipientUserId: {
            type: String,
            required: true
        },

        type: { type: String, required: true },
        title: { type: String, required: true },
        message: { type: String, required: true },
        link: { type: String },

        severity: {
            type: String,
            enum: ["INFO", "SUCCESS", "WARNING", "ERROR"],
            default: "INFO",
        },

        data: { type: Schema.Types.Mixed },
        readAt: { type: Date },
    },
    { timestamps: { createdAt: true, updatedAt: true } }
);

export const NotificationModel =
    mongoose.models.notifications ||
    mongoose.model("notifications", NotificationSchema, "notifications");