"use client";

import { useEffect, useState } from "react";

import { Switch } from "@nextui-org/react";
import { IconMoon, IconSun } from "@tabler/icons-react";

import useSystemTheme from "../hooks/use-system-theme";

interface IProps {
  showLabel?: boolean;
  onThemeChange?: (theme: "system" | "dark" | "light") => void;
}

export function ThemeSwitcher({ showLabel, onThemeChange }: IProps) {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useSystemTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <Switch
      isSelected={theme === "light"}
      onValueChange={() => {
        setTheme(theme === "light" ? "dark" : "light");
        if (onThemeChange) {
          onThemeChange(theme);
        }
      }}
      size="md"
      color="primary"
      startContent={<IconSun />}
      endContent={<IconMoon />}
    >
      {showLabel && "Theme"}
    </Switch>
  );
}
