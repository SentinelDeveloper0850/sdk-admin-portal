// utils/with-role-guard.tsx
import { Result } from "antd";

import { useRole } from "@/app/hooks/use-role";

export const withRoleGuard = (Component: React.FC, allowedRoles: string[]) => {
  return function RoleProtectedComponent(props: any) {
    const { hasRole } = useRole();

    if (!hasRole(allowedRoles)) {
      return (
        <Result
          status="403"
          title="Access Denied"
          subTitle="You do not have permission to view this page."
        />
      );
    }

    return <Component {...props} />;
  };
};
