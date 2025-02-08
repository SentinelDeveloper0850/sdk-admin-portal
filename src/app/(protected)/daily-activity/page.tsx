"use client";

import { useEffect, useState } from "react";



import { Button, Divider } from "@nextui-org/react";
import { Avatar, Col, DatePicker, Descriptions, Drawer, Form, Input, List, Row, Select, Space, Spin, Table, TimePicker } from "antd";
import dayjs from "dayjs";
import sweetAlert from "sweetalert";



import { getCurrentDate, getDate, getDateTime, getTime } from "@/utils/formatters";



import PageHeader from "@/app/components/page-header";
import { useAuth } from "@/context/auth-context";


const branches = ["Kaalfontein", "Mangweni", "Ndulwini", "Sangweni", "Simunye"];

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
];

export default function DailyActivityPage() {
  const [form] = Form.useForm();

  const activity = Form.useWatch("activity", form);

  const [selectedReport, setSelectedReport] = useState<any>();
  const [selectedActivity, setSelectedActivity] = useState<any>();
  const [reportActivities, setReportActivities] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [createDrawerOpen, setCreateDrawerOpen] = useState<boolean>(false);
  const [viewDrawerOpen, setViewDrawerOpen] = useState<boolean>(false);

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

    const userId = user.id ?? user._id;

    const url =
      user.role == "admin"
        ? "/api/daily-activity"
        : `/api/daily-activity?userId=${userId}`;

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
        setReports(data);
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

  useEffect(() => {
    if (user) {
      fetchReports();
    }
  }, [user]);

  const submitReport = async (values: any) => {
    setLoading(true);

    try {
      if (reportActivities.length !== 0) {
        const reportDate = dayjs(values.date).format("YYYY-MM-DD");
        const reportTime = dayjs(values.time).format("HH:MM");
        const userId = user.id ?? user._id;

        const response = await fetch("/api/daily-activity", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId,
            userName: user.name,
            activities: reportActivities,
            branch: values.branch,
            date: getDate(reportDate),
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
    const { activity, policyNumber, claimNumber } = form.getFieldsValue();
    let newActivity: any = {
      name: activity,
    };

    if (selectedActivity.type == "policy")
      newActivity.policyNumber = policyNumber;
    if (activity == "Claim Processing") newActivity.claimNumber = claimNumber;

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

  const reportSubmissionDue = () => {
    if (reports) {
      const currentDate = getCurrentDate();
      const todaysReport = reports.find((report) => report.date == currentDate);

      if (todaysReport) return false;
    }

    return true;
  };

  return (
    <div style={{ padding: "20px" }}>
      <PageHeader
        title="Daily Activity Reports"
        actions={[
          <Space>
            {user.role != "admin" && reportSubmissionDue() && (
              <Button color="primary" onPress={() => setCreateDrawerOpen(true)}>
                Submit Report
              </Button>
            )}
          </Space>,
        ]}
      />

      {!loading ? (
        <main>
          <Table
            rowKey="_id"
            bordered
            loading={loading}
            dataSource={reports}
            rowClassName="cursor-pointer hover:bg-gray-100"
            columns={[
              {
                title: "Reporter",
                dataIndex: "userName",
                key: "userName",
              },
              {
                title: "Report Date",
                dataIndex: "date",
                key: "date",
                render: (val: string, record: any) => <span>{val}</span>,
                sorter: (a: any, b: any) =>
                  new Date(a.date).getTime() - new Date(b.date).getTime(),
              },
              {
                title: "Submission Date",
                dataIndex: "createdAt",
                key: "createdAt",
                render: (val: string, record: any) => (
                  <span>
                    {getDate(val)} {getTime(val)}
                  </span>
                ),
                sorter: (a: any, b: any) =>
                  new Date(a.date).getTime() - new Date(b.date).getTime(),
              },
              {
                title: "Branch",
                dataIndex: "branch",
                key: "branch",
              },
              {
                title: "Activities",
                dataIndex: "activities",
                key: "activities",
                render: (activities: any[]) => (
                  <span>
                    {activities.length}{" "}
                    {activities.length == 1 ? "Activity" : "Activities"}
                  </span>
                ),
              },
              {
                title: "Comments",
                dataIndex: "comments",
                key: "comments",
              },
            ]}
            onRow={(record: any) => {
              return {
                onClick: () => {
                  setSelectedReport(record);
                  setViewDrawerOpen(true);
                },
              };
            }}
          />
        </main>
      ) : (
        <div style={{ padding: "20px", textAlign: "center" }}>
          <Spin size="large" />
        </div>
      )}
      <Drawer
        title="Submit Report"
        placement="right"
        closable={true}
        onClose={() => setCreateDrawerOpen(false)}
        open={createDrawerOpen}
        width="40%"
        footer={
          <Space>
            <Button color="primary" onPress={() => form.submit()}>
              Submit
            </Button>
            <Button
              color="danger"
              onClick={() => {
                resetForm();
                setCreateDrawerOpen(false);
              }}
            >
              Cancel
            </Button>
          </Space>
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
                <Input disabled value={user.name} />
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
                  {branches.map((item) => (
                    <Select.Option key={item} value={item}>
                      {item}
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
                  <Input />
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
                    <Input />
                  </Form.Item>
                )}
            </Col>
          </Row>
          <Row>
            <Col span={12}>
              <Form.Item>
                <Button onPress={addActivityToReport} color="primary">
                  Add Activity
                </Button>
              </Form.Item>
            </Col>
          </Row>
          <Form.Item label="Comments" name="comments" rules={[]}>
            <Input.TextArea />
          </Form.Item>
          <h4 className="mb-2 font-bold">Report Activities</h4>
          <Divider />
          <List
            dataSource={reportActivities}
            renderItem={(item, index) => (
              <List.Item key={index}>
                <List.Item.Meta
                  avatar={<Avatar>{index + 1}</Avatar>}
                  title={item.name}
                  description={
                    item.policyNumber && item.claimNumber
                      ? `Policy #${item.policyNumber}, Claim #${item.claimNumber}`
                      : item.policyNumber
                        ? `Policy #${item.policyNumber}`
                        : undefined
                  }
                />
              </List.Item>
            )}
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
                {
                  key: 5,
                  label: "Comments",
                  span: 3,
                  children: selectedReport.comments,
                },
              ]}
            />
            <Divider className="mt-4" />
            <h4 className="mb-2 mt-4 text-medium font-semibold">
              Report Activities
            </h4>
            <List
              dataSource={selectedReport.activities}
              renderItem={(item: any, index) => (
                <List.Item key={index}>
                  <List.Item.Meta
                    avatar={<Avatar>{index + 1}</Avatar>}
                    title={item.name}
                    description={
                      item.policyNumber && item.claimNumber
                        ? `Policy #${item.policyNumber}, Claim #${item.claimNumber}`
                        : item.policyNumber
                          ? `Policy #${item.policyNumber}`
                          : undefined
                    }
                  />
                </List.Item>
              )}
            />
          </>
        )}
      </Drawer>
    </div>
  );
}