import { NextRequest, NextResponse } from "next/server";

import { getUserFromRequest } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import { createSystemNotification, getDiscordWebhookUrl, sendDiscordNotification } from "@/lib/discord";

import { EAllocationRequestStatus } from "@/app/enums/hr/allocation-request-status.enum";
import { AllocationRequestModel } from "@/app/models/hr/allocation-request.schema";

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const userRoles = [user.role, ...(user.roles || [])].filter(Boolean) as string[];
    const allowedRoles: string[] = ["admin", "easypay_reviewer", "easypay_allocator"];
    const hasAccess = userRoles.some((r) => allowedRoles.includes(r));
    if (!hasAccess) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    await connectToDatabase();

    const body = await request.json();
    const ids: string[] = body?.ids || [];
    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ message: "No request ids provided" }, { status: 400 });
    }

    // Only transition APPROVED -> SUBMITTED
    const res = await AllocationRequestModel.updateMany(
      { _id: { $in: ids }, status: EAllocationRequestStatus.APPROVED },
      { $set: { status: EAllocationRequestStatus.SUBMITTED, submittedBy: user._id, submittedAt: new Date() } }
    );

    // Send Discord notification (best-effort)
    const webhookUrl = getDiscordWebhookUrl();
    if (webhookUrl) {
      const payload = createSystemNotification(
        "Easypay Allocation Requests Submitted",
        `${ids.length} request(s) have been submitted for allocation by ${user.name || user.email}.\ncc: @wendza`,
        "info"
      );
      // Add allowed mention if env has ID
      const wendzaId = process.env.DISCORD_WENDZA_USER_ID;
      if (wendzaId) {
        (payload as any).allowed_mentions = { users: [wendzaId] };
        (payload as any).content = `<@${wendzaId}>`;
      } else {
        (payload as any).content = "@wendza";
      }
      await sendDiscordNotification(webhookUrl, payload, "easypay-allocation-submit");
    }

    return NextResponse.json({
      updated: res.modifiedCount,
      matched: res.matchedCount,
    });
  } catch (error) {
    console.error("Error submitting allocation requests:", (error as Error).message);
    return NextResponse.json(
      { message: "Internal Server Error ~ submit allocation requests" },
      { status: 500 }
    );
  }
}


