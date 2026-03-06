"use client";

import { LogOut, Monitor, MoonStar, SunMedium } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { useTransition } from "react";
import { toast } from "sonner";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { apiFetch } from "@/lib/api-client";
import { cn } from "@/lib/utils";

type AppUserMenuProps = {
  user: {
    fullName: string;
    email: string;
  };
  roles: string[];
  compact?: boolean;
  sidebarAware?: boolean;
  triggerClassName?: string;
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

function getInitials(fullName: string) {
  return fullName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

export function AppUserMenu({
  user,
  roles,
  compact = false,
  sidebarAware = false,
  triggerClassName,
}: AppUserMenuProps) {
  const router = useRouter();
  const { setTheme, theme, resolvedTheme } = useTheme();
  const [isPending, startTransition] = useTransition();
  const activeTheme = theme ?? resolvedTheme ?? "system";

  async function handleLogout() {
    const response = await apiFetch("/api/auth/logout", {
      method: "POST",
      cache: "no-store",
    });

    if (!response.ok) {
      toast.error("No pudimos cerrar la sesión.");
      return;
    }

    startTransition(() => {
      router.replace("/login");
      router.refresh();
    });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          className={cn(
            "group h-auto min-h-11 rounded-2xl border-border/70 px-3 py-2",
            compact ? "w-11 justify-center rounded-full p-0" : "w-full justify-start",
            sidebarAware &&
              "group-data-[collapsible=icon]:size-11 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:rounded-full group-data-[collapsible=icon]:px-0",
            triggerClassName,
          )}
          data-testid="nav-user-menu"
          size="sm"
          variant="ghost"
        >
          <Avatar className="border border-border/70 bg-muted" size={compact ? "sm" : "default"}>
            <AvatarFallback>{getInitials(user.fullName)}</AvatarFallback>
          </Avatar>
          {!compact ? (
            <span
              className={cn(
                "grid min-w-0 flex-1 text-left",
                sidebarAware && "group-data-[collapsible=icon]:hidden",
              )}
            >
              <span className="truncate text-sm font-medium">{user.fullName}</span>
              <span className="truncate text-xs text-muted-foreground">{roles.join(" · ")}</span>
            </span>
          ) : null}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64 rounded-2xl">
        <DropdownMenuLabel className="space-y-1">
          <p className="text-sm font-semibold">{user.fullName}</p>
          <p className="truncate text-xs font-normal text-muted-foreground">{user.email}</p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
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
              <span className="text-xs text-muted-foreground">{isActive ? "Active" : ""}</span>
            </DropdownMenuItem>
          );
        })}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="cursor-pointer text-destructive focus:text-destructive"
          data-testid="nav-logout"
          disabled={isPending}
          onClick={() => void handleLogout()}
        >
          <LogOut className="size-4" />
          <span>{isPending ? "Cerrando..." : "Cerrar sesión"}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
