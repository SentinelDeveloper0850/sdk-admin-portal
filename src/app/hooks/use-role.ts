import { useAuth } from "@/context/auth-context";
import { ERoles } from "../../../types/roles.enum";

export const useRole = () => {
  const { user } = useAuth();

  const hasRole = (target: string | string[]) => {
    if (!user) return false;
    const allRoles = [user.role, ...(user.roles || [])];
    return Array.isArray(target)
      ? target.some((r) => allRoles.includes(r))
      : allRoles.includes(target);
  };

  return {
    user,
    hasRole,
    isAdmin: hasRole(ERoles.Admin),
    isHR: hasRole(ERoles.HRManager),
    isClaimsOfficer: hasRole(ERoles.ClaimsOfficer),
    isFinance: hasRole([ERoles.FinanceOfficer, ERoles.Cashier]),
    // Add more convenience aliases as needed
  };
};
