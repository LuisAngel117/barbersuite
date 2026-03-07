import type { LucideIcon } from "lucide-react";
import {
  BanknoteArrowDown,
  Bell,
  Building2,
  CalendarClock,
  ChartColumnBig,
  Clock3,
  LayoutDashboard,
  Scissors,
  Settings2,
  SwatchBook,
  UserRound,
  Users,
} from "lucide-react";

export type AppRole = "ADMIN" | "MANAGER" | "BARBER" | "RECEPTION";
export type AppLocale = "es" | "en";
export type AppNavGroupKey = "core" | "operations" | "administration" | "system";

export type AppNavItem = {
  key: string;
  href: string;
  icon: LucideIcon;
  label: Record<AppLocale, string>;
  group: AppNavGroupKey;
  allowedRoles: AppRole[];
  mobilePrimary?: boolean;
  testId?: string;
  devOnly?: boolean;
};

export type AppNavGroup = {
  key: AppNavGroupKey;
  label: Record<AppLocale, string>;
};

export const ALL_APP_ROLES: AppRole[] = ["ADMIN", "MANAGER", "BARBER", "RECEPTION"];

export const APP_NAV_GROUPS: AppNavGroup[] = [
  {
    key: "core",
    label: {
      es: "Core",
      en: "Core",
    },
  },
  {
    key: "operations",
    label: {
      es: "Operaciones",
      en: "Operations",
    },
  },
  {
    key: "administration",
    label: {
      es: "Administración",
      en: "Administration",
    },
  },
  {
    key: "system",
    label: {
      es: "Sistema",
      en: "System",
    },
  },
];

export const APP_NAV_ITEMS: AppNavItem[] = [
  {
    key: "dashboard",
    href: "/app",
    icon: LayoutDashboard,
    label: {
      es: "Dashboard",
      en: "Dashboard",
    },
    group: "core",
    allowedRoles: ALL_APP_ROLES,
    mobilePrimary: true,
    testId: "nav-dashboard",
  },
  {
    key: "appointments",
    href: "/app/appointments",
    icon: CalendarClock,
    label: {
      es: "Agenda",
      en: "Appointments",
    },
    group: "operations",
    allowedRoles: ALL_APP_ROLES,
    mobilePrimary: true,
  },
  {
    key: "services",
    href: "/app/services",
    icon: Scissors,
    label: {
      es: "Servicios",
      en: "Services",
    },
    group: "operations",
    allowedRoles: ALL_APP_ROLES,
    testId: "nav-services",
  },
  {
    key: "clients",
    href: "/app/clients",
    icon: Users,
    label: {
      es: "Clientes",
      en: "Clients",
    },
    group: "operations",
    allowedRoles: ALL_APP_ROLES,
    mobilePrimary: true,
    testId: "nav-clients",
  },
  {
    key: "receipts",
    href: "/app/receipts",
    icon: BanknoteArrowDown,
    label: {
      es: "Caja",
      en: "Receipts",
    },
    group: "operations",
    allowedRoles: ["ADMIN", "MANAGER", "RECEPTION"],
    mobilePrimary: true,
    testId: "nav-receipts",
  },
  {
    key: "staff",
    href: "/app/staff",
    icon: UserRound,
    label: {
      es: "Staff",
      en: "Staff",
    },
    group: "administration",
    allowedRoles: ["ADMIN", "MANAGER"],
    testId: "nav-staff",
  },
  {
    key: "availability",
    href: "/app/staff/availability",
    icon: Clock3,
    label: {
      es: "Disponibilidad",
      en: "Availability",
    },
    group: "administration",
    allowedRoles: ["ADMIN", "MANAGER"],
    testId: "nav-availability",
  },
  {
    key: "branches",
    href: "/app/branches",
    icon: Building2,
    label: {
      es: "Sucursales",
      en: "Branches",
    },
    group: "administration",
    allowedRoles: ["ADMIN", "MANAGER"],
    testId: "nav-branches",
  },
  {
    key: "reports",
    href: "/app/reports",
    icon: ChartColumnBig,
    label: {
      es: "Reportes",
      en: "Reports",
    },
    group: "administration",
    allowedRoles: ["ADMIN", "MANAGER"],
    testId: "nav-reports",
  },
  {
    key: "notifications",
    href: "/app/notifications",
    icon: Bell,
    label: {
      es: "Notificaciones",
      en: "Notifications",
    },
    group: "system",
    allowedRoles: ["ADMIN", "MANAGER"],
    testId: "nav-notifications",
  },
  {
    key: "settings",
    href: "/app/settings",
    icon: Settings2,
    label: {
      es: "Configuración",
      en: "Settings",
    },
    group: "system",
    allowedRoles: ALL_APP_ROLES,
    testId: "nav-settings",
  },
  {
    key: "ui-kit",
    href: "/app/ui-kit",
    icon: SwatchBook,
    label: {
      es: "UI Kit",
      en: "UI Kit",
    },
    group: "system",
    allowedRoles: ["ADMIN", "MANAGER"],
    devOnly: true,
    testId: "nav-ui-kit",
  },
];

function shouldShowDevOnlyItem(item: AppNavItem) {
  if (!item.devOnly) {
    return true;
  }

  return process.env.NODE_ENV !== "production";
}

export function isRoleAllowed(item: AppNavItem, roles: readonly string[]) {
  return item.allowedRoles.some((role) => roles.includes(role));
}

export function isNavItemActive(pathname: string, href: string) {
  if (href === "/app") {
    return pathname === href;
  }

  if (pathname === href) {
    return true;
  }

  if (!pathname.startsWith(`${href}/`)) {
    return false;
  }

  return !APP_NAV_ITEMS.some(
    (item) =>
      item.href !== href &&
      item.href.length > href.length &&
      (pathname === item.href || pathname.startsWith(`${item.href}/`)),
  );
}

export function getVisibleNavItems(roles: readonly string[]) {
  return APP_NAV_ITEMS.filter(
    (item) => isRoleAllowed(item, roles) && shouldShowDevOnlyItem(item),
  );
}

export function getVisibleNavGroups(roles: readonly string[]) {
  const visibleItems = getVisibleNavItems(roles);

  return APP_NAV_GROUPS.map((group) => ({
    ...group,
    items: visibleItems.filter((item) => item.group === group.key),
  })).filter((group) => group.items.length > 0);
}

export function getMobilePrimaryNavItems(roles: readonly string[]) {
  return getVisibleNavItems(roles).filter((item) => item.mobilePrimary);
}

export function getMobileSecondaryNavGroups(roles: readonly string[]) {
  const mobilePrimaryKeys = new Set(getMobilePrimaryNavItems(roles).map((item) => item.key));

  return getVisibleNavGroups(roles)
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => !mobilePrimaryKeys.has(item.key)),
    }))
    .filter((group) => group.items.length > 0);
}

export function findNavItemByHref(href: string) {
  return [...APP_NAV_ITEMS]
    .sort((left, right) => right.href.length - left.href.length)
    .find((item) => isNavItemActive(href, item.href));
}

export function getNavLabel(item: AppNavItem | AppNavGroup, locale: AppLocale = "es") {
  return item.label[locale];
}
