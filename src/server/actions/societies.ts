"use server";

import fs from "fs";
import Papa from "papaparse";

import { SocietyModel as Model } from "@/app/models/scheme/society.schema";
import { connectToDatabase } from "@/lib/db";
import { SocietyMemberModel } from "@/app/models/scheme/scheme-society-member.schema";
import mongoose from "mongoose";

export const fetchAllSocieties = async (page = 1, limit = 0) => {
  try {
    await connectToDatabase();

    const numberOfSocieties = await Model.countDocuments();
    const societies = await Model.find()
      .skip((page - 1) * limit)
      .limit(limit)
      .maxTimeMS(60000); // Prevents excessive query times

    return {
      success: true,
      data: {
        count: numberOfSocieties,
        societies: societies,
      },
    };
  } catch (error: any) {
    console.error("Error fetching societies:", error.message);
    return {
      success: false,
      message: "Internal Server Error ~ Error fetching societies",
    };
  }
};

export const searchSocieties = async (
  searchText: string,
  page = 1,
  limit = 100
) => {
  try {
    await connectToDatabase();

    const regex = new RegExp(searchText, "i");

    const societies = await Model.find({
      $or: [
        { name: regex },
        { societyId: regex },
        { chairmanFullNames: regex },
        { chairmanPhone: regex },
        { secretaryFullNames: regex },
        { secretaryPhone: regex },
        { treasurerFullNames: regex },
        { treasurerPhone: regex },
        { phone: regex },
        { fax: regex },
        { address: regex },
      ],
    })
      .skip((page - 1) * limit)
      .limit(limit)
      .maxTimeMS(60000); // Prevents excessive query times

    return {
      success: true,
      societies,
      count: societies.length,
    };
  } catch (error: any) {
    console.error("Error searching societies:", error.message);
    return {
      success: false,
      message: "Internal Server Error ~ Error searching societies",
    };
  }
};

export const importSociety = async (data: any) => {
  await connectToDatabase();

  try {
    const existingPolicy = await Model.findOne({ name: data.name });

    if (existingPolicy) {
      return {
        success: false,
        message: "Society already exists with this name.",
      };
    }

    const newSociety = new Model(data);
    await newSociety.save();

    return {
      success: true,
      data: newSociety,
    };
  } catch (error: any) {
    console.error("Error importing society:", error.message);
    return {
      success: false,
      message: "Internal Server Error ~ Error importing society",
    };
  }
};

export async function importSocietiesFromCSV(filePath: string) {
  await connectToDatabase();

  const fileContent = fs.readFileSync(filePath, "utf8");

  const { data, errors } = Papa.parse(fileContent, {
    header: true,
    skipEmptyLines: true,
  });

  if (errors.length > 0) {
    throw new Error("CSV parsing error: " + JSON.stringify(errors));
  }

  for (const row of data as any[]) {
    if (!row.name) continue;

    const exists = await Model.findOne({ name: row.name });
    if (!exists) {
      await Model.create({
        name: row.name,
        contactPerson: row.contactPerson,
        phoneNumber: row.phoneNumber,
        email: row.email,
        type: row.type,
        cloudinaryFolder: row.cloudinaryFolder,
      });
    }
  }
}

export const fetchSocietyMembersById = async (id: string) => {
  await connectToDatabase();
  try {
    const members = await SocietyMemberModel.find({ societyId: new mongoose.Types.ObjectId(id) });
    return {
      success: true,
      data: members || [],
    };
  } catch (error: any) {
    console.error("Error fetching society members:", error.message);
    return {
      success: false,
      message: "Internal Server Error ~ Error fetching society members",
    };
  }
}