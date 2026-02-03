import { DutyRosterModel } from "@/app/models/hr/duty-roster.schema";
import { UserModel } from "@/app/models/hr/user.schema";
import { StaffMemberModel } from "@/app/models/staff-member.schema";

export type ComplianceExpectedSource = "duty_roster" | "all_active_users";

export async function getExpectedUsersFromDutyRoster(params: {
  dayStart: Date;
  dayEndExclusive: Date;
}) {
  const { dayStart, dayEndExclusive } = params;

  const roster = await DutyRosterModel.findOne({
    date: { $gte: dayStart, $lt: dayEndExclusive },
  }).lean();
  const staffIds = Array.isArray((roster as any)?.staffMemberIds)
    ? (roster as any).staffMemberIds
    : [];

  // If roster exists but empty, that means "nobody expected"
  if (roster && staffIds.length === 0) {
    return {
      expectedUsers: [] as any[],
      expectedSource: "duty_roster" as const,
    };
  }

  if (roster && staffIds.length > 0) {
    const staff = await StaffMemberModel.find({ _id: { $in: staffIds } })
      .select({ _id: 1, userId: 1 })
      .lean();

    const userIds = staff
      .map((s: any) => String(s.userId || ""))
      .filter(Boolean);
    if (userIds.length === 0) {
      return {
        expectedUsers: [] as any[],
        expectedSource: "duty_roster" as const,
      };
    }

    const expectedUsers = await UserModel.find({
      _id: { $in: userIds },
      status: "Active",
      deletedAt: { $exists: false },
      role: { $nin: ["admin", "super_admin"] },
    })
      .select("_id name email avatarUrl status roles role")
      .lean();

    return { expectedUsers, expectedSource: "duty_roster" as const };
  }

  // No roster -> caller can fall back to "all active users"
  return {
    expectedUsers: null as any[] | null,
    expectedSource: "all_active_users" as const,
  };
}
