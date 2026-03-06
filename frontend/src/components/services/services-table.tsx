"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { ColumnDef, PaginationState, SortingState } from "@tanstack/react-table";
import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { type ServicePayload } from "@/lib/backend";
import { apiFetch } from "@/lib/api-client";
import { formatMoneyUSD, formatMinutes } from "@/lib/format";
import { hasAnyRole } from "@/lib/roles";
import {
  readApiResponse,
  toProblemBanner,
  type ProblemBannerState,
} from "@/lib/problem";
import { DataTable } from "@/components/data-table/data-table";
import { DataTableRowActions } from "@/components/data-table/data-table-row-actions";
import { ServiceForm } from "@/components/services/service-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ProblemBanner } from "@/components/ui/problem-banner";

function sortServices(services: ServicePayload[], locale: string) {
  return [...services].sort((left, right) => {
    if (left.active !== right.active) {
      return left.active ? -1 : 1;
    }

    return left.name.localeCompare(right.name, locale, { sensitivity: "base" });
  });
}

function toTestIdSegment(value: string) {
  return (
    value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "item"
  );
}

export function ServicesTable({ roles }: { roles: readonly string[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const locale = useLocale();
  const tCommon = useTranslations("common");
  const tConfirmations = useTranslations("confirmations");
  const tServices = useTranslations("services");
  const tUi = useTranslations("ui");
  const [services, setServices] = useState<ServicePayload[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingServiceId, setPendingServiceId] = useState<string | null>(null);
  const [problem, setProblem] = useState<ProblemBannerState | null>(null);
  const [formMode, setFormMode] = useState<"create" | "edit" | null>(null);
  const [editingService, setEditingService] = useState<ServicePayload | null>(null);
  const [search, setSearch] = useState("");
  const [sorting, setSorting] = useState<SortingState>([]);
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });

  const canManageServices = hasAnyRole(roles, ["ADMIN", "MANAGER"]);
  const isSheetOpen = formMode !== null;

  const fetchServices = useCallback(async () => {
    const response = await fetch("/api/services", {
      cache: "no-store",
    });
    const result = await readApiResponse<ServicePayload[]>(response);

    if (!response.ok || !result.data) {
      setServices([]);
      setProblem(toProblemBanner(result.problem, tServices("loadFailed")));
      setIsLoading(false);
      return;
    }

    setServices(sortServices(result.data, locale));
    setProblem(null);
    setIsLoading(false);
  }, [locale, tServices]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void fetchServices();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [fetchServices]);

  useEffect(() => {
    if (searchParams.get("create") !== "1" || !canManageServices || formMode !== null) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setEditingService(null);
      setFormMode("create");
      setProblem(null);

      const nextParams = new URLSearchParams(searchParams.toString());
      nextParams.delete("create");
      const nextUrl = nextParams.size > 0 ? `${pathname}?${nextParams.toString()}` : pathname;
      router.replace(nextUrl, { scroll: false });
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [canManageServices, formMode, pathname, router, searchParams]);

  const reloadServices = useCallback(async () => {
    setIsLoading(true);
    await fetchServices();
  }, [fetchServices]);

  const openServiceEditor = useCallback(
    async (serviceId: string) => {
      setPendingServiceId(serviceId);
      setProblem(null);

      const response = await fetch(`/api/services/${serviceId}`, {
        cache: "no-store",
      });
      const result = await readApiResponse<ServicePayload>(response);

      setPendingServiceId(null);
      if (!response.ok || !result.data) {
        setProblem(toProblemBanner(result.problem, tServices("loadOneFailed")));
        return;
      }

      setEditingService(result.data);
      setFormMode("edit");
    },
    [tServices],
  );

  const handleToggleActive = useCallback(
    async (service: ServicePayload) => {
      setPendingServiceId(service.id);
      setProblem(null);

      const response = await apiFetch(`/api/services/${service.id}`, {
        method: "PATCH",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ active: !service.active }),
      });
      const result = await readApiResponse<ServicePayload>(response);

      setPendingServiceId(null);
      if (!response.ok) {
        setProblem(toProblemBanner(result.problem, tServices("toggleFailed")));
        return;
      }

      toast.success(service.active ? tServices("deactivateSuccess") : tServices("activateSuccess"));
      await reloadServices();
      router.refresh();
    },
    [reloadServices, router, tServices],
  );

  const filteredServices = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase(locale);
    if (!normalizedSearch) {
      return services;
    }

    return services.filter((service) =>
      service.name.toLocaleLowerCase(locale).includes(normalizedSearch),
    );
  }, [locale, search, services]);

  const columns = useMemo<ColumnDef<ServicePayload>[]>(
    () => {
      const baseColumns: ColumnDef<ServicePayload>[] = [
        {
          accessorKey: "name",
          header: tServices("name"),
          enableSorting: true,
          cell: ({ row }) => (
            <div className="space-y-1">
              <p className="font-medium tracking-tight">{row.original.name}</p>
              <p className="text-xs text-muted-foreground">{row.original.id}</p>
            </div>
          ),
        },
        {
          accessorKey: "durationMinutes",
          header: tServices("duration"),
          enableSorting: true,
          cell: ({ row }) => formatMinutes(row.original.durationMinutes),
        },
        {
          accessorKey: "price",
          header: tServices("price"),
          enableSorting: true,
          cell: ({ row }) =>
            formatMoneyUSD(row.original.price, locale === "en" ? "en-US" : "es-EC"),
        },
        {
          accessorKey: "active",
          header: tServices("active"),
          enableSorting: true,
          cell: ({ row }) => (
            <Badge
              className="rounded-full"
              variant={row.original.active ? "secondary" : "outline"}
            >
              {row.original.active ? tServices("rowActive") : tServices("rowInactive")}
            </Badge>
          ),
        },
      ];

      if (!canManageServices) {
        return baseColumns;
      }

      return [
        ...baseColumns,
        {
          id: "actions",
          header: tCommon("actions"),
          enableSorting: false,
          cell: ({ row }) => {
            const service = row.original;
            const segment = toTestIdSegment(service.name);
            const isPending = pendingServiceId === service.id;

            return (
              <DataTableRowActions
                actions={[
                  {
                    label: isPending ? tServices("loading") : tServices("edit"),
                    onClick: () => openServiceEditor(service.id),
                    disabled: isPending,
                    testId: `services-edit-${segment}`,
                  },
                  {
                    label: isPending
                      ? tServices("saving")
                      : service.active
                        ? tServices("deactivate")
                        : tServices("activate"),
                    onClick: () => handleToggleActive(service),
                    destructive: true,
                    disabled: isPending,
                    confirmTitle: service.active
                      ? tConfirmations("deactivateTitle")
                      : tConfirmations("activateTitle"),
                    confirmDescription: service.active
                      ? tConfirmations("deactivateDescription")
                      : tConfirmations("activateDescription"),
                    confirmLabel: service.active
                      ? tServices("deactivate")
                      : tServices("activate"),
                    testId: `services-toggle-${segment}`,
                  },
                ]}
                triggerTestId={`services-actions-${segment}`}
              />
            );
          },
        },
      ];
    },
    [
      canManageServices,
      handleToggleActive,
      locale,
      openServiceEditor,
      pendingServiceId,
      tCommon,
      tConfirmations,
      tServices,
    ],
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="rounded-full bg-brand-muted text-brand-foreground hover:bg-brand-muted">
              {tServices("count", { count: services.length })}
            </Badge>
            <Badge className="rounded-full" variant="outline">
              {tUi("tenantScoped")}
            </Badge>
          </div>
          <p className="text-sm leading-6 text-muted-foreground">{tServices("description")}</p>
        </div>
      </div>

      {problem ? <ProblemBanner problem={problem} /> : null}

      <DataTable
        columns={columns}
        data={filteredServices}
        emptyCta={
          canManageServices ? (
            <Button
              className="rounded-full"
              onClick={() => {
                setEditingService(null);
                setFormMode("create");
                setProblem(null);
              }}
              type="button"
            >
              {tServices("add")}
            </Button>
          ) : null
        }
        emptyDescription={search.trim() ? tCommon("emptyDescription") : tServices("emptyDescription")}
        emptyTitle={search.trim() ? tCommon("emptyTitle") : tServices("emptyTitle")}
        globalFilter={{
          value: search,
          onChange: (value) => {
            setPagination((current) => ({ ...current, pageIndex: 0 }));
            setSearch(value);
          },
          placeholder: tCommon("search"),
          testId: "services-search",
        }}
        isLoading={isLoading}
        pagination={{
          mode: "client",
          pageIndex: pagination.pageIndex,
          pageSize: pagination.pageSize,
          onPaginationChange: setPagination,
          totalItems: filteredServices.length,
        }}
        rightSlot={
          canManageServices ? (
            <Button
              className="rounded-xl"
              data-testid="services-add"
              onClick={() => {
                setEditingService(null);
                setFormMode("create");
                setProblem(null);
              }}
              type="button"
            >
              {tServices("add")}
            </Button>
          ) : null
        }
        rowId={(service) => service.id}
        rowTestId={(service) => `services-row-${toTestIdSegment(service.name)}`}
        sorting={{
          sortingState: sorting,
          onSortingChange: setSorting,
        }}
        title={tServices("listTitle")}
      />

      {isSheetOpen ? (
        <ServiceForm
          initialService={editingService}
          key={`${formMode}-${editingService?.id ?? "new-service"}`}
          mode={formMode === "edit" ? "edit" : "create"}
          onOpenChange={(open) => {
            if (!open) {
              setFormMode(null);
              setEditingService(null);
            }
          }}
          onSuccess={async () => {
            await reloadServices();
            router.refresh();
          }}
          open
        />
      ) : null}
    </div>
  );
}
