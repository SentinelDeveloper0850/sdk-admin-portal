import { IUser } from "@/app/models/auth/user.schema";

export const hasRole = (user: IUser, role: string) => {
  return user.roles?.includes(role) || user.role === role;
};
