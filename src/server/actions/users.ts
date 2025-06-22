import { connectToDatabase } from "@/lib/db";
import { UserModel } from "@/app/models/user.schema";

interface UpdateProfilePayload {
  name?: string;
  avatarUrl?: string;
  preferences?: {
    theme?: "light" | "dark" | "system";
    notifications?: boolean;
  };
}

export async function updateUserProfile(userId: string, payload: UpdateProfilePayload) {
  console.log("🚀 ~ updateUserProfile ~ payload:", payload)
  try {
    await connectToDatabase();

    const updatedUser = await UserModel.findByIdAndUpdate(
      userId,
      {
        ...(payload.name && { name: payload.name }),
        ...(payload.avatarUrl && { avatarUrl: payload.avatarUrl }),
        ...(payload.preferences && { preferences: payload.preferences }),
      },
      { new: true } // return the updated document
    );
    console.log("🚀 ~ updateUserProfile ~ updatedUser:", updatedUser)

    if (!updatedUser) {
      return { success: false, message: "User not found" };
    }

    return { success: true, user: updatedUser };
  } catch (err: any) {
    console.error("updateUserProfile error:", err);
    return { success: false, message: err.message || "Internal server error" };
  }
}
