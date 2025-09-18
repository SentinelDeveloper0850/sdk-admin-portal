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
  NavbarMenuToggle
} from "@nextui-org/react";
import { Tag } from "antd";

import { logout } from "@/utils/auth";

import { useAuth } from "@/context/auth-context";

import Presence from "@/components/presence";
import SideNavBar from "./side-navbar";
import { ThemeSwitcher } from "./theme-switcher";

export default function AppBarOnline() {
  const router = useRouter();
  const { user } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = () => {
    logout(); // Clear the token
    router.push("/auth/signin"); // Redirect to login page
  };

  const avatarUrl = user?.avatarUrl || "/default-avatar.png";

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
          <Presence />
        </NavbarItem>
        <NavbarItem className="hidden md:flex">
          <ThemeSwitcher />
        </NavbarItem>
        <NavbarItem className="hidden md:flex">
          <Dropdown placement="bottom-end">
            <DropdownTrigger>
              <Avatar
                isBordered
                as="button"
                className="transition-transform"
                size="sm"
                src={user?.avatarUrl}
              />
            </DropdownTrigger>
            <DropdownMenu aria-label="Profile Actions" variant="flat">
              <DropdownItem
                key="user"
                className="h-14 gap-2 rounded-b-none border-b hover:bg-white"
              >
                <p className="font-semibold">{user?.name ?? "Unknown User"}</p>
                <Tag color="orange" className="text-xs italic">
                  {user?.role?.toUpperCase() ?? "No Role"}
                </Tag>
              </DropdownItem>
              <DropdownItem
                key="profile"
                color="primary"
                href="/account/profile"
              >
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
