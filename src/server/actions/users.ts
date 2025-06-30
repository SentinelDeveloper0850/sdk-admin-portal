import { UserModel } from "@/app/models/user.schema";
import { connectToDatabase } from "@/lib/db";

interface UpdateProfilePayload {
  name?: string;
  phone?: string;
  address?: string;
  avatarUrl?: string;
  preferences?: {
    theme?: "light" | "dark" | "system";
    notifications?: boolean;
  };
}

export async function updateUserProfile(
  userId: string,
  payload: UpdateProfilePayload
) {
  console.log(
    "🚀 ~ server-action:users ~ updateUserProfile ~ payload:",
    payload
  );
  try {
    await connectToDatabase();

    const updatedUser = await UserModel.findByIdAndUpdate(
      userId,
      {
        ...(payload.name && { name: payload.name }),
        ...(payload.phone && { phone: payload.phone }),
        ...(payload.address && { address: payload.address }),
        ...(payload.avatarUrl && { avatarUrl: payload.avatarUrl }),
        ...(payload.preferences && { preferences: payload.preferences }),
      },
      { new: true } // return the updated document
    );
    console.log(
      "🚀 ~ server-action:users ~ updateUserProfile ~ updatedUser:",
      updatedUser
    );

    if (!updatedUser) {
      return { success: false, message: "User not found" };
    }

    return { success: true, user: updatedUser };
  } catch (err: any) {
    console.error("server-action:users ~ updateUserProfile error:", err);
    return { success: false, message: err.message || "Internal server error" };
  }
}
