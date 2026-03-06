"use client";

import { Check, Monitor, MoonStar, Palette, SunMedium } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

type ThemeToggleProps = {
  buttonClassName?: string;
  className?: string;
};

const themeOptions = [
  {
    value: "light",
    label: "Light",
    icon: SunMedium,
  },
  {
    value: "dark",
    label: "Dark",
    icon: MoonStar,
  },
  {
    value: "system",
    label: "System",
    icon: Monitor,
  },
] as const;

export function ThemeToggle({ buttonClassName, className }: ThemeToggleProps) {
  const { resolvedTheme, setTheme, theme } = useTheme();
  const activeTheme = theme ?? resolvedTheme ?? "system";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          aria-label="Cambiar tema"
          className={cn("gap-2 rounded-full", buttonClassName)}
          size="sm"
          variant="outline"
        >
          <Palette className="size-4" />
          <span className="hidden sm:inline">Theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className={cn("w-44", className)}>
        {themeOptions.map((option) => {
          const Icon = option.icon;
          const isActive = activeTheme === option.value;

          return (
            <DropdownMenuItem
              className="cursor-pointer"
              key={option.value}
              onClick={() => setTheme(option.value)}
            >
              <Icon className="size-4" />
              <span className="flex-1">{option.label}</span>
              {isActive ? <Check className="size-4 text-brand" /> : null}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
