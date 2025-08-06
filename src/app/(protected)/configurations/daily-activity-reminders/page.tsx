"use client";

import { ClockCircleOutlined, PlayCircleOutlined, ReloadOutlined, SaveOutlined, UserOutlined } from "@ant-design/icons";
import { Alert, Button, Card, Col, Divider, Form, Input, message, Row, Space, Statistic, Switch, TimePicker } from "antd";
import dayjs from "dayjs";
import { useEffect, useState } from "react";

import PageHeader from "@/app/components/page-header";
import { useAuth } from "@/context/auth-context";
import { withRoleGuard } from "@/utils/utils/with-role-guard";

interface ReminderConfig {
  isEnabled: boolean;
  reminderTime: string;
  cutoffTime: string;
  excludeWeekends: boolean;
  excludeHolidays: boolean;
  excludeDates: string[];
  sendFirstReminder: boolean;
  firstReminderOffset: number;
  sendFinalReminder: boolean;
  finalReminderOffset: number;
  sendToAllUsers: boolean;
  excludeRoles: string[];
  includeRoles: string[];
  emailSubject: string;
  emailTemplate: string;
}

interface ReminderStats {
  totalRecipients: number;
  submittedToday: number;
  pendingToday: number;
  lastRunAt?: Date;
  nextRunAt?: Date;
  totalRemindersSent: number;
  isEnabled: boolean;
}

