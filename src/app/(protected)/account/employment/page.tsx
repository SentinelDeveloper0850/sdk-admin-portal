"use client";

import { Button, Card, CardBody, CardHeader } from "@nextui-org/react";
import dayjs from "dayjs";

import PageHeader from "@/app/components/page-header";
import { useAuth } from "@/context/auth-context";

const EmploymentPage = () => {
  const { user } = useAuth();

  const employee = user?.employee;

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title="Employment Details"
        subtitle="View information about your current employment"
      />

      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold">Position Info</h2>
        </CardHeader>
        <CardBody className="space-y-2 text-sm text-gray-400">
          <div className="flex justify-between">
            <span>Job Title</span>
            <span className="text-white">{employee?.position ?? "--"}</span>
          </div>
          <div className="flex justify-between">
            <span>Department</span>
            <span className="text-white">{employee?.department ?? "--"}</span>
          </div>
          <div className="flex justify-between">
            <span>Start Date</span>
            <span className="text-white">
              {employee?.startDate
                ? dayjs(employee.startDate).format("D MMM YYYY")
                : "--"}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Manager</span>
            <span className="italic text-white">Coming Soon</span>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader className="justify-between">
          <h2 className="text-lg font-semibold">Job Description</h2>
          <Button size="sm" disabled>
            Download (coming soon)
          </Button>
        </CardHeader>
        <CardBody className="text-sm text-gray-300">
          <p>
            Your official job description and employment contract will be
            available for download once uploaded by HR.
          </p>
        </CardBody>
      </Card>
    </div>
  );
};

export default EmploymentPage;
