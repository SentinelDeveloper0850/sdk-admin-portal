import { IUser } from "@/app/models/user.schema";

export const hasRole = (user: IUser, role: string) => {
  return user.roles?.includes(role) || user.role === role;
}