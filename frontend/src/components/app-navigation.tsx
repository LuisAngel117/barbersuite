"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navigationItems = [
  {
    href: "/app",
    label: "Dashboard",
  },
  {
    href: "/app/services",
    label: "Services",
  },
  {
    href: "/app/clients",
    label: "Clients",
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
            href={item.href}
            key={item.href}
            prefetch={false}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      <Link className="button button-secondary" href="/api/auth/logout?next=/login">
        Cerrar sesión
      </Link>
    </div>
  );
}
