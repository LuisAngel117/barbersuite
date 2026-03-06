"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogoutButton } from "@/components/logout-button";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navigationItems = [
  {
    href: "/app",
    label: "Dashboard",
    testId: "nav-dashboard",
  },
  {
    href: "/app/services",
    label: "Services",
    testId: "nav-services",
  },
  {
    href: "/app/clients",
    label: "Clients",
    testId: "nav-clients",
  },
  {
    href: "/app/ui-kit",
    label: "UI Kit",
    testId: "nav-ui-kit",
  },
];

function isActive(pathname: string, href: string) {
  if (href === "/app") {
    return pathname === href;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppNavigation() {
  const pathname = usePathname();

  return (
    <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
      <nav aria-label="Workspace" className="flex flex-wrap items-center gap-2">
        {navigationItems.map((item) => (
          <Button
            asChild
            className={cn(
              "rounded-full px-4",
              isActive(pathname, item.href) &&
                "bg-brand-muted text-foreground shadow-sm hover:bg-brand-muted/80",
            )}
            data-testid={item.testId}
            key={item.href}
            size="sm"
            variant={isActive(pathname, item.href) ? "secondary" : "ghost"}
          >
            <Link href={item.href} prefetch={false}>
              {item.label}
            </Link>
          </Button>
        ))}
      </nav>

      <div className="flex flex-wrap items-center gap-2">
        <ThemeToggle />
        <LogoutButton />
      </div>
    </div>
  );
}
