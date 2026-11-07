"use client";
import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const t = useTranslations();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted && resolvedTheme === "dark";

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isDark}
      aria-label={t("theme.span")}
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={cn(
        "relative inline-flex h-9 w-16 shrink-0 cursor-pointer items-center rounded-full p-1 transition-colors duration-300 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        isDark ? "bg-primary" : "bg-muted-foreground/30",
      )}
    >
      <span
        className={cn(
          "pointer-events-none relative flex h-7 w-7 items-center justify-center rounded-full bg-background text-foreground shadow-md ring-1 ring-border/50 transition-transform duration-300 ease-in-out",
          isDark ? "translate-x-7" : "translate-x-0",
        )}
      >
        <Sun
          className={cn(
            "absolute h-4 w-4 transition-all duration-300",
            isDark ? "rotate-90 scale-0" : "rotate-0 scale-100",
          )}
        />
        <Moon
          className={cn(
            "absolute h-4 w-4 transition-all duration-300",
            isDark ? "rotate-0 scale-100" : "-rotate-90 scale-0",
          )}
        />
      </span>
    </button>
  );
}
