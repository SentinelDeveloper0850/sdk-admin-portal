import { NextRequest, NextResponse } from "next/server";

import { Types } from "mongoose";

import { AnnouncementModel } from "@/app/models/system/announcement.schema";
import { getUserFromRequest } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export async function GET(req: NextRequest) {
  await connectToDatabase();

  const url = new URL(req.url);
  const q = url.searchParams.get("q");
  const category = url.searchParams.get("category");
  const pinned = url.searchParams.get("pinned");
  const take = Math.min(Number(url.searchParams.get("take") ?? 20), 100);
  const cursor = url.searchParams.get("cursor");

  const where: any = { status: "PUBLISHED" };
  if (category) where.category = category;
  if (pinned !== null) where.isPinned = pinned === "1" || pinned === "true";
  if (q) where.$text = { $search: q };
  if (cursor) where._id = { $lt: new Types.ObjectId(cursor) };

  const items = await AnnouncementModel.find(where)
    .sort({ isPinned: -1, publishedAt: -1, _id: -1 })
    .limit(take + 1)
    .lean();

  const nextCursor = items.length > take ? String(items[take]._id) : undefined;
  return NextResponse.json({
    items: items
      .slice(0, take)
      .map(({ _id, ...doc }) => ({ id: String(_id), ...doc })),
    nextCursor,
  });
}

export async function POST(req: NextRequest) {
  await connectToDatabase();
  const user = await getUserFromRequest(req);

  if (!user || !user._id) {
    return NextResponse.json(
      { success: false, message: "Unauthorized" },
      { status: 401 }
    );
  }

  const body = await req.json();
  const {
    title,
    bodyMd,
    bodyHtml,
    category,
    tags,
    isPinned,
    requiresAck,
    version,
    publishAt,
    pushDiscord,
    pushWhatsapp,
    pushEmail,
  } = body ?? {};

  if (!title || !bodyMd || !category) {
    return NextResponse.json(
      { success: false, message: "Missing required fields" },
      { status: 400 }
    );
  }

  const slug = body.slug ? String(body.slug) : slugify(String(title));

  const now = new Date();
  const doc = await AnnouncementModel.create({
    title,
    slug,
    bodyMd,
    category,
    bodyHtml: typeof bodyHtml === "string" ? bodyHtml : undefined,
    tags: Array.isArray(tags) ? tags : [],
    isPinned: !!isPinned,
    requiresAck: !!requiresAck,
    version: version ?? undefined,
    publishAt: publishAt ? new Date(publishAt) : undefined,
    authorId: user._id,
    pushDiscord: !!pushDiscord,
    pushWhatsapp: !!pushWhatsapp,
    pushEmail: !!pushEmail,
    status: "DRAFT",
    createdAt: now,
    updatedAt: now,
  });

  return NextResponse.json(
    { id: String(doc._id), slug: doc.slug },
    { status: 201 }
  );
}
