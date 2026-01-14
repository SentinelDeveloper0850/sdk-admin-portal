import { Types } from "mongoose";
import { NextRequest, NextResponse } from "next/server";

import { KnowledgeArticleModel } from "@/app/models/system/knowledge-article.schema";
import { getUserFromRequest } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await connectToDatabase();
  const user = await getUserFromRequest(req);

  if (!user || !(user as any)._id) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const idOrSlug = id;
  const isObjectId = Types.ObjectId.isValid(idOrSlug);
  const isAdmin = (user as any).role === "admin";

  // ObjectId requests are reserved for admin edit flows
  if (isObjectId) {
    if (!isAdmin) {
      return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
    }
    const doc = await KnowledgeArticleModel.findById(idOrSlug).lean();
    if (!doc) return NextResponse.json({ success: false, message: "Not found" }, { status: 404 });
    const { _id, ...rest } = doc as any;
    return NextResponse.json({ id: String(_id), ...rest });
  }

  // Slug requests: readers only see published; admins can see anything
  const query: any = { slug: idOrSlug };
  if (!isAdmin) query.status = "PUBLISHED";

  let doc = await KnowledgeArticleModel.findOne(query).lean();
  if (!doc) return NextResponse.json({ success: false, message: "Not found" }, { status: 404 });

  if (!isAdmin) {
    await KnowledgeArticleModel.updateOne({ _id: doc._id }, { $inc: { viewCount: 1 } });
    (doc as any).viewCount = ((doc as any).viewCount ?? 0) + 1;
  }

  const { _id, ...rest } = doc as any;
  return NextResponse.json({ id: String(_id), ...rest });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await connectToDatabase();
  const user = await getUserFromRequest(req);

  if (!user || !(user as any)._id) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }
  if ((user as any).role !== "admin") {
    return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();

  const updatableFields = ["title", "slug", "summary", "bodyMd", "bodyHtml", "bodyJson", "category", "tags"];
  const update: Record<string, unknown> = {};
  for (const key of updatableFields) {
    if (key in body) update[key] = body[key];
  }

  const updated = await KnowledgeArticleModel.findByIdAndUpdate(id, update, { new: true });
  if (!updated) return NextResponse.json({ success: false, message: "Not found" }, { status: 404 });

  return NextResponse.json({ id: String(updated._id) });
}

