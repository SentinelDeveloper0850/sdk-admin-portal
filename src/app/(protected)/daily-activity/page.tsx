"use client";

import { useEffect, useMemo, useState } from "react";

import {
  CalendarOutlined,
  LeftOutlined,
  ReloadOutlined,
  RightOutlined,
} from "@ant-design/icons";
import { Avatar, Card, Chip, Divider } from "@nextui-org/react";
import {
  Avatar as AntAvatar,
  Input as AntInput,
  Button,
  Col,
  DatePicker,
  Descriptions,
  Drawer,
  Flex,
  Form,
  List,
  Row,
  Select,
  Space,
  Spin,
  Table,
  TimePicker,
} from "antd";
import dayjs from "dayjs";
import sweetAlert from "sweetalert";

import { getDateTime, getTime } from "@/utils/formatters";

import PageHeader from "@/app/components/page-header";
import { IBranch } from "@/app/models/system/branch.schema";
import { useAuth } from "@/context/auth-context";
import { formatPolicyNumber } from "@/lib/utils";

const activities = [
  {
    id: 5,
    name: "General Enquiry",
    type: "general",
    rules: [],
    channel: ["Walk-in", "Telephonic", "Email", "Facebook", "Website"],
  },
  {
    id: 1,
    name: "New Member Joining",
    type: "policy",
    rules: [],
  },
  {
    id: 2,
    name: "Policy Renewal",
    type: "policy",
    rules: [],
  },
  {
    id: 3,
    name: "Policy Cancellation",
    type: "policy",
    rules: [],
  },
  {
    id: 4,
    name: "Policy Amendment",
    type: "policy",
    rules: [],
  },
  {
    id: 6,
    name: "Claim Processing",
    type: "policy",
    rules: [],
    channel: ["Walk-in", "Telephonic", "Email", "Facebook", "Website"],
  },
  {
    id: 7,
    name: "Society",
    type: "society",
    rules: [],
  },
];

interface DailyActivityStats {
  totalReports: number;
  totalActivities: number;
  branchesWithReports: string[];
  mostActiveBranch: string;
  complianceRate: number;
  expectedUsers: number;
  submittedUsers: number;
}

