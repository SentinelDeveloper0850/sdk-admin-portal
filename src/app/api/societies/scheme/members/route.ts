import { NextResponse } from "next/server";

import { connectToDatabase } from "@/lib/db";
import { SchemeSocietyModel } from "@/app/models/scheme/scheme-society.schema";
import { SocietyMemberModel } from "@/app/models/scheme/scheme-society-member.schema";

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const { societyId, ...memberDetails } = payload;

    if (!societyId) {
      return NextResponse.json({ message: "Society ID is required" }, { status: 400 });
    }

    if (!memberDetails.firstNames || !memberDetails.initials || !memberDetails.lastName || !memberDetails.idNumber) {
      return NextResponse.json({ message: "Member details are required" }, { status: 400 });
    }

    await connectToDatabase();

    const society = await SchemeSocietyModel.findById(societyId);
    if (!society) {
      return NextResponse.json({ message: "Society not found" }, { status: 404 });
    }
    const member = await SocietyMemberModel.create({ ...memberDetails, societyId: society._id });

    society.numberOfMembers = society.numberOfMembers + 1;
    await society.save();

    return NextResponse.json({ success: true, message: "Society member created successfully", member }, { status: 200 });
  } catch (error: any) {
    console.error("Error creating society member:", error.message);
    return NextResponse.json({ success: false, message: "Internal Server Error ~ Error creating society member" }, { status: 500 });
  }
}