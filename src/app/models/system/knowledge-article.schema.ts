import mongoose, { Schema, Types, model } from "mongoose";

export enum KnowledgeArticleStatus {
  DRAFT = "DRAFT",
  PUBLISHED = "PUBLISHED",
  UNPUBLISHED = "UNPUBLISHED",
}

export enum KnowledgeArticleCategory {
  CODE_OF_CONDUCT = "CODE_OF_CONDUCT",
  SOP = "SOP",
  HOW_TO = "HOW_TO",
  POLICY = "POLICY",
  TRAINING = "TRAINING",
  GENERAL = "GENERAL",
}

const KnowledgeArticleSchema = new Schema(
  {
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true, index: true },
    summary: { type: String },

    bodyMd: { type: String, required: true },
    bodyHtml: { type: String },
    // Editor.js raw output data (optional)
    bodyJson: { type: Schema.Types.Mixed },

    status: {
      type: String,
      enum: Object.values(KnowledgeArticleStatus),
      default: KnowledgeArticleStatus.DRAFT,
      index: true,
    },
    category: {
      type: String,
      enum: Object.values(KnowledgeArticleCategory),
      required: true,
      index: true,
    },
    tags: { type: [String], default: [] },

    viewCount: { type: Number, default: 0 },
    publishedAt: { type: Date },

    authorId: { type: Types.ObjectId, ref: "users", required: true, index: true },
  },
  { timestamps: true, collection: "knowledge_articles" }
);

// NOTE: MongoDB compound text indexes cannot include a multikey (array) field as a non-text key.
// `tags` is an array, so it must be part of the text keys (or indexed separately).
KnowledgeArticleSchema.index({ title: "text", bodyMd: "text", tags: "text" });
KnowledgeArticleSchema.index({ tags: 1 });
KnowledgeArticleSchema.index({ status: 1, publishedAt: -1, _id: -1 });
KnowledgeArticleSchema.index({ category: 1, publishedAt: -1, _id: -1 });

export interface IKnowledgeArticle extends mongoose.Document {
  title: string;
  slug: string;
  summary?: string;
  bodyMd: string;
  bodyHtml?: string;
  bodyJson?: unknown;
  status: KnowledgeArticleStatus;
  category: KnowledgeArticleCategory;
  tags: string[];
  viewCount: number;
  publishedAt?: Date;
  authorId: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export const KnowledgeArticleModel =
  mongoose.models.knowledge_articles ||
  model<IKnowledgeArticle>("knowledge_articles", KnowledgeArticleSchema, "knowledge_articles");

