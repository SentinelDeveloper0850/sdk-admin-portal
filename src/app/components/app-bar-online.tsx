"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";

import {
  Avatar,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
  Navbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
  NavbarMenu,
  NavbarMenuToggle,
} from "@nextui-org/react";

import { NotificationBell } from "@/app/components/notifications/notification-bell";
import Presence from "@/components/presence";
import { useAuth } from "@/context/auth-context";
import { logout } from "@/utils/auth";

import SideNavBar from "./side-navbar";
import { TaskBell } from "./tasks/task-bell";
import { ThemeSwitcher } from "./theme-switcher";

const getSessionLabel = (session: any) => {
  if (!session) return "⚠ Set work session";
  if (session.mode === "REMOTE") return "🌍 Remote";

  // Prefer names if you store them later
  const region = session.regionName ?? session.region ?? "On-site";
  const branch = session.branchName ?? session.branch ?? "";

  return branch ? `📍 ${region} • ${branch}` : `📍 ${region}`;
};

const getSessionPillClasses = (session: any) => {
  return session
    ? "border border-[#ffac00]/40 bg-[#ffac00]/10 text-[#ffdd99] hover:bg-[#ffac00]/15"
    : "border border-red-400/40 bg-red-400/10 text-red-200 hover:bg-red-400/15";
};

export default function AppBarOnline() {
  const router = useRouter();
  const { user, setUser, session, clearSession } = useAuth(); // ✅ add session + clearSession
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = () => {
    // 1) Clear in-memory state FIRST (prevents redirect to /session)
    setUser(null);
    clearSession?.();

    // 2) Clear stored token/cookie (whatever logout() does)
    logout();

    // 3) Then navigate
    router.push("/auth/signin");
  };

  const avatarUrl = user?.avatarUrl || "/default-avatar.png";
  const sessionLabel = getSessionLabel(session);

  return (
    <Navbar
      maxWidth="full"
      className="shadow-sm dark:bg-[#2e2e2e] dark:text-[#f1f1f1]"
      onMenuOpenChange={(isOpen) => setIsMenuOpen(isOpen)}
    >
      <NavbarContent justify="start">
        <NavbarMenuToggle
          aria-label={isMenuOpen ? "Close menu" : "Open menu"}
          className="md:hidden"
        />
        <NavbarBrand>
          <Image
            src="/logo.png"
            alt="logo"
            width={60}
            height={60}
            className="h-full p-2"
          />
        </NavbarBrand>
      </NavbarContent>

      <NavbarContent justify="center">
        <p className="font-normal uppercase tracking-wider text-inherit">
          Somdaka Funeral Services - Administration Portal
        </p>
      </NavbarContent>

      <NavbarContent justify="end">
        <NavbarItem className="hidden md:flex">
          <Presence showBadge={false} />
        </NavbarItem>

        <NavbarItem className="hidden md:flex">
          <div className="flex items-center gap-2">
            {/* ✅ Session pill */}
            <Dropdown placement="bottom-end">
              <DropdownTrigger>
                <button
                  type="button"
                  className={[
                    "rounded-full px-3 py-1 text-xs font-semibold transition-colors",
                    getSessionPillClasses(session),
                  ].join(" ")}
                  title="Work session"
                >
                  {sessionLabel}
                </button>
              </DropdownTrigger>

              <DropdownMenu aria-label="Session Actions" variant="flat">
                <DropdownItem
                  key="change"
                  onClick={() => router.push("/session")}
                >
                  Change work session
                </DropdownItem>

                {/* {hasSession == true ? (
                  <DropdownItem
                    key="clear"
                    className="text-danger"
                    color="danger"
                    onClick={() => clearSession?.()}
                  >
                    Clear session
                  </DropdownItem>
                ) : <></>} */}
              </DropdownMenu>
            </Dropdown>

            <ThemeSwitcher type="button" />
            <NotificationBell />
            <TaskBell />
          </div>
        </NavbarItem>

        <NavbarItem className="hidden md:flex">
          <Dropdown placement="bottom-end">
            <DropdownTrigger>
              <Avatar
                isBordered
                as="button"
                className="transition-transform"
                size="sm"
                src={avatarUrl}
              />
            </DropdownTrigger>
            <DropdownMenu aria-label="Profile Actions" variant="flat">
              <DropdownItem
                key="user"
                className="h-14 gap-2 rounded-b-none border-b hover:bg-white"
              >
                <p className="font-semibold">{user?.name ?? "Unknown User"}</p>
                <p className="text-xs text-gray-500">
                  {user?.email ?? "Unknown Email"}
                </p>
                <p className="pb-2 text-[12px] text-gray-500">
                  {user?.phone ?? "Unknown Phone"}
                </p>
              </DropdownItem>

              <DropdownItem key="profile" color="primary" href="/account/profile">
                Profile
              </DropdownItem>
              <DropdownItem key="logout" color="danger" onClick={handleLogout}>
                Logout
              </DropdownItem>
            </DropdownMenu>
          </Dropdown>
        </NavbarItem>
      </NavbarContent>

      <NavbarMenu>
        <div className="px-2 py-4">
          <div className="mb-4">
            <ThemeSwitcher showLabel />
          </div>
          <SideNavBar />
        </div>
      </NavbarMenu>
    </Navbar>
  );
}
