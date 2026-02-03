import { NextRequest, NextResponse } from "next/server";

import {
  KnowledgeArticleModel,
  KnowledgeArticleStatus,
} from "@/app/models/system/knowledge-article.schema";
import { getUserFromRequest } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await connectToDatabase();
  const user = await getUserFromRequest(req);

  if (!user || !(user as any)._id) {
    return NextResponse.json(
      { success: false, message: "Unauthorized" },
      { status: 401 }
    );
  }
  if ((user as any).role !== "admin") {
    return NextResponse.json(
      { success: false, message: "Forbidden" },
      { status: 403 }
    );
  }

  const { id } = await params;
  const now = new Date();
  const updated = await KnowledgeArticleModel.findByIdAndUpdate(
    id,
    { status: KnowledgeArticleStatus.PUBLISHED, publishedAt: now },
    { new: true }
  );
  if (!updated)
    return NextResponse.json(
      { success: false, message: "Not found" },
      { status: 404 }
    );

  return NextResponse.json({
    id: String(updated._id),
    publishedAt: updated.publishedAt,
  });
}