const DailyActivityRemindersPage = () => {
  const [form] = Form.useForm();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [triggering, setTriggering] = useState(false);
  const [config, setConfig] = useState<ReminderConfig | null>(null);
  const [stats, setStats] = useState<ReminderStats | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/daily-activity-reminders");
      const data = await response.json();

      if (data.success) {
        setConfig(data.data.config);
        setStats(data.data.stats);

        if (data.data.config) {
          form.setFieldsValue({
            ...data.data.config,
            reminderTime: data.data.config.reminderTime ? dayjs(data.data.config.reminderTime, "HH:mm") : null,
            cutoffTime: data.data.config.cutoffTime ? dayjs(data.data.config.cutoffTime, "HH:mm") : null,
          });
        }
      } else {
        message.error(data.message || "Failed to fetch configuration");
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      message.error("Failed to fetch configuration");
    } finally {
      setLoading(false);
    }
  };

  const saveConfig = async (values: any) => {
    setSaving(true);
    try {
      const configData = {
        ...values,
        reminderTime: values.reminderTime ? values.reminderTime.format("HH:mm") : "16:00",
        cutoffTime: values.cutoffTime ? values.cutoffTime.format("HH:mm") : "18:00",
      };

      const response = await fetch("/api/daily-activity-reminders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "save",
          config: configData,
        }),
      });

      const data = await response.json();

      if (data.success) {
        message.success("Configuration saved successfully");
        fetchData(); // Refresh data
      } else {
        message.error(data.message || "Failed to save configuration");
      }
    } catch (error) {
      console.error("Error saving config:", error);
      message.error("Failed to save configuration");
    } finally {
      setSaving(false);
    }
  };

  const triggerReminders = async () => {
    setTriggering(true);
    try {
      const response = await fetch("/api/daily-activity-reminders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "trigger" }),
      });

      const data = await response.json();

      if (data.success) {
        message.success(`Reminders triggered: ${data.data.remindersSent} emails sent`);
        fetchData(); // Refresh stats
      } else {
        message.error(data.message || "Failed to trigger reminders");
      }
    } catch (error) {
      console.error("Error triggering reminders:", error);
      message.error("Failed to trigger reminders");
    } finally {
      setTriggering(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getStatusColor = (isEnabled: boolean) => isEnabled ? "green" : "red";
  const getStatusText = (isEnabled: boolean) => isEnabled ? "Active" : "Inactive";

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title="Daily Activity Reminders"
        subtitle="Configure automated email reminders for daily activity reports"
        actions={[
          <Button
            key="trigger"
            type="primary"
            icon={<PlayCircleOutlined />}
            loading={triggering}
            onClick={triggerReminders}
            disabled={!config?.isEnabled}
          >
            Trigger Reminders
          </Button>,
          <Button
            key="refresh"
            icon={<ReloadOutlined />}
            onClick={fetchData}
            loading={loading}
          >
            Refresh
          </Button>,
        ]}
      />

      {/* Statistics Cards */}
      {stats && (
        <Row gutter={16} className="mb-6">
          <Col span={6}>
            <Card>
              <Statistic
                title="System Status"
                value={getStatusText(stats.isEnabled)}
                valueStyle={{ color: getStatusColor(stats.isEnabled) }}
                prefix={<ClockCircleOutlined />}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Total Recipients"
                value={stats.totalRecipients}
                prefix={<UserOutlined />}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Submitted Today"
                value={stats.submittedToday}
                valueStyle={{ color: "#3f8600" }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Pending Today"
                value={stats.pendingToday}
                valueStyle={{ color: stats.pendingToday > 0 ? "#cf1322" : "#3f8600" }}
              />
            </Card>
          </Col>
        </Row>
      )}

      {/* Configuration Form */}
      <Card title="Reminder Configuration" loading={loading}>
        <Form
          form={form}
          layout="vertical"
          onFinish={saveConfig}
          initialValues={{
            isEnabled: true,
            reminderTime: dayjs("16:00", "HH:mm"),
            cutoffTime: dayjs("18:00", "HH:mm"),
            excludeWeekends: true,
            excludeHolidays: true,
            excludeDates: [],
            sendFirstReminder: true,
            firstReminderOffset: 120,
            sendFinalReminder: true,
            finalReminderOffset: 30,
            sendToAllUsers: true,
            excludeRoles: [],
            includeRoles: [],
            emailSubject: "Daily Activity Report Reminder",
          }}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="isEnabled"
                label="Enable Reminders"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="emailSubject"
                label="Email Subject"
                rules={[{ required: true, message: "Email subject is required" }]}
              >
                <Input placeholder="Daily Activity Report Reminder" />
              </Form.Item>
            </Col>
          </Row>

          <Divider orientation="left">Schedule Settings</Divider>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="reminderTime"
                label="Reminder Time"
                rules={[{ required: true, message: "Reminder time is required" }]}
              >
                <TimePicker format="HH:mm" placeholder="16:00" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="cutoffTime"
                label="Cutoff Time"
                rules={[{ required: true, message: "Cutoff time is required" }]}
              >
                <TimePicker format="HH:mm" placeholder="18:00" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="excludeWeekends"
                label="Exclude Weekends"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="excludeHolidays"
                label="Exclude Holidays"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="sendToAllUsers"
                label="Send to All Users"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>
            </Col>
          </Row>

          <Divider orientation="left">Reminder Settings</Divider>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="sendFirstReminder"
                label="Send First Reminder"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="firstReminderOffset"
                label="First Reminder (minutes before cutoff)"
                rules={[{ required: true, message: "First reminder offset is required" }]}
              >
                <Input type="number" min={0} max={1440} placeholder="120" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="sendFinalReminder"
                label="Send Final Reminder"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="finalReminderOffset"
                label="Final Reminder (minutes before cutoff)"
                rules={[{ required: true, message: "Final reminder offset is required" }]}
              >
                <Input type="number" min={0} max={1440} placeholder="30" />
              </Form.Item>
            </Col>
          </Row>

          <Divider orientation="left">System Information</Divider>

          {stats && (
            <Row gutter={16}>
              <Col span={8}>
                <div className="text-sm text-gray-600">
                  <strong>Last Run:</strong> {stats.lastRunAt ? dayjs(stats.lastRunAt).format("DD/MM/YYYY HH:mm") : "Never"}
                </div>
              </Col>
              <Col span={8}>
                <div className="text-sm text-gray-600">
                  <strong>Next Run:</strong> {stats.nextRunAt ? dayjs(stats.nextRunAt).format("DD/MM/YYYY HH:mm") : "Not scheduled"}
                </div>
              </Col>
              <Col span={8}>
                <div className="text-sm text-gray-600">
                  <strong>Total Sent:</strong> {stats.totalRemindersSent}
                </div>
              </Col>
            </Row>
          )}

          <Divider />

          <Form.Item>
            <Space>
              <Button
                type="primary"
                htmlType="submit"
                icon={<SaveOutlined />}
                loading={saving}
              >
                Save Configuration
              </Button>
              <Button onClick={() => form.resetFields()}>
                Reset
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>

      {/* Information Alert */}
      <Alert
        message="How it works"
        description={
          <div className="space-y-2">
            <p>• Reminders are sent automatically at the configured time</p>
            <p>• First reminder: {config?.firstReminderOffset || 120} minutes before cutoff</p>
            <p>• Final reminder: {config?.finalReminderOffset || 30} minutes before cutoff</p>
            <p>• Only users who haven't submitted their report receive reminders</p>
            <p>• You can manually trigger reminders using the "Trigger Reminders" button</p>
          </div>
        }
        type="info"
        showIcon
      />
    </div>
  );
};

export default withRoleGuard(DailyActivityRemindersPage, ["admin"]); 