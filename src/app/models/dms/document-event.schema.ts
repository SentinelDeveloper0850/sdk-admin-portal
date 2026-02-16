import { Schema, model, models } from "mongoose";

const DmsDocumentEventSchema = new Schema(
    {
        documentId: { type: Schema.Types.ObjectId, ref: "DmsDocument", required: true, index: true },
        userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
        regionId: { type: Schema.Types.ObjectId, ref: "Region", default: null, index: true },
        eventType: { type: String, enum: ["PRINT"], required: true, index: true },

        // optional metadata
        userAgent: { type: String, default: "" },
    },
    { timestamps: true }
);

DmsDocumentEventSchema.index({ documentId: 1, eventType: 1, createdAt: -1 });

export const DmsDocumentEventModel =
    models.DmsDocumentEvent || model("DmsDocumentEvent", DmsDocumentEventSchema);
