"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

import {
  CheckCircleOutlined,
  DeleteOutlined,
  EditOutlined,
  MoreOutlined,
  PlusOutlined,
  ReloadOutlined,
  RollbackOutlined,
} from "@ant-design/icons";
import { Avatar, Button, Switch } from "@nextui-org/react";
import {
  Button as AntButton,
  Col,
  DatePicker,
  Drawer,
  Dropdown,
  Form,
  Input,
  Row,
  Select,
  Space,
  Table,
  Tag,
} from "antd";
import axios from "axios";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import sweetAlert from "sweetalert";

import PageHeader from "@/app/components/page-header";
import { cn } from "@/lib/utils";

dayjs.extend(relativeTime);

type TaskStatus =
  | "BACKLOG"
  | "TODO"
  | "IN_PROGRESS"
  | "BLOCKED"
  | "DONE"
  | "CANCELED";
type TaskPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

type Task = {
  _id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueAt?: string | null;
  completedAt?: string | null;
  assigneeUserId?: string | null;
  createdByUserId: string;
  tags?: string[];
  isArchived?: boolean;
  createdAt: string;
  updatedAt: string;
};

const STATUS_OPTIONS: { label: string; value: TaskStatus }[] = [
  { label: "Backlog", value: "BACKLOG" },
  { label: "To Do", value: "TODO" },
  { label: "In Progress", value: "IN_PROGRESS" },
  { label: "Blocked", value: "BLOCKED" },
  { label: "Done", value: "DONE" },
  { label: "Canceled", value: "CANCELED" },
];

const PRIORITY_OPTIONS: { label: string; value: TaskPriority }[] = [
  { label: "Low", value: "LOW" },
  { label: "Medium", value: "MEDIUM" },
  { label: "High", value: "HIGH" },
  { label: "Urgent", value: "URGENT" },
];

function statusTagColor(status: TaskStatus) {
  switch (status) {
    case "BACKLOG":
      return "default";
    case "TODO":
      return "blue";
    case "IN_PROGRESS":
      return "processing";
    case "BLOCKED":
      return "volcano";
    case "DONE":
      return "green";
    case "CANCELED":
      return "red";
    default:
      return "default";
  }
}

function priorityTagColor(priority: TaskPriority) {
  switch (priority) {
    case "LOW":
      return "default";
    case "MEDIUM":
      return "blue";
    case "HIGH":
      return "gold";
    case "URGENT":
      return "red";
    default:
      return "default";
  }
}

function isOverdue(task: Task) {
  if (!task.dueAt) return false;
  if (task.status === "DONE" || task.status === "CANCELED") return false;
  return dayjs(task.dueAt).isBefore(dayjs(), "minute");
}

