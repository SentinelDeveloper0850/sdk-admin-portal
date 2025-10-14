import { NextResponse } from "next/server";

import { fetchAllSocieties } from "@/server/actions/societies/scheme";
import { SchemeSocietyModel } from "@/app/models/scheme/scheme-society.schema";
import { connectToDatabase } from "@/lib/db";
import { createAuditLog } from "@/server/actions/audit";

export async function GET() {
  try {
    const response = await fetchAllSocieties();

    if (response?.data?.societies) {
      const { societies, count } = response.data;
      return NextResponse.json({ societies, count });
    }

    return NextResponse.json(
      { message: response?.message || "Unexpected response format" },
      { status: 500 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || "Failed to fetch scheme societies" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const payload = await request.json();
  
  // Check if society with same name already exists
  const existingSociety = await SchemeSocietyModel.findOne({ name: payload.name });
  if (existingSociety) {
    return NextResponse.json({ message: "Society with same name already exists" }, { status: 400 });
  }

  await connectToDatabase();

  const response = await SchemeSocietyModel.create(payload);

  return NextResponse.json(response);
}

export async function DELETE(request: Request) {
  const body = await request.json();
  const { id } = body;

  if (!id) {
    return NextResponse.json({ message: "ID is required" }, { status: 400 });
  }

  await connectToDatabase();

  const response = await SchemeSocietyModel.findByIdAndDelete(id);

  if (!response) {
    return NextResponse.json({ message: "Society not found" }, { status: 404 });
  }

  await SchemeSocietyModel.findByIdAndDelete(id);

  return NextResponse.json({ message: "Society deleted successfully" });
}

export async function PUT(request: Request) {
  const body = await request.json();
  const { id, ...rest } = body;

  if (!id) {
    return NextResponse.json({ message: "ID is required" }, { status: 400 });
  }

  await connectToDatabase();

  const response = await SchemeSocietyModel.findByIdAndUpdate(id, rest, { new: true });

  if (!response) {
    return NextResponse.json({ message: "Society not found" }, { status: 404 });
  }

  return NextResponse.json({ message: "Society updated successfully" });
}