import { Types } from "mongoose";
import { NextRequest, NextResponse } from "next/server";

import {
  KnowledgeArticleCategory,
  KnowledgeArticleModel,
  KnowledgeArticleStatus,
} from "@/app/models/system/knowledge-article.schema";
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
  const user = await getUserFromRequest(req);

  if (!user || !(user as any)._id) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const q = url.searchParams.get("q");
  const category = url.searchParams.get("category");
  const status = url.searchParams.get("status");
  const take = Math.min(Number(url.searchParams.get("take") ?? 20), 100);
  const cursor = url.searchParams.get("cursor");

  const isAdmin = (user as any).role === "admin";

  const where: any = {};
  if (!isAdmin) {
    where.status = KnowledgeArticleStatus.PUBLISHED;
  } else if (status) {
    where.status = status;
  }

  if (category) where.category = category;
  if (q) where.$text = { $search: q };
  if (cursor) where._id = { $lt: new Types.ObjectId(cursor) };

  const items = await KnowledgeArticleModel.find(where)
    .sort({ publishedAt: -1, _id: -1 })
    .limit(take + 1)
    .lean();

  const nextCursor = items.length > take ? String(items[take]._id) : undefined;

  return NextResponse.json({
    items: items.slice(0, take).map(({ _id, ...doc }) => ({ id: String(_id), ...doc })),
    nextCursor,
    categories: Object.values(KnowledgeArticleCategory),
  });
}

export async function POST(req: NextRequest) {
  await connectToDatabase();
  const user = await getUserFromRequest(req);

  if (!user || !(user as any)._id) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }
  if ((user as any).role !== "admin") {
    return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { title, summary, bodyMd, bodyHtml, bodyJson, category, tags } = body ?? {};

  if (!title || !bodyMd || !category) {
    return NextResponse.json({ success: false, message: "Missing required fields" }, { status: 400 });
  }

  const slug = body.slug ? String(body.slug) : slugify(String(title));
  const now = new Date();

  const doc = await KnowledgeArticleModel.create({
    title,
    slug,
    summary: typeof summary === "string" ? summary : undefined,
    bodyMd,
    bodyHtml: typeof bodyHtml === "string" ? bodyHtml : undefined,
    bodyJson,
    category,
    tags: Array.isArray(tags) ? tags : [],
    status: KnowledgeArticleStatus.DRAFT,
    authorId: (user as any)._id,
    createdAt: now,
    updatedAt: now,
  });

  return NextResponse.json({ id: String(doc._id), slug: doc.slug }, { status: 201 });
}

