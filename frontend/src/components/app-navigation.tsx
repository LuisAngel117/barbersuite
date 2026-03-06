"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogoutButton } from "@/components/logout-button";

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
    <div className="app-nav-shell">
      <nav aria-label="Workspace" className="app-nav">
        {navigationItems.map((item) => (
          <Link
            className={`app-nav-link ${isActive(pathname, item.href) ? "app-nav-link-active" : ""}`}
            data-testid={item.testId}
            href={item.href}
            key={item.href}
            prefetch={false}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      <LogoutButton />
    </div>
  );
}
