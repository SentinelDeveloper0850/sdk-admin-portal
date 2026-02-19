// src/app/models/ams/counter.schema.ts
import { Schema, model, models } from "mongoose";

export interface ICounter {
    key: string;      // "assetTag"
    seq: number;      // increments
    updatedAt: Date;
}

const CounterSchema = new Schema<ICounter>(
    {
        key: { type: String, required: true, unique: true },
        seq: { type: Number, required: true, default: 0 },
    },
    { timestamps: true }
);

export const CounterModel =
    models.Counter || model<ICounter>("Counter", CounterSchema);
