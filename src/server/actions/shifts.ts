import { ShiftModel as Model } from "@/app/models/hr/shift.schema";
import { IUser } from "@/app/models/hr/user.schema";
import { connectToDatabase } from "@/lib/db";

interface CalendarShift {
  id: string;
  weekendStart: string;
  saturday: { _id: string; name: string }[];
  sunday: { _id: string; name: string }[];
  groupNote?: string;
}

export const getAllShiftsForCalendar = async () => {
  try {
    await connectToDatabase();

    const shifts = await Model.find().populate("saturday sunday", "name");

    return shifts.map((shift) => ({
      id: shift._id!.toString(),
      weekendStart: shift.weekendStart.toISOString(),
      saturday: (shift.saturday as unknown as IUser[]).map((u) => ({
        _id: String(u._id),
        name: u.name,
      })),
      sunday: (shift.sunday as unknown as IUser[]).map((u) => ({
        _id: String(u._id),
        name: u.name,
      })),
      groupNote: shift.groupNote,
    }));
  } catch (error: any) {
    console.error("Error fetching shifts:", error.message);
    return {
      success: false,
      message: "Internal Server Error ~ Error fetching shifts",
    };
  }
};
