"use client";

import { useRouter } from "next/navigation";
import { ReactNode } from "react";

import { NextUIProvider } from "@nextui-org/react";
import { ConfigProvider, theme } from "antd";
import { ThemeProvider as NextThemesProvider } from "next-themes";

import { AuthProvider } from "@/context/auth-context";

import useSystemTheme from "../hooks/use-system-theme";
import { Toaster } from "./ui/toaster";

export default function Providers({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { theme: systemTheme, setTheme } = useSystemTheme();

  return (
    <AuthProvider>
      <ConfigProvider
        theme={{
          algorithm:
            systemTheme === "dark"
              ? theme.darkAlgorithm
              : theme.defaultAlgorithm,
          token: {
            colorPrimary: "#FFC107",
          },
        }}
      >
        <NextUIProvider
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          navigate={router.push}
          className="flex h-full w-full flex-col"
        >
          <NextThemesProvider attribute="class">
            {children}
            <Toaster />
          </NextThemesProvider>
        </NextUIProvider>
      </ConfigProvider>
    </AuthProvider>
  );
}
