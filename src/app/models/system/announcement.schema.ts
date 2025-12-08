import mongoose, { Schema, Types, model } from "mongoose";

export enum AnnouncementStatus {
  DRAFT = "DRAFT",
  SCHEDULED = "SCHEDULED",
  PUBLISHED = "PUBLISHED",
  UNPUBLISHED = "UNPUBLISHED",
}

export enum AnnouncementCategory {
  SYSTEM_UPDATE = "SYSTEM_UPDATE",
  POLICY_CHANGE = "POLICY_CHANGE",
  TRAINING = "TRAINING",
  ALERT = "ALERT",
  RELEASE = "RELEASE",
}

const AttachmentSchema = new Schema(
  {
    label: { type: String, required: true },
    url: { type: String, required: true },
    contentType: String,
    sizeBytes: Number,
  },
  { _id: true, timestamps: { createdAt: true, updatedAt: false } }
);

const AnnouncementSchema = new Schema(
  {
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true, index: true },
    bodyMd: { type: String, required: true },
    bodyHtml: String,
    status: {
      type: String,
      enum: Object.values(AnnouncementStatus),
      default: AnnouncementStatus.DRAFT,
      index: true,
    },
    isPinned: { type: Boolean, default: false, index: true },
    requiresAck: { type: Boolean, default: false },
    tags: { type: [String], default: [] },
    category: {
      type: String,
      enum: Object.values(AnnouncementCategory),
      required: true,
      index: true,
    },
    version: String,
    publishAt: Date,
    publishedAt: Date,
    unpublishAt: Date,

    branchId: { type: String, index: true },

    pushDiscord: { type: Boolean, default: false },
    pushWhatsapp: { type: Boolean, default: false },
    pushEmail: { type: Boolean, default: false },

    viewCount: { type: Number, default: 0 },

    authorId: { type: Types.ObjectId, ref: "users", required: true, index: true },
    attachments: { type: [AttachmentSchema], default: [] },
  },
  { timestamps: true, collection: "announcements" }
);

AnnouncementSchema.index({ title: "text", bodyMd: "text", tags: 1 });
AnnouncementSchema.index({ isPinned: -1, publishedAt: -1 });
AnnouncementSchema.index({ category: 1, publishedAt: -1 });

const AnnouncementReadSchema = new Schema(
  {
    announcementId: { type: Types.ObjectId, ref: "announcements", required: true, index: true },
    userId: { type: Types.ObjectId, ref: "users", required: true, index: true },
    readAt: { type: Date, default: Date.now },
  },
  { timestamps: false, collection: "announcement_reads" }
);
AnnouncementReadSchema.index({ announcementId: 1, userId: 1 }, { unique: true });

const AnnouncementAckSchema = new Schema(
  {
    announcementId: { type: Types.ObjectId, ref: "announcements", required: true, index: true },
    userId: { type: Types.ObjectId, ref: "users", required: true, index: true },
    ackAt: { type: Date, default: Date.now },
    method: String, // web, mobile, api
  },
  { timestamps: false, collection: "announcement_acks" }
);
AnnouncementAckSchema.index({ announcementId: 1, userId: 1 }, { unique: true });

export interface IAnnouncement extends mongoose.Document {
  title: string;
  slug: string;
  bodyMd: string;
  bodyHtml?: string;
  status: AnnouncementStatus;
  isPinned: boolean;
  requiresAck: boolean;
  tags: string[];
  category: AnnouncementCategory;
  version?: string;
  publishAt?: Date;
  publishedAt?: Date;
  unpublishAt?: Date;
  branchId?: string;
  pushDiscord: boolean;
  pushWhatsapp: boolean;
  pushEmail: boolean;
  viewCount: number;
  authorId: Types.ObjectId;
  attachments: Array<{ label: string; url: string; contentType?: string; sizeBytes?: number }>;
}

export interface IAnnouncementRead extends mongoose.Document {
  announcementId: Types.ObjectId;
  userId: Types.ObjectId;
  readAt: Date;
}

export interface IAnnouncementAck extends mongoose.Document {
  announcementId: Types.ObjectId;
  userId: Types.ObjectId;
  ackAt: Date;
  method?: string;
}

export const AnnouncementModel =
  mongoose.models.announcements ||
  model<IAnnouncement>("announcements", AnnouncementSchema, "announcements");

export const AnnouncementReadModel =
  mongoose.models.announcement_reads ||
  model<IAnnouncementRead>("announcement_reads", AnnouncementReadSchema, "announcement_reads");

export const AnnouncementAckModel =
  mongoose.models.announcement_acks ||
  model<IAnnouncementAck>("announcement_acks", AnnouncementAckSchema, "announcement_acks");