export default function DailyActivityPage() {
  const [form] = Form.useForm();

  const activity = Form.useWatch("activity", form);

  const [selectedReport, setSelectedReport] = useState<any>();
  const [selectedActivity, setSelectedActivity] = useState<any>();
  const [reportActivities, setReportActivities] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [allReports, setAllReports] = useState<any[]>([]);
  const [stats, setStats] = useState<DailyActivityStats | null>(null);

  const [branches, setBranches] = useState<IBranch[]>([]);

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [createDrawerOpen, setCreateDrawerOpen] = useState<boolean>(false);
  const [viewDrawerOpen, setViewDrawerOpen] = useState<boolean>(false);

  // Calendar day view state
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [searchTerm, setSearchTerm] = useState("");
  const [branchFilter, setBranchFilter] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const { user } = useAuth();

  useEffect(() => {
    if (user && form) {
      form.setFieldsValue({
        username: user.name,
        date: dayjs(),
        time: dayjs(),
      });
    }
  }, [user, form]);

  useEffect(() => {
    if (activity) {
      console.log("Watched value for 'activity' => ", activity);
      const selectedActivity = activities.find(
        (item) => item.name === activity.toString()
      );
      console.log("Selected Activity => ", selectedActivity);
      setSelectedActivity(selectedActivity);
    }
  }, [activity]);

  const fetchReports = async () => {
    setLoading(true);

    if (!user) {
      return sweetAlert({
        title: "User not detected",
        icon: "error",
        timer: 2000,
      });
    }

    const userId = user.id ?? user._id;
    const date = selectedDate.format("DD/MM/YYYY");

    const url =
      user?.role == "admin"
        ? `/api/daily-activity?date=${date}`
        : `/api/daily-activity?userId=${userId}&date=${date}`;

    try {
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();
      if (response.ok) {
        console.log("reports", data);
        setAllReports(data);
        setReports(data);
        calculateStats(data);
      } else if (response.status == 404) {
        sweetAlert({
          title: data.message,
          icon: "info",
          timer: 2000,
        });
      } else {
        console.error("Error:", data.message);
        sweetAlert({
          title: data.message,
          icon: "error",
          timer: 2000,
        });
      }
    } catch (error) {
      console.log(error);
      sweetAlert({
        title: "Error fetching reports!",
        icon: "error",
        timer: 2000,
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (reportsData: any[]) => {
    const selectedDateStr = selectedDate.format("DD/MM/YYYY");
    const dayReports = reportsData.filter(
      (report) => report.date === selectedDateStr
    );

    const totalActivities = dayReports.reduce(
      (sum, report) => sum + (report.activities?.length || 0),
      0
    );
    const branches = [...new Set(dayReports.map((report) => report.branch))];

    // Find most active branch
    const branchCounts = branches.reduce(
      (acc, branch) => {
        acc[branch] = dayReports.filter(
          (report) => report.branch === branch
        ).length;
        return acc;
      },
      {} as Record<string, number>
    );

    const mostActiveBranch =
      Object.entries(branchCounts).sort(
        ([, a], [, b]) => (b as number) - (a as number)
      )[0]?.[0] || "None";

    // Calculate compliance rate (this would need to be fetched from dashboard API in a real implementation)
    const expectedUsers = 10; // This should come from the dashboard API
    const submittedUsers = dayReports.length;
    const complianceRate =
      expectedUsers > 0 ? (submittedUsers / expectedUsers) * 100 : 0;

    setStats({
      totalReports: dayReports.length,
      totalActivities,
      branchesWithReports: branches,
      mostActiveBranch,
      complianceRate,
      expectedUsers,
      submittedUsers,
    });
  };

  const fetchBranches = async () => {
    try {
      const response = await fetch("/api/configurations/branches");
      const { data } = await response.json();
      console.log("🚀 ~ fetchBranches ~ data:", data);
      if (response.ok) {
        setBranches(data as IBranch[]);
      } else if (response.status == 404) {
        sweetAlert({
          title: "No branches found",
          icon: "info",
          timer: 2000,
        });
      } else {
        console.error("Error fetching branches:", data.message);
        sweetAlert({
          title: "Error fetching branches",
          icon: "error",
          timer: 2000,
        });
      }
    } catch (error) {
      console.log(error);
      sweetAlert({
        title: "Error fetching branches",
        icon: "error",
        timer: 2000,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBranches();
  }, []);

  useEffect(() => {
    if (user && selectedDate) {
      fetchReports();
    }
  }, [user, selectedDate]);

  const handleRefresh = () => {
    fetchReports();
    fetchBranches();
  };

  // Filter reports based on selected date, search, and branch filter
  const filteredReports = useMemo(() => {
    const selectedDateStr = selectedDate.format("DD/MM/YYYY");
    let filtered = allReports.filter(
      (report) => report.date === selectedDateStr
    );

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (report) =>
          report.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          report.branch?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          report.activities?.some((activity: any) =>
            activity.name?.toLowerCase().includes(searchTerm.toLowerCase())
          )
      );
    }

    // Apply branch filter
    if (branchFilter) {
      filtered = filtered.filter((report) => report.branch === branchFilter);
    }

    return filtered;
  }, [allReports, selectedDate, searchTerm, branchFilter]);

  // Paginate filtered reports
  const paginatedReports = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredReports.slice(startIndex, startIndex + pageSize);
  }, [filteredReports, currentPage]);

  // Update stats when date changes
  useEffect(() => {
    if (allReports.length > 0) {
      calculateStats(allReports);
    }
  }, [selectedDate, allReports]);

  const submitReport = async (values: any) => {
    setLoading(true);

    if (!user) {
      return sweetAlert({
        title: "User not detected",
        icon: "error",
        timer: 2000,
      });
    }

    try {
      if (reportActivities.length !== 0) {
        const reportDate = dayjs(values.date).format("DD/MM/YYYY");
        const reportTime = dayjs(values.time).format("HH:mm");
        const userId = user.id ?? user._id;
        const branch = branches.find((branch) => {
          return branch._id?.toString() === values.branch?.toString();
        });

        console.log("🚀 ~ submitReport ~ branch:", branch);

        const response = await fetch("/api/daily-activity", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId,
            userName: user.name,
            activities: reportActivities,
            branch: branch?.name ?? values.branch,
            branchId: branch?._id,
            date: reportDate,
            time: reportTime,
            comments: values.comments,
          }),
        });

        const data = await response.json();
        if (response.ok) {
          resetForm();
          setCreateDrawerOpen(false);
          fetchReports();
          sweetAlert({
            title: "Report submitted successfully!",
            icon: "success",
            timer: 2000,
          });
        } else {
          console.error("Error:", data.message);
          sweetAlert({
            title: data.message,
            icon: "error",
            timer: 2000,
          });
        }
      } else {
        sweetAlert({
          title: "Please select at least one activity!",
          icon: "error",
          timer: 2000,
        });
      }
    } catch (error) {
      console.log(error);
      sweetAlert({
        title: "Error submitting report!",
        icon: "error",
        timer: 2000,
      });
    } finally {
      setLoading(false);
    }
  };

  const addActivityToReport = () => {
    const { activity, policyNumber, claimNumber, societyName } =
      form.getFieldsValue();
    let newActivity: any = { name: activity };

    const formattedPolicyNumber = policyNumber
      ? formatPolicyNumber(policyNumber)
      : null;

    if (selectedActivity.type == "policy")
      newActivity.policyNumber = formattedPolicyNumber;
    if (activity == "Claim Processing") newActivity.claimNumber = claimNumber;
    if (activity == "Society") newActivity.societyName = societyName;

    setReportActivities((prev) => {
      return [...prev, newActivity];
    });

    form.setFieldsValue({
      activity: undefined,
      policyNumber: undefined,
      claimNumber: undefined,
    });

    setSelectedActivity(undefined);
  };

  const resetForm = () => {
    if (!user) {
      return sweetAlert({
        title: "User not detected",
        icon: "error",
        timer: 2000,
      });
    }

    form.resetFields();
    setSelectedActivity(undefined);
    setReportActivities([]);
    form.setFieldsValue({
      username: user.name,
      date: dayjs(),
      time: dayjs(),
    });
  };

  const disableFutureDates = (current: any) => {
    // Disable all dates after today
    return current && current.isAfter(dayjs(), "day"); // 'day' ensures it's only comparing by date (ignoring time)
  };

  const reportSubmissionDue = useMemo(() => {
    if (reports) {
      const currentDate = dayjs().format("DD/MM/YYYY");
      const todaysReport = reports
        .filter((report) => report.userId == user?._id)
        .find((report) => report.date == currentDate);

      console.log("🚀 ~ reportSubmissionDue ~ todaysReport:", todaysReport);
      if (todaysReport !== undefined) {
        return false;
      } else {
        return true;
      }
    }
  }, [reports, user]);

  const handleDateChange = (date: dayjs.Dayjs | null) => {
    if (date) {
      setSelectedDate(date);
      setCurrentPage(1); // Reset to first page when date changes
    }
  };

  const handlePreviousDay = () => {
    setSelectedDate(selectedDate.subtract(1, "day"));
    setCurrentPage(1);
  };

  const handleNextDay = () => {
    const tomorrow = dayjs().add(1, "day");
    if (selectedDate.isBefore(tomorrow, "day")) {
      setSelectedDate(selectedDate.add(1, "day"));
      setCurrentPage(1);
    }
  };

  const handleToday = () => {
    setSelectedDate(dayjs());
    setCurrentPage(1);
  };

  const saveDraft = () => {
    console.log("saveDraft");
  };

  return (
    <div style={{ padding: "20px" }}>
      <PageHeader
        title="Daily Activity Reports"
        actions={[
          <Space>
            {/* Refresh button */}
            <Button
              type="default"
              icon={<ReloadOutlined />}
              onClick={handleRefresh}
            >
              Refresh
            </Button>

            {/* Submit report button */}
            {reportSubmissionDue == true && (
              <Button
                type="primary"
                className="text-black"
                onClick={() => setCreateDrawerOpen(true)}
              >
                Submit Report
              </Button>
            )}
          </Space>,
        ]}
      />

      {/* Stats Cards */}
      {stats && (
        <div className="mb-6">
          <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="bg-blue-50 dark:bg-blue-900/20">
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
                      Total Reports
                    </p>
                    <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                      {stats.totalReports}
                    </p>
                  </div>
                  <div className="text-blue-500">
                    <svg
                      className="h-8 w-8"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="bg-green-50 dark:bg-green-900/20">
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-600 dark:text-green-400">
                      Total Activities
                    </p>
                    <p className="text-2xl font-bold text-green-700 dark:text-green-300">
                      {stats.totalActivities}
                    </p>
                  </div>
                  <div className="text-green-500">
                    <svg
                      className="h-8 w-8"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 10V3L4 14h7v7l9-11h-7z"
                      />
                    </svg>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="bg-purple-50 dark:bg-purple-900/20">
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-purple-600 dark:text-purple-400">
                      Most Active Branch
                    </p>
                    <p className="truncate text-lg font-bold text-purple-700 dark:text-purple-300">
                      {stats.mostActiveBranch}
                    </p>
                  </div>
                  <div className="text-purple-500">
                    <svg
                      className="h-8 w-8"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                      />
                    </svg>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="bg-orange-50 dark:bg-orange-900/20">
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-orange-600 dark:text-orange-400">
                      Compliance Rate
                    </p>
                    <p className="text-2xl font-bold text-orange-700 dark:text-orange-300">
                      {stats.complianceRate.toFixed(1)}%
                    </p>
                    <p className="text-xs text-orange-600 dark:text-orange-400">
                      {stats.submittedUsers}/{stats.expectedUsers} users
                    </p>
                  </div>
                  <div className="text-orange-500">
                    <svg
                      className="h-8 w-8"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* Calendar Day Navigation */}
      <div className="mb-6">
        <Card className="bg-white dark:bg-gray-800">
          <div className="p-4">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button
                  type="primary"
                  size="small"
                  className="text-xs text-black"
                  onClick={handlePreviousDay}
                  icon={<LeftOutlined />}
                >
                  Previous Day
                </Button>
                <Button
                  type="primary"
                  size="small"
                  className="text-xs text-black"
                  onClick={handleToday}
                  icon={<CalendarOutlined />}
                >
                  Today
                </Button>
                <Button
                  type="primary"
                  size="small"
                  className="text-xs text-black"
                  onClick={handleNextDay}
                  disabled={selectedDate.isSame(dayjs(), "day")}
                  icon={<RightOutlined />}
                  iconPosition="end"
                >
                  Next Day
                </Button>
              </div>
              <div className="text-lg font-semibold">
                {selectedDate.format("dddd, MMMM D, YYYY")}
              </div>
            </div>

            {/* Search and Filters */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
              <AntInput
                placeholder="Search reports..."
                value={searchTerm}
                allowClear
                onChange={(e) => setSearchTerm(e.target.value)}
                prefix={
                  <svg
                    className="h-4 w-4 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                }
              />
              <Select
                placeholder="Filter by branch"
                value={branchFilter}
                onChange={setBranchFilter}
                allowClear
                className="w-full"
              >
                {branches.map((branch: IBranch, index: number) => (
                  <Select.Option key={index} value={branch._id}>
                    {branch.name}
                  </Select.Option>
                ))}
              </Select>
              <div className="flex items-center gap-2">
                <Chip color="primary" variant="flat">
                  {filteredReports.length} reports
                </Chip>
                {branchFilter && (
                  <Chip
                    color="secondary"
                    variant="flat"
                    onClose={() => setBranchFilter("")}
                  >
                    Branch: {branchFilter}
                  </Chip>
                )}
              </div>
            </div>
          </div>
        </Card>
      </div>

      {!loading ? (
        <main>
          <Table
            rowKey="_id"
            bordered
            loading={loading}
            dataSource={paginatedReports}
            rowClassName="cursor-pointer hover:bg-gray-100"
            pagination={{
              current: currentPage,
              pageSize: pageSize,
              total: filteredReports.length,
              onChange: (page) => setCurrentPage(page),
              showSizeChanger: false,
              showQuickJumper: true,
              showTotal: (total, range) =>
                `${range[0]}-${range[1]} of ${total} reports`,
            }}
            columns={[
              {
                title: "Reporter",
                dataIndex: "userName",
                key: "userName",
                render: (value: string, record: any) => (
                  <div className="flex items-center gap-4">
                    <Avatar
                      src={record.author?.avatarUrl ?? ""}
                      size="sm"
                      isBordered
                      radius="full"
                    />
                    <span className="text-sm">
                      {record.author?.name ?? "Unnamed"}
                    </span>
                  </div>
                ),
              },
              {
                title: "Branch",
                dataIndex: "branch",
                key: "branch",
                render: (value: string) => (
                  <Chip color="primary" variant="flat" size="sm">
                    {value}
                  </Chip>
                ),
              },
              {
                title: "Activities",
                dataIndex: "activities",
                key: "activities",
                render: (activities: any[]) => (
                  <div className="flex flex-wrap gap-1">
                    <Chip color="success" variant="flat" size="sm">
                      {activities.length}{" "}
                      {activities.length === 1 ? "Activity" : "Activities"}
                    </Chip>
                    {activities
                      .slice(0, 2)
                      .map((activity: any, index: number) => (
                        <Chip
                          key={index}
                          color="default"
                          variant="flat"
                          size="sm"
                        >
                          {activity.name}
                        </Chip>
                      ))}
                    {activities.length > 2 && (
                      <Chip color="default" variant="flat" size="sm">
                        +{activities.length - 2} more
                      </Chip>
                    )}
                  </div>
                ),
              },
              {
                title: "Submission Time",
                dataIndex: "createdAt",
                key: "createdAt",
                render: (val: string) => (
                  <span className="text-sm">{getTime(val)}</span>
                ),
                sorter: (a: any, b: any) =>
                  new Date(a.createdAt).getTime() -
                  new Date(b.createdAt).getTime(),
              },
              {
                title: "Actions",
                key: "actions",
                render: (_, record: any) => (
                  <Button
                    type="primary"
                    className="text-black"
                    onClick={() => {
                      setSelectedReport(record);
                      setViewDrawerOpen(true);
                    }}
                  >
                    View Details
                  </Button>
                ),
              },
            ]}
            expandable={{
              expandedRowRender: (record: any) =>
                record.comments ? (
                  <div className="ml-0 whitespace-pre-wrap p-0 text-gray-700">
                    💬<strong className="ml-1">Comments:</strong>
                    <br />
                    <p className="ml-1">{record.comments}</p>
                  </div>
                ) : (
                  <i className="text-gray-400">No comments provided.</i>
                ),
              rowExpandable: (record) => !!record.comments,
            }}
          />
        </main>
      ) : (
        <div style={{ padding: "20px", textAlign: "center" }}>
          <Spin size="large" />
        </div>
      )}

      {/* Rest of the component remains the same */}
      <Drawer
        title="Submit Report"
        placement="right"
        closable={true}
        onClose={() => setCreateDrawerOpen(false)}
        open={createDrawerOpen}
        width="50%"
        footer={
          <Flex justify="space-between" gap={2}>
            <Space>
              <Button
                type="primary"
                className="bg-gray-400 text-black hover:!bg-gray-500"
                onClick={saveDraft}
              >
                Save Draft
              </Button>
              <Button
                type="primary"
                className="bg-green-500 text-black hover:!bg-green-600"
                onClick={() => form.submit()}
              >
                Save & Submit
              </Button>
            </Space>
            <Button
              danger
              type="default"
              onClick={() => {
                resetForm();
                setCreateDrawerOpen(false);
              }}
            >
              Cancel
            </Button>
          </Flex>
        }
      >
        <Form form={form} layout="vertical" onFinish={submitReport}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Username"
                name="username"
                rules={[
                  {
                    required: true,
                  },
                ]}
              >
                <AntInput disabled value={user?.name} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Branch"
                name="branch"
                rules={[
                  {
                    required: true,
                  },
                ]}
              >
                <Select>
                  {branches.map((item, index: number) => (
                    <Select.Option key={index} value={item._id}>
                      {item.name}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Report Date"
                name="date"
                rules={[
                  {
                    required: true,
                  },
                ]}
              >
                <DatePicker
                  style={{ width: "100%" }}
                  disabledDate={disableFutureDates}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Report Time"
                name="time"
                rules={[
                  {
                    required: true,
                  },
                ]}
              >
                <TimePicker style={{ width: "100%" }} format="HH:mm" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Activity" name="activity" rules={[]}>
                <Select>
                  {activities.map((item) => (
                    <Select.Option key={item.id} value={item.name}>
                      {item.name}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              {selectedActivity && selectedActivity.type == "policy" && (
                <Form.Item
                  label="Associated Policy Number"
                  name="policyNumber"
                  rules={[
                    {
                      required: true,
                    },
                  ]}
                >
                  <AntInput />
                </Form.Item>
              )}
              {selectedActivity && selectedActivity.type == "society" && (
                <Form.Item
                  label="Society Name"
                  name="societyName"
                  rules={[
                    {
                      required: true,
                    },
                  ]}
                >
                  <AntInput />
                </Form.Item>
              )}
            </Col>
            <Col span={12}>
              {selectedActivity &&
                selectedActivity.name == "Claim Processing" && (
                  <Form.Item
                    label="Associated Claim Number"
                    name="claimNumber"
                    rules={[
                      {
                        required: true,
                      },
                    ]}
                  >
                    <AntInput />
                  </Form.Item>
                )}
            </Col>
          </Row>
          <Row>
            <Col span={12}>
              <Form.Item>
                <Button type="default" onClick={addActivityToReport}>
                  Add Activity
                </Button>
              </Form.Item>
            </Col>
          </Row>
          <Form.Item label="Comments" name="comments" rules={[]}>
            <AntInput.TextArea />
          </Form.Item>
          <h4 className="mb-2 font-bold">Report Activities</h4>
          <Divider />
          <List
            dataSource={reportActivities}
            renderItem={(item, index) => {
              let description = undefined;

              if (item.policyNumber && item.claimNumber) {
                description = `Policy #${item.policyNumber}, Claim #${item.claimNumber}`;
              } else if (item.policyNumber) {
                description = `Policy #${item.policyNumber}`;
              }
              if (item.societyName) description = item.societyName;

              return (
                <List.Item key={index}>
                  <List.Item.Meta
                    avatar={<AntAvatar>{index + 1}</AntAvatar>}
                    title={item.name}
                    description={description}
                  />
                </List.Item>
              );
            }}
          />
        </Form>
      </Drawer>
      <Drawer
        title="View Report"
        placement="right"
        closable={true}
        onClose={() => {
          setSelectedReport(undefined);
          setViewDrawerOpen(false);
        }}
        open={viewDrawerOpen}
        width="60%"
      >
        {selectedReport && (
          <>
            <Descriptions
              title="Report Information"
              items={[
                {
                  key: 1,
                  label: "Reporter",
                  children: selectedReport.userName,
                },
                {
                  key: 2,
                  label: "Branch",
                  span: 2,
                  children: selectedReport.branch,
                },
                {
                  key: 3,
                  label: "Report Date",
                  children: selectedReport.date,
                },
                {
                  key: 4,
                  label: "Submission Date",
                  span: 2,
                  children: getDateTime(selectedReport.createdAt),
                },
              ]}
            />
            <Divider className="mt-4" />
            <div className="ml-0 mt-4 whitespace-pre-wrap p-0 text-gray-700">
              💬<strong className="ml-1">Comments:</strong>
              <br />
              <p className="ml-1">{selectedReport.comments}</p>
            </div>
            <Divider className="mt-4" />
            <h4 className="mb-2 mt-4 text-medium font-semibold">
              Report Activities
            </h4>
            <List
              dataSource={selectedReport.activities}
              renderItem={(item: any, index) => {
                let description = undefined;

                if (item.policyNumber && item.claimNumber) {
                  description = `Policy #${item.policyNumber}, Claim #${item.claimNumber}`;
                } else if (item.policyNumber) {
                  description = `Policy #${item.policyNumber}`;
                }
                if (item.societyName) description = item.societyName;

                return (
                  <List.Item key={index}>
                    <List.Item.Meta
                      avatar={<AntAvatar>{index + 1}</AntAvatar>}
                      title={item.name}
                      description={description}
                    />
                  </List.Item>
                );
              }}
            />
          </>
        )}
      </Drawer>
    </div>
  );
}
