import { IUser } from "@/app/models/hr/user.schema";

export const hasRole = (user: IUser, role: string) => {
  return user.roles?.includes(role) || user.role === role;
};
