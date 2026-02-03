"use server";

import fs from "fs";
import Papa from "papaparse";

import { SchemeSocietyModel } from "@/app/models/scheme/scheme-society.schema";
import { connectToDatabase } from "@/lib/db";

export const fetchAllSocieties = async (page = 1, limit = 0) => {
  try {
    await connectToDatabase();

    const numberOfSocieties = await SchemeSocietyModel.countDocuments();
    const societies = await SchemeSocietyModel.find()
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

    const societies = await SchemeSocietyModel.find({
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
        { consultantName: regex },
        { planName: regex },
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
    const existingSociety = await SchemeSocietyModel.findOne({
      name: data.name,
    });

    if (existingSociety) {
      return {
        success: false,
        message: "Society already exists with this name.",
      };
    }

    const newSociety = new SchemeSocietyModel(data);
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

    const exists = await SchemeSocietyModel.findOne({ name: row.name });
    if (!exists) {
      await SchemeSocietyModel.create({
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
