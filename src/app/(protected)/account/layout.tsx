"use client";

// app/account/layout.tsx
import Link from "next/link";
import { usePathname } from "next/navigation";
import React from "react";

import clsx from "clsx";

const tabs = [
  { label: "Overview", href: "/account" },
  { label: "Profile", href: "/account/profile" },
  { label: "Leave", href: "/account/leave" },
  { label: "Payslips", href: "/account/payslips" },
  { label: "Documents", href: "/account/documents" },
  { label: "Employment", href: "/account/employment" },
];

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="space-y-6">
      <div className="flex gap-4 border-b border-zinc-600 pb-2">
        {tabs.map((tab) => (
          <Link
            key={tab.href}
            href={tab.href}
            className={clsx(
              "text-sm font-medium",
              pathname === tab.href
                ? "border-b-2 border-yellow-400 pb-1 text-yellow-400"
                : "text-gray-400 hover:text-yellow-300"
            )}
          >
            {tab.label}
          </Link>
        ))}
      </div>
      <div>{children}</div>
    </div>
  );
}
