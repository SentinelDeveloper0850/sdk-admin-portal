"use client";

import { useEffect, useMemo, useState } from "react";

import { Button, Card, DatePicker, Form, Select, Space, Spin, Table, Typography, message } from "antd";
import dayjs from "dayjs";

import PageHeader from "@/app/components/page-header";
import { useDutyRoster } from "@/app/hooks/use-duty-roster";
import { withRoleGuard } from "@/utils/utils/with-role-guard";
import { ERoles } from "@/types/roles.enum";

const { Text } = Typography;

type StaffOption = {
  _id: string;
  name: string;
  userId?: string | null;
  branch?: string | null;
  position?: string | null;
};

type RosterResponse = {
  success: boolean;
  roster: null | {
    _id: string;
    date: string;
    note: string;
    staff: Array<{
      _id: string;
      name: string;
      initials?: string;
      userId: string | null;
      branch: string | null;
      position: string | null;
      isPortalUser: boolean;
    }>;
  };
  message?: string;
};

function normalizeName(firstNames?: string, lastName?: string) {
  return `${String(firstNames || "").trim()} ${String(lastName || "").trim()}`.trim();
}

function DutyRosterPage() {
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);
  const [date, setDate] = useState(dayjs());
  const [staff, setStaff] = useState<StaffOption[]>([]);
  const [rosterStaffIds, setRosterStaffIds] = useState<string[]>([]);

  const dateKey = date.format("YYYY-MM-DD");
  const { loading, roster, error: rosterError, refresh: refreshRoster } = useDutyRoster(dateKey);

  const fetchStaff = async () => {
    try {
      const res = await fetch("/api/staff", { cache: "no-store" });
      const json = await res.json();
      const list = Array.isArray(json?.staffMembers) ? json.staffMembers : [];
      setStaff(
        list.map((s: any) => ({
          _id: String(s._id),
          name: normalizeName(s.firstNames, s.lastName) || String(s._id),
          userId: s.userId ? String(s.userId) : null,
          branch: s.employment?.branch ?? null,
          position: s.employment?.position ?? null,
        }))
      );
    } catch {
      // non-fatal
    }
  };

  const saveRoster = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);

      const res = await fetch("/api/roster", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: dateKey,
          staffMemberIds: rosterStaffIds,
          note: String(values?.note || ""),
        }),
      });
      const json = await res.json();
      if (!json?.success) throw new Error(json?.message || "Failed to save roster");
      message.success("Roster saved");
      await refreshRoster();
    } catch (e: any) {
      message.error(e?.message || "Failed to save roster");
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  useEffect(() => {
    // Sync local form state when roster changes
    const ids = roster?.staff?.map((s) => String(s._id)) || [];
    setRosterStaffIds(ids);
    form.setFieldsValue({ note: roster?.note || "" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roster]);

  const staffOptions = useMemo(() => staff.slice().sort((a, b) => a.name.localeCompare(b.name)), [staff]);

  const rosterRows = useMemo(() => {
    const byId = new Map(staffOptions.map((s) => [s._id, s]));
    return rosterStaffIds
      .map((id) => byId.get(id))
      .filter(Boolean)
      .map((s) => ({
        _id: s!._id,
        name: s!.name,
        branch: s!.branch ?? "—",
        position: s!.position ?? "—",
        portal: s!.userId ? "Yes" : "No",
      }));
  }, [rosterStaffIds, staffOptions]);

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title="Duty Roster"
        subtitle="Select who was on duty for a given day (used to compute compliance expectations)"
        actions={[
          <Space key="actions">
            <Button onClick={refreshRoster}>Refresh</Button>
            <Button type="primary" className="text-black" onClick={saveRoster} loading={saving}>
              Save Roster
            </Button>
          </Space>,
        ]}
      />

      <Card size="small">
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="min-w-[240px]">
              <div className="text-xs text-gray-500 mb-1">Date</div>
              <DatePicker value={date} onChange={(d) => d && setDate(d)} />
            </div>
            <div className="flex-1 min-w-[320px]">
              <div className="text-xs text-gray-500 mb-1">On-duty staff</div>
              <Select
                mode="multiple"
                value={rosterStaffIds}
                onChange={setRosterStaffIds}
                placeholder="Select staff members on duty"
                optionFilterProp="label"
                style={{ width: "100%" }}
                options={staffOptions.map((s) => ({
                  value: s._id,
                  label: `${s.name}${s.branch ? ` • ${s.branch}` : ""}${s.position ? ` • ${s.position}` : ""}${s.userId ? "" : " • (no portal user)"}`,
                }))}
              />
              <Text type="secondary" className="block mt-2">
                Only staff linked to a portal user can be “expected to submit” for submission-based modules (e.g. Daily Activity, Cashup).
              </Text>
            </div>
          </div>

          <Form form={form} layout="vertical">
            <Form.Item name="note" label="Note (optional)">
              <Select
                showSearch={false}
                placeholder="Optional note"
                options={[
                  { value: "", label: "—" },
                  { value: "Public holiday", label: "Public holiday" },
                  { value: "Training day", label: "Training day" },
                  { value: "Reduced staff", label: "Reduced staff" },
                ]}
              />
            </Form.Item>
          </Form>
        </div>
      </Card>

      <Card size="small" title={`Roster for ${date.format("DD MMM YYYY")}`}>
        {loading ? (
          <div className="flex justify-center py-10">
            <Spin />
          </div>
        ) : rosterError ? (
          <div className="text-red-600 font-medium">{rosterError}</div>
        ) : (
          <Table
            size="small"
            rowKey="_id"
            dataSource={rosterRows}
            columns={[
              { title: "Name", dataIndex: "name", key: "name" },
              { title: "Branch", dataIndex: "branch", key: "branch" },
              { title: "Position", dataIndex: "position", key: "position" },
              { title: "Portal user", dataIndex: "portal", key: "portal" },
            ]}
            pagination={false}
            locale={{ emptyText: "No roster saved for this date yet." }}
          />
        )}
      </Card>
    </div>
  );
}

export default withRoleGuard(DutyRosterPage, [ERoles.Admin, ERoles.HRManager]);

