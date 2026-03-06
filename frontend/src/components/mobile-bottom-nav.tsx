"use client";

import Link from "next/link";
import { Menu } from "lucide-react";
import { usePathname } from "next/navigation";
import { BranchSelector } from "@/components/branch-selector";
import { AppUserMenu } from "@/components/app-user-menu";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import {
  getMobilePrimaryNavItems,
  getMobileSecondaryNavGroups,
  getNavLabel,
  isNavItemActive,
} from "@/config/app-nav";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

type MobileBottomNavProps = {
  roles: string[];
  user: {
    fullName: string;
    email: string;
  };
  branches: Array<{
    id: string;
    name: string;
    code: string;
    timeZone: string;
    active: boolean;
  }>;
  selectedBranchId: string | null;
};

export function MobileBottomNav({
  roles,
  user,
  branches,
  selectedBranchId,
}: MobileBottomNavProps) {
  const isMobile = useIsMobile();
  const pathname = usePathname();
  const primaryItems = getMobilePrimaryNavItems(roles).slice(0, 4);
  const secondaryGroups = getMobileSecondaryNavGroups(roles);

  if (!isMobile) {
    return null;
  }

  return (
    <div>
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border/70 bg-background/92 px-3 py-2 backdrop-blur-xl">
        <div className="mx-auto flex max-w-xl items-center justify-between gap-1">
          {primaryItems.map((item) => {
            const Icon = item.icon;
            const isActive = isNavItemActive(pathname, item.href);

            return (
              <Button
                asChild
                className={cn(
                  "h-14 flex-1 rounded-2xl px-2",
                  isActive && "bg-brand-muted text-foreground shadow-sm hover:bg-brand-muted/80",
                )}
                data-testid={item.testId}
                key={item.key}
                size="sm"
                variant={isActive ? "secondary" : "ghost"}
              >
                <Link className="flex flex-col items-center justify-center gap-1" href={item.href}>
                  <Icon className="size-4" />
                  <span className="text-[11px] font-medium">{getNavLabel(item)}</span>
                </Link>
              </Button>
            );
          })}

          <Sheet>
            <SheetTrigger asChild>
              <Button className="h-14 flex-1 rounded-2xl px-2" size="sm" variant="ghost">
                <span className="flex flex-col items-center justify-center gap-1">
                  <Menu className="size-4" />
                  <span className="text-[11px] font-medium">More</span>
                </span>
              </Button>
            </SheetTrigger>
            <SheetContent className="w-full max-w-md overflow-y-auto border-border/70 bg-background/95">
              <SheetHeader>
                <SheetTitle>Workspace</SheetTitle>
                <SheetDescription>
                  Acciones adicionales, módulos administrativos y cambio de sucursal.
                </SheetDescription>
              </SheetHeader>

              <div className="space-y-6 px-4 pb-6">
                <AppUserMenu roles={roles} user={user} />

                <div className="rounded-2xl border border-border/70 bg-card/80 p-4 shadow-sm">
                  <BranchSelector
                    branches={branches}
                    selectedBranchId={selectedBranchId}
                    variant="compact"
                  />
                </div>

                {secondaryGroups.map((group) => (
                  <div className="space-y-3" key={group.key}>
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                      {getNavLabel(group)}
                    </p>
                    <div className="grid gap-2">
                      {group.items.map((item) => {
                        const Icon = item.icon;
                        const isActive = isNavItemActive(pathname, item.href);

                        return (
                          <Button
                            asChild
                            className={cn(
                              "h-11 justify-start rounded-2xl px-4",
                              isActive &&
                                "bg-brand-muted text-foreground shadow-sm hover:bg-brand-muted/80",
                            )}
                            data-testid={item.testId}
                            key={item.key}
                            variant={isActive ? "secondary" : "ghost"}
                          >
                            <Link href={item.href}>
                              <Icon className="size-4" />
                              <span>{getNavLabel(item)}</span>
                            </Link>
                          </Button>
                        );
                      })}
                    </div>
                    <Separator />
                  </div>
                ))}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </div>
  );
}