export default function TasksPage() {
  // #region States
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [users, setUsers] = useState<any[]>([]);
  const [focusedId, setFocusedId] = useState<string | null>(null);

  const [showArchived, setShowArchived] = useState<boolean>(false);
  const [viewType, setViewType] = useState<"compact" | "full">("full");

  const [createDrawerOpen, setCreateDrawerOpen] = useState<boolean>(false);
  const [editDrawerOpen, setEditDrawerOpen] = useState<boolean>(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const [searchText, setSearchText] = useState<string>("");
  // #endregion States

  // #region Hooks
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  // #endregion Hooks

  const [form] = Form.useForm();
  const focusId = searchParams.get("focus");

  // #region Refs
  const highlightTimeoutRef = useRef<number | null>(null);
  const consumedFocusRef = useRef<string | null>(null);
  // #endregion Refs

  // #region Handlers
  const toggleViewType = () => {
    setViewType((prev) => (prev === "compact" ? "full" : "compact"));
  };

  const fetchTasks = async () => {
    try {
      setLoading(true);
      setError(null);

      const url = `/api/tasks?archived=${showArchived ? "true" : "false"}&limit=100`;
      const res = await fetch(url, { credentials: "include" });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setError(err?.error || "Failed to fetch tasks");
        return;
      }

      const data = await res.json();
      setTasks(data.tasks || []);
    } catch (e) {
      console.error(e);
      setError("An error occurred while fetching tasks.");
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch(`/api/users`, { credentials: "include" });
      if (!res.ok) return;
      const data = await res.json();

      // Your users endpoint sometimes returns {users: []} or raw array in older code.
      const list = Array.isArray(data) ? data : (data.users ?? []);
      setUsers(list);
    } catch (e) {
      console.error("Failed to fetch users for task assignment", e);
    }
  };

  function clearFocusParam() {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("focus");

    const next = params.toString();
    router.replace(next ? `${pathname}?${next}` : pathname, { scroll: false });
  }

  const handleSubmitForm = () => {
    form.submit();
  };

  const resetAndCloseCreate = () => {
    form.resetFields();
    setCreateDrawerOpen(false);
  };

  const resetAndCloseEdit = () => {
    form.resetFields();
    setEditDrawerOpen(false);
    setEditingTask(null);
    setFocusedId(null); // ✅ clear highlight when closing drawer
    if (highlightTimeoutRef.current) {
      window.clearTimeout(highlightTimeoutRef.current);
      highlightTimeoutRef.current = null;
    }
  };

  const handleCreate = async (values: any) => {
    try {
      const payload = {
        title: values.title?.trim(),
        description: values.description?.trim() || undefined,
        status: values.status,
        priority: values.priority,
        dueAt: values.dueAt ? values.dueAt.toISOString() : undefined,
        assigneeUserId: values.assigneeUserId || undefined,
        tags: values.tags
          ? String(values.tags)
              .split(",")
              .map((t: string) => t.trim())
              .filter(Boolean)
          : [],
      };

      const res = await axios.post("/api/tasks", JSON.stringify(payload), {
        headers: { "Content-Type": "application/json" },
        withCredentials: true,
      });

      if (res.status !== 201) {
        sweetAlert({
          title: "Failed to create task!",
          text: res.data?.error,
          icon: "error",
        });
        return;
      }

      sweetAlert({ title: "Task created!", icon: "success", timer: 2000 });

      // add to top for instant feedback
      setTasks((prev) => [res.data.task, ...prev]);

      resetAndCloseCreate();
    } catch (err: any) {
      console.error(err);
      sweetAlert({
        title: "Failed to create task!",
        text: err?.response?.data?.error || "Something went wrong",
        icon: "error",
      });
    }
  };

  const openEdit = (record: Task) => {
    setFocusedId(record._id);
    setEditingTask(record);

    form.setFieldsValue({
      title: record.title,
      description: record.description,
      status: record.status,
      priority: record.priority,
      assigneeUserId: record.assigneeUserId ?? undefined,
      dueAt: record.dueAt ? dayjs(record.dueAt) : null,
      tags: (record.tags || []).join(", "),
    });

    setEditDrawerOpen(true);
  };

  const handleUpdate = async (values: any) => {
    if (!editingTask?._id) return;

    try {
      const payload = {
        title: values.title?.trim(),
        description: values.description?.trim() || "",
        status: values.status,
        priority: values.priority,
        dueAt: values.dueAt ? values.dueAt.toISOString() : null,
        assigneeUserId: values.assigneeUserId || null,
        tags: values.tags
          ? String(values.tags)
              .split(",")
              .map((t: string) => t.trim())
              .filter(Boolean)
          : [],
      };

      const res = await axios.patch(
        `/api/tasks/${editingTask._id}`,
        JSON.stringify(payload),
        {
          headers: { "Content-Type": "application/json" },
          withCredentials: true,
        }
      );

      if (res.status !== 200) {
        sweetAlert({
          title: "Failed to update task!",
          text: res.data?.error,
          icon: "error",
        });
        return;
      }

      sweetAlert({ title: "Task updated!", icon: "success", timer: 1500 });

      setTasks((prev) =>
        prev.map((t) => (t._id === editingTask._id ? res.data.task : t))
      );

      resetAndCloseEdit();
    } catch (err: any) {
      console.error(err);
      sweetAlert({
        title: "Failed to update task!",
        text: err?.response?.data?.error || "Something went wrong",
        icon: "error",
      });
    }
  };

  const toggleDone = async (record: Task) => {
    try {
      const goingDone = record.status !== "DONE";
      const confirmed = await sweetAlert({
        title: goingDone ? "Mark task as done?" : "Reopen task?",
        text: goingDone
          ? "This will mark the task as DONE."
          : "This will move the task back to TODO.",
        icon: "warning",
        buttons: ["Cancel", goingDone ? "Yes, mark done" : "Yes, reopen"],
        dangerMode: false,
      });

      if (!confirmed) return;

      setLoading(true);

      const res = await fetch(`/api/tasks/${record._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          status: goingDone ? "DONE" : "TODO",
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        sweetAlert({
          title: "Failed",
          text: data?.error || "Could not update task",
          icon: "error",
        });
        return;
      }

      setTasks((prev) =>
        prev.map((t) => (t._id === record._id ? data.task : t))
      );
      sweetAlert({
        title: goingDone ? "Marked as done" : "Reopened",
        icon: "success",
        timer: 1500,
      });
    } catch (e) {
      console.error(e);
      sweetAlert({
        title: "Error",
        text: "Could not update task",
        icon: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleArchive = async (record: Task) => {
    try {
      const goingArchive = !record.isArchived;

      const confirmed = await sweetAlert({
        title: goingArchive ? "Archive task?" : "Unarchive task?",
        text: goingArchive
          ? "This will hide the task from the default view."
          : "This will restore the task to the active list.",
        icon: "warning",
        buttons: ["Cancel", goingArchive ? "Yes, archive" : "Yes, unarchive"],
        dangerMode: goingArchive,
      });

      if (!confirmed) return;

      setLoading(true);

      const res = await fetch(`/api/tasks/${record._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ isArchived: goingArchive }),
      });

      const data = await res.json();

      if (!res.ok) {
        sweetAlert({
          title: "Failed",
          text: data?.error || "Could not update task",
          icon: "error",
        });
        return;
      }

      // If we’re currently filtering archived vs not, remove it from the table immediately
      setTasks((prev) => prev.filter((t) => t._id !== record._id));

      sweetAlert({
        title: goingArchive ? "Task archived" : "Task unarchived",
        icon: "success",
        timer: 1500,
      });
    } catch (e) {
      console.error(e);
      sweetAlert({
        title: "Error",
        text: "Could not update task",
        icon: "error",
      });
    } finally {
      setLoading(false);
    }
  };
  // #endregion Handlers

  // #region Effects
  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    fetchTasks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showArchived]);

  useEffect(() => {
    if (!focusId || tasks.length === 0) return;
    if (editDrawerOpen) return; // don't auto-open again
    if (consumedFocusRef.current === focusId) return;

    consumedFocusRef.current = focusId;

    const record = tasks.find((t) => t._id === focusId);
    if (!record) return;

    openEdit(record);

    // highlight + scroll
    setFocusedId(focusId);
    document.getElementById(`task-${focusId}`)?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });

    // consume the param so it doesn't re-trigger
    clearFocusParam();

    // schedule highlight removal
    if (highlightTimeoutRef.current)
      window.clearTimeout(highlightTimeoutRef.current);
    highlightTimeoutRef.current = window.setTimeout(() => {
      setFocusedId(null);
      highlightTimeoutRef.current = null;
    }, 2500);

    // cleanup for THIS effect run
    return () => {
      if (highlightTimeoutRef.current) {
        window.clearTimeout(highlightTimeoutRef.current);
        highlightTimeoutRef.current = null;
      }
    };
  }, [focusId, tasks, editDrawerOpen]);

  useEffect(() => {
    if (!editDrawerOpen) {
      setFocusedId(null);
    }
  }, [editDrawerOpen]);
  // #endregion Effects

  // #region Memoized values
  const filteredTasks = useMemo(() => {
    if (!searchText.trim()) return tasks;

    const q = searchText.trim().toLowerCase();
    return tasks.filter((t) => {
      const hay = [
        t.title,
        t.description || "",
        t.status,
        t.priority,
        ...(t.tags || []),
      ]
        .join(" ")
        .toLowerCase();

      return hay.includes(q);
    });
  }, [tasks, searchText]);

  const usersById = useMemo(() => {
    const m = new Map<string, any>();
    for (const u of users) m.set(String(u._id ?? u.id), u);
    return m;
  }, [users]);

  const columns = useMemo(() => {
    return [
      {
        title: "Title",
        dataIndex: "title",
        key: "title",
        width: 500,
        sorter: (a: Task, b: Task) => a.title.localeCompare(b.title),
        render: (value: string, record: Task) => (
          <div className="flex w-full flex-col">
            <div className="flex items-center gap-2">
              <span
                className={
                  isOverdue(record)
                    ? "font-semibold text-red-600"
                    : "font-medium"
                }
              >
                {value}
              </span>
              {isOverdue(record) && <Tag color="red">Overdue</Tag>}
            </div>
            {record.description && (
              <span
                className={cn(
                  "text-xs text-gray-500",
                  viewType === "compact" ? "line-clamp-1" : "line-clamp-3"
                )}
              >
                {record.description}
              </span>
            )}
          </div>
        ),
      },
      {
        title: "Assignee",
        dataIndex: "assigneeUserId",
        key: "assigneeUserId",
        render: (value: string | null | undefined) => {
          if (!value) return <span className="text-gray-400">Unassigned</span>;
          const u = usersById.get(String(value));
          return (
            <div className="flex items-center gap-4">
              {u?.avatarUrl && (
                <Avatar src={u?.avatarUrl} size="sm" isBordered radius="full" />
              )}
              <span className="text-sm">
                {u?.name ?? u?.email ?? "Unknown"}
              </span>
            </div>
          );
        },
        sorter: (a: Task, b: Task) =>
          String(a.assigneeUserId || "").localeCompare(
            String(b.assigneeUserId || "")
          ),
      },
      {
        title: "Status",
        dataIndex: "status",
        key: "status",
        render: (value: TaskStatus) => (
          <Tag color={statusTagColor(value)}>{value.replaceAll("_", " ")}</Tag>
        ),
        sorter: (a: Task, b: Task) => a.status.localeCompare(b.status),
      },
      {
        title: "Priority",
        dataIndex: "priority",
        key: "priority",
        render: (value: TaskPriority) => (
          <Tag color={priorityTagColor(value)}>{value}</Tag>
        ),
        sorter: (a: Task, b: Task) => a.priority.localeCompare(b.priority),
      },
      {
        title: "Due",
        dataIndex: "dueAt",
        key: "dueAt",
        render: (value: string, record: Task) =>
          value ? (
            <span
              className={isOverdue(record) ? "font-semibold text-red-600" : ""}
            >
              {dayjs(value).fromNow()}
            </span>
          ) : (
            <span className="text-gray-400">-</span>
          ),
        sorter: (a: Task, b: Task) =>
          new Date(a.dueAt || 0).getTime() - new Date(b.dueAt || 0).getTime(),
      },
      {
        title: "Updated",
        dataIndex: "updatedAt",
        key: "updatedAt",
        render: (value: string) => (
          <span>{value ? dayjs(value).fromNow() : "-"}</span>
        ),
        sorter: (a: Task, b: Task) =>
          new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime(),
      },
      {
        title: "Actions",
        key: "actions",
        render: (_: any, record: Task) => (
          <Dropdown
            trigger={["click"]}
            menu={{
              items: [
                {
                  key: "edit",
                  icon: <EditOutlined />,
                  label: "Edit",
                  onClick: (e) => {
                    // prevent row-click open firing twice
                    e.domEvent?.stopPropagation?.();
                    openEdit(record);
                  },
                },
                {
                  key: "toggle-done",
                  icon:
                    record.status === "DONE" ? (
                      <RollbackOutlined />
                    ) : (
                      <CheckCircleOutlined />
                    ),
                  label:
                    record.status === "DONE" ? "Reopen (To Do)" : "Mark Done",
                  onClick: (e) => {
                    e.domEvent?.stopPropagation?.();
                    toggleDone(record);
                  },
                },
                {
                  key: "archive",
                  icon: <DeleteOutlined />,
                  danger: !record.isArchived,
                  label: record.isArchived ? "Unarchive" : "Archive",
                  onClick: (e) => {
                    e.domEvent?.stopPropagation?.();
                    toggleArchive(record);
                  },
                },
              ],
            }}
          >
            <AntButton
              icon={<MoreOutlined />}
              onClick={(e) => e.stopPropagation()}
            />
          </Dropdown>
        ),
      },
    ];
  }, [viewType, usersById]);

  const userOptions = useMemo(() => {
    return (users || []).map((u: any) => ({
      label: u?.name
        ? `${u.name} (${u.email ?? "no email"})`
        : (u.email ?? "Unknown"),
      value: u._id ?? u.id,
    }));
  }, [users]);
  // #endregion Memoized values

  return (
    <div style={{ padding: "20px" }}>
      <PageHeader
        title="Manage Tasks"
        subtitle="Create, update, and track tasks across your team"
        actions={[
          <div className="flex items-center gap-4" key="actions">
            <div className="flex items-center gap-2">
              <span className="text-sm">Compact View</span>
              <Switch
                size="sm"
                isSelected={viewType === "compact"}
                onValueChange={() => toggleViewType()}
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm">Show Archived</span>
              <Switch
                size="sm"
                isSelected={showArchived}
                onValueChange={setShowArchived}
              />
            </div>

            <Input
              placeholder="Search tasks..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: 260 }}
            />

            <AntButton
              icon={<ReloadOutlined />}
              loading={loading}
              onClick={fetchTasks}
            >
              Refresh
            </AntButton>

            <AntButton
              onClick={() => {
                form.resetFields();
                form.setFieldsValue({ status: "TODO", priority: "MEDIUM" });
                setCreateDrawerOpen(true);
              }}
            >
              <PlusOutlined /> New Task
            </AntButton>
          </div>,
        ]}
      />

      <Table
        rowKey="_id"
        bordered
        size="small"
        loading={loading}
        dataSource={filteredTasks}
        rowClassName={(record) =>
          cn(
            "cursor-pointer hover:bg-gray-100",
            record._id === focusedId && "bg-yellow-100"
          )
        }
        onRow={(record) => ({
          id: `task-${record._id}`,
          onClick: () => openEdit(record),
        })}
        columns={columns}
        expandable={{
          expandedRowRender: (record: Task) =>
            record.tags && record.tags.length ? (
              <div className="ml-0 gap-1 whitespace-pre-wrap p-0 text-gray-700">
                🏷️<strong className="ml-1 mr-2">Tags:</strong>
                {record.tags.map((tag: string, idx: number) => (
                  <Tag key={`${record._id}-tag-${idx}`} className="w-fit">
                    {tag}
                  </Tag>
                ))}
              </div>
            ) : (
              <i className="text-gray-400">No tags</i>
            ),
          rowExpandable: (record: Task) =>
            !!record.tags && record.tags.length > 0,
        }}
      />

      {/* CREATE DRAWER */}
      <Drawer
        title="Create Task"
        placement="right"
        closable={false}
        open={createDrawerOpen}
        onClose={resetAndCloseCreate}
        width="50%"
        footer={
          <Space>
            <Button color="danger" size="md" onClick={resetAndCloseCreate}>
              Cancel
            </Button>
            <Button color="primary" size="md" onClick={handleSubmitForm}>
              Submit
            </Button>
          </Space>
        }
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleCreate}
          initialValues={{ status: "TODO", priority: "MEDIUM" }}
        >
          <Row gutter={16}>
            <Col span={24}>
              <Form.Item
                label="Title"
                name="title"
                rules={[{ required: true, message: "Required" }]}
              >
                <Input placeholder="e.g. Confirm family details for Saturday funeral" />
              </Form.Item>
            </Col>

            <Col span={24}>
              <Form.Item label="Description" name="description">
                <Input.TextArea rows={4} placeholder="Optional details..." />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item label="Assignee" name="assigneeUserId">
                <Select
                  allowClear
                  showSearch
                  placeholder="Assign to..."
                  options={userOptions}
                  optionFilterProp="label"
                />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item
                label="Status"
                name="status"
                rules={[{ required: true }]}
              >
                <Select options={STATUS_OPTIONS} />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item
                label="Priority"
                name="priority"
                rules={[{ required: true }]}
              >
                <Select options={PRIORITY_OPTIONS} />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item label="Due Date" name="dueAt">
                <DatePicker className="w-full" />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item
                label="Tags"
                name="tags"
                tooltip="Comma-separated, e.g. urgent, admin, family"
              >
                <Input placeholder="urgent, admin, family" />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Drawer>

      {/* EDIT DRAWER */}
      <Drawer
        title="Update Task"
        placement="right"
        closable={false}
        open={editDrawerOpen}
        onClose={resetAndCloseEdit}
        width="50%"
        footer={
          <Space>
            <Button color="danger" size="md" onClick={resetAndCloseEdit}>
              Cancel
            </Button>
            <Button color="primary" size="md" onClick={() => form.submit()}>
              Save Changes
            </Button>
          </Space>
        }
      >
        <Form form={form} layout="vertical" onFinish={handleUpdate}>
          <Row gutter={16}>
            <Col span={24}>
              <Form.Item
                label="Title"
                name="title"
                rules={[{ required: true, message: "Required" }]}
              >
                <Input />
              </Form.Item>
            </Col>

            <Col span={24}>
              <Form.Item label="Description" name="description">
                <Input.TextArea rows={4} />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item label="Assignee" name="assigneeUserId">
                <Select
                  allowClear
                  showSearch
                  placeholder="Assign to..."
                  options={userOptions}
                  optionFilterProp="label"
                />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item
                label="Status"
                name="status"
                rules={[{ required: true }]}
              >
                <Select options={STATUS_OPTIONS} />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item
                label="Priority"
                name="priority"
                rules={[{ required: true }]}
              >
                <Select options={PRIORITY_OPTIONS} />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item label="Due Date" name="dueAt">
                <DatePicker className="w-full" />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item label="Tags" name="tags">
                <Input placeholder="urgent, admin, family" />
              </Form.Item>
            </Col>
          </Row>

          {editingTask && (
            <div className="mt-4 text-xs text-gray-500">
              <div>
                <strong>Created:</strong>{" "}
                {dayjs(editingTask.createdAt).fromNow()}
              </div>
              <div>
                <strong>Last updated:</strong>{" "}
                {dayjs(editingTask.updatedAt).fromNow()}
              </div>
              {editingTask.completedAt ? (
                <div>
                  <strong>Completed:</strong>{" "}
                  {dayjs(editingTask.completedAt).fromNow()}
                </div>
              ) : null}
            </div>
          )}
        </Form>
      </Drawer>
    </div>
  );
}
