import { NextRequest, NextResponse } from "next/server";

import { EAllocationRequestStatus } from "@/app/enums/hr/allocation-request-status.enum";
import { AllocationRequestModel } from "@/app/models/hr/allocation-request.schema";
import { getUserFromRequest } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import {
  createSystemNotification,
  getDiscordWebhookUrl,
  sendDiscordNotification,
} from "@/lib/discord";

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const userRoles = [user.role, ...(user.roles || [])].filter(
      Boolean
    ) as string[];
    const allowedRoles: string[] = ["admin", "eft_allocator"]; // Allocators only (and admin)
    const hasAccess = userRoles.some((r) => allowedRoles.includes(r));
    if (!hasAccess) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    await connectToDatabase();

    const body = await request.json();
    const ids: string[] = body?.ids || [];
    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { message: "No request ids provided" },
        { status: 400 }
      );
    }

    // Only transition SUBMITTED -> DUPLICATE and stamp by/at
    const res = await AllocationRequestModel.updateMany(
      { _id: { $in: ids }, status: EAllocationRequestStatus.SUBMITTED },
      {
        $set: {
          status: EAllocationRequestStatus.DUPLICATE,
          markedAsDuplicateBy: user._id,
          markedAsDuplicateAt: new Date(),
        },
      }
    );

    // Send Discord notification (best-effort)
    const webhookUrl = getDiscordWebhookUrl();
    if (webhookUrl) {
      const payload = createSystemNotification(
        "EFT Allocation Requests Marked as Duplicates",
        `${res.modifiedCount} request(s) have been marked as duplicates by ${user.name || user.email}.\ncc: @wethusdk`,
        "warning"
      );
      const wethuId = process.env.DISCORD_WETHU_USER_ID;
      if (wethuId) {
        (payload as any).allowed_mentions = { users: [wethuId] };
        (payload as any).content = `<@${wethuId}>`;
      } else {
        (payload as any).content = "@wethusdk";
      }
      await sendDiscordNotification(
        webhookUrl,
        payload,
        "eft-allocation-duplicates"
      );
    }

    return NextResponse.json({
      updated: res.modifiedCount,
      matched: res.matchedCount,
    });
  } catch (error) {
    console.error(
      "Error marking requests as duplicates:",
      (error as Error).message
    );
    return NextResponse.json(
      { message: "Internal Server Error ~ mark duplicates" },
      { status: 500 }
    );
  }
}
