"use client";

import React, { useState } from "react";



import { Avatar, Button, Divider, Input, Select, SelectItem, Spinner, Switch } from "@nextui-org/react";
import { Drawer, message } from "antd";
import dayjs from "dayjs";



import PageHeader from "@/app/components/page-header";
import { ThemeSwitcher } from "@/app/components/theme-switcher";
import { useAuth } from "@/context/auth-context";


const MAX_FILE_SIZE_MB = 2;

const ProfilePage: React.FC = () => {
  const { user, setUser, userId } = useAuth();
  const avatarUrl = user?.avatarUrl || "/default-avatar.png";

  const [editOpen, setEditOpen] = useState(false);
  const [name, setName] = useState(user?.name || "");
  const [avatar, setAvatar] = useState(user?.avatarUrl || "");
  const [theme, setTheme] = useState<"light" | "dark" | "system">(
    user?.preferences?.theme || "system"
  );
  const [uploading, setUploading] = useState(false);

  const handleSave = async () => {
    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        avatarUrl: avatar,
        preferences: { theme },
      }),
    });
    const json = await res.json();
    if (json.success) {
      setUser(json.user);
      setEditOpen(false);
    } else {
      message.error(json.message || "Something went wrong");
    }
  };

  const handleAvatarUpload = async (file: File) => {
    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      message.warning("Image must be under 2MB.");
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/api/upload/avatar", {
      method: "POST",
      body: formData,
    });

    const json = await res.json();
    setUploading(false);

    if (json.success) {
      setAvatar(json.url);
      message.success("Avatar uploaded successfully");
      await handleSave(); // auto-save after successful upload
    } else {
      message.error(json.message || "Something went wrong");
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handleAvatarUpload(file);
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6">
      <PageHeader
        title="My Profile"
        subtitle="Manage your user details and preferences"
      />

      <div className="grid grid-cols-1 gap-12 md:grid-cols-2">
        {/* Profile Section */}
        <section>
          <div className="mb-6 flex items-center gap-4">
            <Avatar
              src={avatarUrl}
              size="lg"
              isBordered
              radius="full"
              color="primary"
            />
            <div>
              <h2 className="text-xl font-semibold">
                {user?.name ?? "Unnamed"}
              </h2>
              <p className="text-sm text-gray-400">
                {user?.email ?? "No email"}
              </p>
            </div>
          </div>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between text-gray-400">
              <span>Role</span>
              <span className="dark:text-white">{user?.role ?? "N/A"}</span>
            </div>
            <div className="flex justify-between text-gray-400">
              <span>Status</span>
              <span
                className={
                  user?.status === "Active" ? "text-green-500" : "text-red-500"
                }
              >
                {user?.status ?? "Unknown"}
              </span>
            </div>
            {user?.createdAt && (
              <div className="flex justify-between text-gray-400">
                <span>Joined</span>
                <span className="dark:text-white">
                  {dayjs(user.createdAt).format("D MMM YYYY")}
                </span>
              </div>
            )}
          </div>

          <div className="mt-6">
            <Button
              onClick={() => setEditOpen(true)}
              color="primary"
            >
              Edit Profile
            </Button>
          </div>
        </section>

        {/* Preferences Section */}
        <section>
          <h2 className="mb-4 text-lg font-semibold">Preferences</h2>
          <div className="space-y-6 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Theme</span>
              <ThemeSwitcher />
            </div>
            {/* <Divider />
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Email Notifications</span>
              <Switch isSelected={true} disabled />
            </div> */}
            <Divider />
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Language</span>
              <span className="text-xs dark:text-white">English (default)</span>
            </div>
          </div>
        </section>
      </div>

      <Drawer
        title="Edit Profile"
        placement="right"
        width={400}
        onClose={() => setEditOpen(false)}
        open={editOpen}
      >
        <div className="space-y-4">
          <Input
            label="Full Name"
            value={name}
            onValueChange={setName}
            fullWidth
          />

          {/* Avatar Upload */}
          <div
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            className="rounded border border-dashed border-gray-300 p-4 text-center dark:border-gray-600"
          >
            <p className="text-sm text-gray-400">
              Drag & drop your avatar here
            </p>
            <p className="text-xs text-gray-500">Max file size: 2MB</p>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleAvatarUpload(file);
              }}
              className="mt-2 w-full text-sm"
            />
            {uploading && <Spinner className="mt-2" label="Uploading..." />}
            {avatar && !uploading && (
              <img
                src={avatar}
                alt="Uploaded Avatar"
                className="mx-auto mt-4 h-20 w-20 rounded-full object-cover"
              />
            )}
          </div>

          <Select
            label="Theme Preference"
            selectedKeys={[theme]}
            onSelectionChange={(keys) => {
              const selected = Array.from(keys)[0];
              if (typeof selected === "string") {
                setTheme(selected as "light" | "dark" | "system");
              }
            }}
            fullWidth
          >
            <SelectItem key="light">Light</SelectItem>
            <SelectItem key="dark">Dark</SelectItem>
            <SelectItem key="system">System</SelectItem>
          </Select>

          <div className="flex justify-end gap-2 pt-4">
            <Button onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button color="primary" onClick={handleSave} disabled={uploading}>
              Save
            </Button>
          </div>
        </div>
      </Drawer>
    </div>
  );
};

export default ProfilePage;