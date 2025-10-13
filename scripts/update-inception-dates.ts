// scripts/update-inception-dates.ts
import "dotenv/config";
import mongoose from "mongoose";
import { PolicyModel } from "../src/app/models/scheme/policy.schema";

const MONGO_URI = process.env.MONGO_URI || "mongodb://169.1.24.233:8001/sdk-admin-portal";
const BATCH_SIZE = Number(process.env.BATCH_SIZE || 500);

function isValidDate(value: Date) {
  return value instanceof Date && !isNaN(value.getTime());
}

async function updateInceptionDates() {
  await mongoose.connect(MONGO_URI);
  console.log("🔗 Connected to MongoDB");

  // Target only documents where inceptionDate is stored as a string
  // and where inceptionDateString is missing or empty.
  const filter = {
    $and: [
      { inceptionDate: { $type: "string" } },
      {
        $or: [
          { inceptionDateString: { $exists: false } },
          { inceptionDateString: null },
          { inceptionDateString: "" },
        ],
      },
    ],
  };

  const totalToProcess = await PolicyModel.countDocuments(filter);
  if (totalToProcess === 0) {
    console.log("✅ No policies to update.");
    await mongoose.disconnect();
    return;
  }

  console.log(`🔎 Found ${totalToProcess} policies to update`);

  let processed = 0;
  let updated = 0;
  let skipped = 0;

  const cursor = PolicyModel.find(filter)
    .select({ policyNumber: 1, inceptionDate: 1, inceptionDateString: 1 })
    .lean()
    .cursor();

  let bulkOps: mongoose.AnyBulkWriteOperation[] = [];

  for await (const doc of cursor) {
    processed += 1;

    const originalValue = (doc as any).inceptionDate as unknown as string | null | undefined;
    const stringValue = (originalValue ?? "").toString().trim();

    if (!stringValue) {
      skipped += 1;
      continue;
    }

    const parsed = new Date(stringValue);
    const updateSet: Record<string, unknown> = {
      inceptionDateString: stringValue,
    };

    if (isValidDate(parsed)) {
      updateSet.inceptionDate = parsed;
    } else {
      // If parsing fails, keep the original string in inceptionDateString and skip changing inceptionDate
      skipped += 1;
    }

    bulkOps.push({
      updateOne: {
        filter: { _id: (doc as any)._id },
        update: { $set: updateSet },
      },
    });

    if (bulkOps.length >= BATCH_SIZE) {
      const res = await PolicyModel.bulkWrite(bulkOps, { ordered: false });
      updated += (res.modifiedCount || 0) + (res.upsertedCount || 0);
      bulkOps = [];
      console.log(`➡️  Progress: ${processed}/${totalToProcess} processed, ${updated} updated, ${skipped} skipped`);
    }
  }

  if (bulkOps.length > 0) {
    const res = await PolicyModel.bulkWrite(bulkOps, { ordered: false });
    updated += (res.modifiedCount || 0) + (res.upsertedCount || 0);
  }

  console.log(`🎉 Complete. Processed: ${processed}, Updated: ${updated}, Skipped: ${skipped}`);
  await mongoose.disconnect();
}

updateInceptionDates().catch((err) => {
  console.error("❌ Update inception dates failed:", err);
  process.exit(1);
});
