"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useSelectedLayoutSegments } from "next/navigation";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { APP_NAV_ITEMS, findNavItemByHref } from "@/config/app-nav";

function fallbackLabel(segment: string) {
  return segment
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function AppBreadcrumbs() {
  const segments = useSelectedLayoutSegments();
  const tNav = useTranslations("nav");

  const breadcrumbs = [
    {
      href: "/app",
      label: tNav(APP_NAV_ITEMS[0].key),
      current: segments.length === 0,
    },
    ...segments.map((segment, index) => {
      const href = `/app/${segments.slice(0, index + 1).join("/")}`;
      const item = findNavItemByHref(href);

      return {
        href,
        label: item ? tNav(item.key) : fallbackLabel(segment),
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
