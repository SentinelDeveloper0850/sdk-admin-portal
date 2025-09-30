import { Types } from "mongoose";
import { NextRequest, NextResponse } from "next/server";

import { AnnouncementModel, AnnouncementReadModel } from "@/app/models/system/announcement.schema";
import { getUserFromRequest } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  await connectToDatabase();
  const user = await getUserFromRequest(req);

  if (!user || !user._id) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  const idOrSlug = params.id;
  const isObjectId = Types.ObjectId.isValid(idOrSlug);
  const isAdmin = (user as any).role === "admin";

  // ObjectId requests: return raw document for admin edit flows, no view increment
  if (isObjectId) {
    const ann = await AnnouncementModel.findById(idOrSlug).lean();
    if (!ann) return NextResponse.json({ success: false, message: "Not found" }, { status: 404 });
    const { _id, ...doc } = ann as any;
    return NextResponse.json({ id: String(_id), ...doc });
  }

  // Slug requests: public detail semantics (admins can view drafts; non-admins only published + increment views)
  const query: any = { slug: idOrSlug };
  if (!isAdmin) query.status = "PUBLISHED";

  let ann = await AnnouncementModel.findOne(query).lean();
  if (!ann) return NextResponse.json({ success: false, message: "Not found" }, { status: 404 });

  if (!isAdmin) {
    await AnnouncementModel.updateOne({ _id: ann._id }, { $inc: { viewCount: 1 } });
    ann.viewCount = (ann.viewCount ?? 0) + 1;
  }

  const hasRead = !!(await AnnouncementReadModel.exists({ announcementId: ann._id, userId: user._id }));
  const { _id, ...doc } = ann as any;
  return NextResponse.json({ id: String(_id), ...doc, hasRead });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  await connectToDatabase();
  const user = await getUserFromRequest(req);

  if (!user || !user._id) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  if (user.role !== "admin") {
    return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const updatableFields = [
    "title",
    "slug",
    "bodyMd",
    "category",
    "tags",
    "isPinned",
    "requiresAck",
    "version",
    "publishAt",
    "pushDiscord",
    "pushWhatsapp",
    "pushEmail",
  ];
  const update: Record<string, unknown> = {};
  for (const key of updatableFields) {
    if (key in body) update[key] = body[key];
  }

  const updated = await AnnouncementModel.findByIdAndUpdate(params.id, update, { new: true });
  if (!updated) return NextResponse.json({ success: false, message: "Not found" }, { status: 404 });

  return NextResponse.json({ id: String(updated._id) });
}


