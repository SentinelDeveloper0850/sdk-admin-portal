"use client";

import { useRouter } from "next/navigation";

import { Button, Card, CardBody, CardHeader } from "@nextui-org/react";
import dayjs from "dayjs";

import PageHeader from "@/app/components/page-header";
import { useAuth } from "@/context/auth-context";

const AccountOverviewPage = () => {
  const { user } = useAuth();
  const router = useRouter();

  const name = user?.name || user?.name || "User";

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title={`Welcome, ${name}`}
        subtitle="This is your personal employee portal. From here, you can access your HR info, request leave, view payslips, and manage your profile."
      />

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {/* Leave Balance */}
        <Card>
          <CardHeader className="justify-between">
            <div>
              <h3 className="text-md font-semibold">Leave Balance</h3>
              <p className="text-xs text-gray-400">Annual leave available</p>
            </div>
            <Button size="sm" onClick={() => router.push("/account/leave")}>
              View
            </Button>
          </CardHeader>
          <CardBody className="text-3xl font-bold text-yellow-400">
            {user?.employee?.leaveBalance?.annual ?? "—"} days
          </CardBody>
        </Card>

        {/* Latest Payslip */}
        <Card>
          <CardHeader className="justify-between">
            <div>
              <h3 className="text-md font-semibold">Latest Payslip</h3>
              <p className="text-xs text-gray-400">For current month</p>
            </div>
            <Button size="sm" onClick={() => router.push("/account/payslips")}>
              View
            </Button>
          </CardHeader>
          <CardBody className="text-sm italic text-white">
            Available via Payroll
          </CardBody>
        </Card>

        {/* Profile Info */}
        <Card>
          <CardHeader className="justify-between">
            <div>
              <h3 className="text-md font-semibold">My Profile</h3>
              <p className="text-xs text-gray-400">Name, contact & role</p>
            </div>
            <Button size="sm" onClick={() => router.push("/account/profile")}>
              Edit
            </Button>
          </CardHeader>
          <CardBody className="text-sm text-gray-400">
            <div className="flex justify-between">
              <span>Name</span>
              <span className="text-white">{user?.name ?? "--"}</span>
            </div>
            <div className="flex justify-between">
              <span>Role</span>
              <span className="text-yellow-400">
                {user?.role?.toUpperCase() ?? "--"}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Joined</span>
              <span className="text-white">
                {user?.createdAt
                  ? dayjs(user.createdAt).format("D MMM YYYY")
                  : "--"}
              </span>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
};

export default AccountOverviewPage;
