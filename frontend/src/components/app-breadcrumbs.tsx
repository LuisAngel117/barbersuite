"use client";

import Link from "next/link";
import { useSelectedLayoutSegments } from "next/navigation";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { APP_NAV_ITEMS, findNavItemByHref, getNavLabel } from "@/config/app-nav";

function fallbackLabel(segment: string) {
  return segment
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function AppBreadcrumbs() {
  const segments = useSelectedLayoutSegments();

  const breadcrumbs = [
    {
      href: "/app",
      label: getNavLabel(APP_NAV_ITEMS[0]),
      current: segments.length === 0,
    },
    ...segments.map((segment, index) => {
      const href = `/app/${segments.slice(0, index + 1).join("/")}`;
      const item = findNavItemByHref(href);

      return {
        href,
        label: item ? getNavLabel(item) : fallbackLabel(segment),
        current: index === segments.length - 1,
      };
    }),
  ];

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {breadcrumbs.map((breadcrumb, index) => (
          <BreadcrumbItem key={breadcrumb.href}>
            {breadcrumb.current ? (
              <BreadcrumbPage>{breadcrumb.label}</BreadcrumbPage>
            ) : (
              <>
                <BreadcrumbLink asChild>
                  <Link href={breadcrumb.href}>{breadcrumb.label}</Link>
                </BreadcrumbLink>
                {index < breadcrumbs.length - 1 ? <BreadcrumbSeparator /> : null}
              </>
            )}
          </BreadcrumbItem>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
