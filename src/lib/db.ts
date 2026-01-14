import mongoose, { ConnectionStates } from "mongoose";

import { AnnouncementModel } from "@/app/models/system/announcement.schema";
import { KnowledgeArticleModel } from "@/app/models/system/knowledge-article.schema";

const connectionString =
  process.env.MONGODB_ATLAS_URI;

let cachedConnection: typeof mongoose | null = null;
let ensuredIndexes = false;

async function ensureSearchIndexesOnce() {
  if (ensuredIndexes) return;
  ensuredIndexes = true;

  // Fix legacy invalid compound text indexes:
  // `{ title: "text", bodyMd: "text", tags: 1 }` breaks inserts because `tags` is an array (multikey)
  // and MongoDB doesn't allow multikey fields as non-text keys in a compound text index.
  const fixCollection = async (
    collection: mongoose.Collection,
    desiredTextKey: Record<string, "text">,
    desiredTextName: string
  ) => {
    try {
      const indexes = await collection.indexes();
      const bad = indexes.find((idx: any) => {
        const key = idx?.key ?? {};
        const hasText = key?._fts === "text" || key?._fts === "text";
        // legacy index included tags: 1 as the extra key alongside text.
        return hasText && key?.tags === 1;
      });

      if (bad?.name) {
        await collection.dropIndex(bad.name);
      }

      const hasDesiredText = indexes.some((idx: any) => idx?.name === desiredTextName);
      if (!hasDesiredText) {
        await collection.createIndex(desiredTextKey, { name: desiredTextName });
      }

      // ensure a separate tags index exists (fast filtering)
      const hasTags = indexes.some((idx: any) => idx?.key?.tags === 1 && idx?.name !== bad?.name);
      if (!hasTags) {
        await collection.createIndex({ tags: 1 }, { name: "tags_1" });
      }
    } catch (err) {
      // Don't fail requests if index management isn't permitted in this environment.
      console.warn("🧭 ~ Index ensure failed (non-fatal):", err);
    }
  };

  await fixCollection(
    KnowledgeArticleModel.collection,
    { title: "text", bodyMd: "text", tags: "text" },
    "knowledge_text_search"
  );
  await fixCollection(
    AnnouncementModel.collection,
    { title: "text", bodyMd: "text", tags: "text" },
    "announcement_text_search"
  );
}

export async function connectToDatabase() {
  if (!connectionString) {
    throw new Error("Please define MONGODB_ATLAS_URI in the environment variables.");
  }

  if (mongoose.connection.readyState != ConnectionStates.connected) {
    try {
      if (cachedConnection) {
        console.log("🧭 ~ Using cached database connection");
        return cachedConnection;
      }

      if (connectionString) {
        const connection = await mongoose.connect(connectionString);
        console.log("🧭 ~ Connected to database");
        cachedConnection = connection;
        await ensureSearchIndexesOnce();
      } else {
        throw new Error(
          "🧭 ~ Please define MONGODB_ATLAS_URI environment variable inside .env"
        );
      }

      return cachedConnection;
    } catch (error) {
      console.log("🧭 ~ Error connecting to database: ", error);
      throw error;
    }
  }

  // already connected
  if (cachedConnection) {
    await ensureSearchIndexesOnce();
    return cachedConnection;
  }

  return mongoose;
}
