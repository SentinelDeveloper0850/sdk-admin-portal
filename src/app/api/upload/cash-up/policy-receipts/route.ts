import { NextRequest, NextResponse } from "next/server";

import { getUserFromRequest } from "@/lib/auth";
import { cloudinary } from "@/lib/cloudinary";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const submissionIdSuffix = formData.get("submissionIdSuffix") as string;

    if (!file) {
      return NextResponse.json(
        { success: false, message: "No file provided" },
        { status: 400 }
      );
    }

    // Get user from auth-token in request cookie
    const user = await getUserFromRequest(request);

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const submissionIdentifier = `${user._id}-${submissionIdSuffix}`;

    if (!submissionIdentifier) {
      return NextResponse.json(
        { success: false, message: "Submission identifier is required" },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const uploadResult = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: `cash-up/policy-receipts/${submissionIdentifier}`,
          resource_type: "auto",
        },
        (err, result) => {
          if (err) {
            console.error("Cloudinary upload error:", err);
            reject(err);
          } else {
            resolve(result);
          }
        }
      );
      stream.end(buffer);
    });

    console.log(
      "🚀 ~ POST ~ policy uploadResult to cash up submission:",
      uploadResult
    );

    return NextResponse.json({
      success: true,
      url: (uploadResult as any).secure_url,
    });
  } catch (err) {
    console.error("Policy receipt upload failed to cash up submission:", err);
    return NextResponse.json(
      {
        success: false,
        message: "Internal Server Error to cash up submission",
      },
      { status: 500 }
    );
  }
}
