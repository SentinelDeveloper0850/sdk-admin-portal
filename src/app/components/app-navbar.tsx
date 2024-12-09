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

export default function AppNavbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false); // Correct state management

  const menuItems = [
    {
      label: "Home",
      href: "/",
    },
    {
      label: "About",
      href: "/about",
    },
    {
      label: "Contact",
      href: "/contact",
    },
    {
      label: "FAQ",
      href: "/faq",
    },
    {
      label: "Blog",
      href: "/blog",
    },
  ];

  return (
    <Navbar
      onMenuOpenChange={(isOpen) => setIsMenuOpen(isOpen)}
      className="z-20"
    >
      <NavbarContent>
        <NavbarMenuToggle
          aria-label={isMenuOpen ? "Close menu" : "Open menu"}
          className="md:hidden"
        />
        <NavbarBrand>
          <Image src="/logoWhite.svg" alt="logo" width={85} height={75} />
          {/* <p className="ml-2 font-semibold text-inherit">FleetSync</p> */}
        </NavbarBrand>
      </NavbarContent>

      <NavbarContent className="hidden gap-4 md:flex" justify="center">
        {menuItems.map((item, index) => (
          <NavbarItem key={index}>
            {" "}
            {/* Use index if labels are unique */}
            <Link color="foreground" href={item.href} size="lg">
              {item.label}
            </Link>
          </NavbarItem>
        ))}
      </NavbarContent>

      <NavbarContent justify="end">
        <NavbarItem className="hidden md:flex">
          <ThemeSwitcher />
        </NavbarItem>
        <NavbarItem className="hidden lg:flex">
          <Link href="/auth/login">Login</Link>
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
