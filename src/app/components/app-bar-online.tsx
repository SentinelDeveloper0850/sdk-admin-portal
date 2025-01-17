"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

import {
  Avatar,
  Divider,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
  Navbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
} from "@nextui-org/react";

import { logout } from "@/utils/auth";

import { useAuth } from "@/context/auth-context";

import { ThemeSwitcher } from "./theme-switcher";

export default function AppBarOnline() {
  const router = useRouter();
  const { user } = useAuth();

  const handleLogout = () => {
    logout(); // Clear the token
    router.push("/auth/signin"); // Redirect to login page
  };

  return (
    <Navbar
      maxWidth="full"
      className="shadow-sm dark:bg-[#2e2e2e] dark:text-[#f1f1f1]"
    >
      <NavbarContent justify="start">
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
          <ThemeSwitcher />
        </NavbarItem>
        <NavbarItem className="hidden md:flex">
          <Dropdown placement="bottom-end">
            <DropdownTrigger>
              <Avatar
                isBordered
                as="button"
                className="transition-transform"
                color="primary"
                src="https://i.pravatar.cc/150"
              />
            </DropdownTrigger>
            <DropdownMenu aria-label="Profile Actions" variant="flat">
              <DropdownItem key="user" className="h-14 gap-2 hover:bg-white">
                <p className="font-semibold">{user?.name ?? "Unknown User"}</p>
                <p className="font-semibold">
                  {user?.email ?? "Email not available"}
                </p>
                <Divider className="mt-2" />
              </DropdownItem>
              {/* <DropdownItem key="profile" color="primary">
                <Link href="/account/profile">
                  <span>Profile</span>
                </Link>
              </DropdownItem>
              <DropdownItem key="preferences" color="primary">
                <Link href="/account/preferences">
                  <span>Preferences</span>
                </Link>
              </DropdownItem> */}
              <DropdownItem key="logout" color="danger" onClick={handleLogout}>
                Logout
              </DropdownItem>
            </DropdownMenu>
          </Dropdown>
        </NavbarItem>
      </NavbarContent>
    </Navbar>
  );
}
