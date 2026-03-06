"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { getVisibleNavGroups, isNavItemActive } from "@/config/app-nav";
import { AppUserMenu } from "@/components/app-user-menu";
import { usePathname } from "next/navigation";

type AppSidebarProps = {
  roles: string[];
  user: {
    fullName: string;
    email: string;
  };
};

export function AppSidebar({ roles, user }: AppSidebarProps) {
  const pathname = usePathname();
  const tNav = useTranslations("nav");
  const tUi = useTranslations("ui");
  const groups = getVisibleNavGroups(roles);

  return (
    <Sidebar collapsible="icon" side="left" variant="inset">
      <SidebarHeader className="gap-4 px-3 py-4">
        <Link
          className="flex items-center gap-3 rounded-2xl px-2 py-2 transition-colors hover:bg-sidebar-accent"
          href="/app"
        >
          <div className="flex size-10 items-center justify-center rounded-2xl bg-brand text-brand-foreground shadow-sm">
            B
          </div>
          <div className="grid min-w-0 flex-1 gap-0.5 group-data-[collapsible=icon]:hidden">
            <span className="truncate text-sm font-semibold tracking-tight">BarberSuite</span>
            <span className="truncate text-xs text-sidebar-foreground/60">{tUi("opsConsole")}</span>
          </div>
        </Link>

        {process.env.NODE_ENV !== "production" ? (
          <Badge className="rounded-full bg-brand-muted text-brand-foreground hover:bg-brand-muted group-data-[collapsible=icon]:hidden">
            {tUi("demoShell")}
          </Badge>
        ) : null}
      </SidebarHeader>

      <SidebarContent>
        {groups.map((group) => (
          <SidebarGroup key={group.key}>
            <SidebarGroupLabel>{tNav(`groups.${group.key}`)}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = isNavItemActive(pathname, item.href);
                  const label = tNav(item.key);

                  return (
                    <SidebarMenuItem key={item.key}>
                      <SidebarMenuButton
                        asChild
                        className="h-10 rounded-xl"
                        data-testid={item.testId}
                        isActive={isActive}
                        tooltip={label}
                      >
                        <Link href={item.href} prefetch={false}>
                          <Icon />
                          <span>{label}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="px-3 py-4">
        <AppUserMenu roles={roles} sidebarAware user={user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
