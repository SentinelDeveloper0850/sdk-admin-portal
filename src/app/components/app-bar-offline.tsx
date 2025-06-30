"use client";

import Image from "next/image";
import { useState } from "react";

import {
  Link,
  Navbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
  NavbarMenu,
  NavbarMenuItem,
  NavbarMenuToggle,
} from "@nextui-org/react";

import { ThemeSwitcher } from "./theme-switcher";

export default function AppBarOffline() {
  const [isMenuOpen, setIsMenuOpen] = useState(false); // Correct state management

  const menuItems = [
    {
      label: "Home",
      href: "/",
    },
    {
      label: "Sign in",
      href: "/auth/signin",
    },
  ];

  return (
    <Navbar
      onMenuOpenChange={(isOpen) => setIsMenuOpen(isOpen)}
      className="z-20 border-b-1 border-b-gray-200 dark:border-b-gray-700"
    >
      <NavbarContent>
        <NavbarMenuToggle
          aria-label={isMenuOpen ? "Close menu" : "Open menu"}
          className="md:hidden"
        />
        <NavbarBrand>
          <Image
            src="/logo.png"
            alt="logo"
            width={75}
            height={75}
            className="p-4"
          />

          <h1 className="mb-0 text-md font-semibold text-gray-800 dark:text-white uppercase">
            Somdaka Funerals
          </h1>
        </NavbarBrand>
      </NavbarContent>

      <NavbarContent className="hidden gap-4 md:flex" justify="center">
        {menuItems.map((item, index) => (
          <NavbarItem key={index}>
            {" "}
            {/* Use index if labels are unique */}
            {/* <Link color="foreground" href={item.href} size="lg">
              {item.label}
            </Link> */}
          </NavbarItem>
        ))}
      </NavbarContent>

      <NavbarContent justify="end">
        <NavbarItem className="hidden md:flex">
          <ThemeSwitcher />
        </NavbarItem>
        <NavbarItem className="hidden lg:flex">
          <Link href="/auth/signin">Sign in</Link>
        </NavbarItem>
      </NavbarContent>

      <NavbarMenu>
        <NavbarMenuItem>
          <ThemeSwitcher showLabel />
        </NavbarMenuItem>
        {menuItems.map((item, index) => (
          <NavbarMenuItem key={index}>
            {" "}
            {/* Unique key to avoid React warnings */}
            <Link className="w-full" href={item.href} size="lg">
              {item.label}
            </Link>
          </NavbarMenuItem>
        ))}
      </NavbarMenu>
    </Navbar>
  );
}
