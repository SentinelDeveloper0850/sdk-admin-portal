import { NextRequest, NextResponse } from "next/server";

import { UserModel } from "@/app/models/hr/user.schema";
import { connectToDatabase } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();
    
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    
    let users;
    
    if (type === 'consultants') {
      // Get consultants for assignment
      users = await UserModel.find({
        roles: { $in: ["scheme_consultant", "scheme_consultant_online", "society_consultant"] },
        status: "Active"
      }).select('_id name email');
    } else if (type === 'escalation') {
      // Get users for escalation
      users = await UserModel.find({
        roles: { $in: ["admin", "hr_manager", "scheme_consultant", "scheme_consultant_online"] },
        status: "Active"
      }).select('_id name email roles');
    } else {
      return NextResponse.json(
        { success: false, error: "Invalid type parameter" },
        { status: 400 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: users
    });
  } catch (error: any) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}