"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { ColumnDef, PaginationState, SortingState } from "@tanstack/react-table";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { MePayload, ServicePayload } from "@/lib/backend";
import { apiFetch } from "@/lib/api-client";
import { hasAnyRole } from "@/lib/roles";
import { readApiResponse, toProblemBanner, type ProblemBannerState } from "@/lib/problem";
import type { BarberDetail, BarberListItem, BarberListResponse } from "@/lib/types/staff";
import { BarberForm } from "@/components/staff/barber-form";
import { DataTable } from "@/components/data-table/data-table";
import { DataTableRowActions } from "@/components/data-table/data-table-row-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ProblemBanner } from "@/components/ui/problem-banner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type StaffBarbersTableProps = {
  roles: readonly string[];
  branches: MePayload["branches"];
  selectedBranchId: string | null;
};

type SheetState = {
  mode: "create" | "edit" | null;
  barber: BarberDetail | null;
  focusPassword: boolean;
};

type ActiveFilterValue = "all" | "true" | "false";

function toTestIdSegment(value: string) {
  return (
    value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "item"
  );
}

function sortServicesCatalog(services: ServicePayload[]) {
  return [...services].sort((left, right) =>
    left.name.localeCompare(right.name, "es", { sensitivity: "base" }),
  );
}

export function BarbersTable({
  roles,
  branches,
  selectedBranchId,
}: StaffBarbersTableProps) {
  const router = useRouter();
  const tCommon = useTranslations("common");
  const tStaff = useTranslations("staff");
  const [barbers, setBarbers] = useState<BarberListItem[]>([]);
  const [services, setServices] = useState<ServicePayload[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isServicesLoading, setIsServicesLoading] = useState(true);
  const [serviceCatalogError, setServiceCatalogError] = useState<string | null>(null);
  const [pendingBarberId, setPendingBarberId] = useState<string | null>(null);
  const [problem, setProblem] = useState<ProblemBannerState | null>(null);
  const [queryInput, setQueryInput] = useState("");
  const [query, setQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<ActiveFilterValue>("all");
  const [branchFilter, setBranchFilter] = useState("all");
  const [sorting, setSorting] = useState<SortingState>([]);
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });
  const [sheetState, setSheetState] = useState<SheetState>({
    mode: null,
    barber: null,
    focusPassword: false,
  });

  const canManageStaff = hasAnyRole(roles, ["ADMIN", "MANAGER"]);
  const defaultBranchIds = useMemo(() => {
    if (selectedBranchId && branches.some((branch) => branch.id === selectedBranchId)) {
      return [selectedBranchId];
    }

    if (branches.length === 1) {
      return [branches[0]!.id];
    }

    return [];
  }, [branches, selectedBranchId]);

  const fetchBarbers = useCallback(async () => {
    const params = new URLSearchParams();
    if (query) {
      params.set("q", query);
    }
    if (activeFilter !== "all") {
      params.set("active", activeFilter);
    }
    if (branchFilter !== "all") {
      params.set("branchId", branchFilter);
    }

    const response = await fetch(`/api/staff/barbers${params.size > 0 ? `?${params.toString()}` : ""}`, {
      cache: "no-store",
    });
    const result = await readApiResponse<BarberListResponse>(response);

    if (!response.ok || !result.data) {
      setBarbers([]);
      setProblem(toProblemBanner(result.problem, tStaff("loadFailed")));
      setIsLoading(false);
      return;
    }

    setBarbers(result.data.items);
    setProblem(null);
    setIsLoading(false);
  }, [activeFilter, branchFilter, query, tStaff]);

  const fetchServicesCatalog = useCallback(async () => {
    setIsServicesLoading(true);

    const response = await fetch("/api/services", {
      cache: "no-store",
    });
    const result = await readApiResponse<ServicePayload[]>(response);

    if (!response.ok || !result.data) {
      setServices([]);
      setServiceCatalogError(toProblemBanner(result.problem, tStaff("catalogLoadFailed")).detail);
      setIsServicesLoading(false);
      return;
    }

    setServices(sortServicesCatalog(result.data));
    setServiceCatalogError(null);
    setIsServicesLoading(false);
  }, [tStaff]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void fetchBarbers();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [fetchBarbers]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void fetchServicesCatalog();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [fetchServicesCatalog]);

  const reloadBarbers = useCallback(async () => {
    setIsLoading(true);
    await fetchBarbers();
  }, [fetchBarbers]);

  const openCreateBarber = useCallback(() => {
    setProblem(null);
    setSheetState({
      mode: "create",
      barber: null,
      focusPassword: false,
    });
  }, []);

  const openBarberEditor = useCallback(
    async (barberId: string, focusPassword = false) => {
      setPendingBarberId(barberId);
      setProblem(null);

      const response = await fetch(`/api/staff/barbers/${barberId}`, {
        cache: "no-store",
      });
      const result = await readApiResponse<BarberDetail>(response);

      setPendingBarberId(null);
      if (!response.ok || !result.data) {
        setProblem(toProblemBanner(result.problem, tStaff("loadOneFailed")));
        return;
      }

      setSheetState({
        mode: "edit",
        barber: result.data,
        focusPassword,
      });
    },
    [tStaff],
  );

  const handleToggleActive = useCallback(
    async (barber: BarberListItem) => {
      setPendingBarberId(barber.id);
      setProblem(null);

      const response = await apiFetch(`/api/staff/barbers/${barber.id}`, {
        method: "PATCH",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          active: !barber.active,
        }),
      });
      const result = await readApiResponse<BarberDetail>(response);

      setPendingBarberId(null);
      if (!response.ok) {
        setProblem(toProblemBanner(result.problem, tStaff("toggleFailed")));
        return;
      }

      toast.success(barber.active ? tStaff("toasts.deactivated") : tStaff("toasts.activated"));
      await reloadBarbers();
      router.refresh();
    },
    [reloadBarbers, router, tStaff],
  );

  function applySearch() {
    setProblem(null);
    setIsLoading(true);

    const nextQuery = queryInput.trim();
    if (pagination.pageIndex === 0 && nextQuery === query) {
      void fetchBarbers();
      return;
    }

    setPagination((current) => ({ ...current, pageIndex: 0 }));
    setQuery(nextQuery);
  }

  const columns = useMemo<ColumnDef<BarberListItem>[]>(
    () => {
      const baseColumns: ColumnDef<BarberListItem>[] = [
        {
          accessorKey: "fullName",
          header: tStaff("fields.fullName"),
          enableSorting: true,
          cell: ({ row }) => (
            <div className="space-y-1">
              <p className="font-medium tracking-tight">{row.original.fullName}</p>
              <p className="text-xs text-muted-foreground">{row.original.id}</p>
            </div>
          ),
        },
        {
          accessorKey: "email",
          header: tStaff("fields.email"),
          enableSorting: true,
          cell: ({ row }) => row.original.email,
        },
        {
          accessorKey: "phone",
          header: tStaff("fields.phone"),
          enableSorting: true,
          cell: ({ row }) => row.original.phone || tStaff("withoutPhone"),
        },
        {
          accessorKey: "active",
          header: tStaff("fields.active"),
          enableSorting: true,
          cell: ({ row }) => (
            <Badge className="rounded-full" variant={row.original.active ? "secondary" : "outline"}>
              {row.original.active ? tStaff("active") : tStaff("inactive")}
            </Badge>
          ),
        },
        {
          id: "branches",
          header: tStaff("fields.branches"),
          cell: ({ row }) => (
            <div className="space-y-2">
              <Badge className="rounded-full" variant="outline">
                {tStaff("branchCount", { count: row.original.branches.length })}
              </Badge>
              <div className="flex flex-wrap gap-1.5">
                {row.original.branches.slice(0, 3).map((branch) => (
                  <Badge className="rounded-full" key={branch.id} variant="secondary">
                    {branch.code}
                  </Badge>
                ))}
                {row.original.branches.length > 3 ? (
                  <Badge className="rounded-full" variant="outline">
                    +{row.original.branches.length - 3}
                  </Badge>
                ) : null}
              </div>
            </div>
          ),
        },
      ];

      if (!canManageStaff) {
        return baseColumns;
      }

      return [
        ...baseColumns,
        {
          id: "actions",
          header: tCommon("actions"),
          cell: ({ row }) => {
            const barber = row.original;
            const segment = toTestIdSegment(barber.fullName);
            const isPending = pendingBarberId === barber.id;

            return (
              <DataTableRowActions
                actions={[
                  {
                    label: isPending ? tCommon("loading") : tCommon("edit"),
                    onClick: () => openBarberEditor(barber.id),
                    disabled: isPending,
                    testId: `staff-edit-${segment}`,
                  },
                  {
                    label: isPending ? tCommon("loading") : tStaff("resetPassword"),
                    onClick: () => openBarberEditor(barber.id, true),
                    disabled: isPending,
                    testId: `staff-reset-password-${segment}`,
                  },
                  {
                    label: isPending
                      ? tCommon("loading")
                      : barber.active
                        ? tCommon("deactivate")
                        : tCommon("activate"),
                    onClick: () => handleToggleActive(barber),
                    destructive: true,
                    disabled: isPending,
                    confirmTitle: barber.active
                      ? tStaff("confirm.deactivateTitle")
                      : tStaff("confirm.activateTitle"),
                    confirmDescription: barber.active
                      ? tStaff("confirm.deactivateDescription")
                      : tStaff("confirm.activateDescription"),
                    confirmLabel: barber.active
                      ? tCommon("deactivate")
                      : tCommon("activate"),
                    testId: `staff-toggle-${segment}`,
                  },
                ]}
                triggerTestId={`staff-actions-${segment}`}
              />
            );
          },
        },
      ];
    },
    [
      canManageStaff,
      handleToggleActive,
      openBarberEditor,
      pendingBarberId,
      tCommon,
      tStaff,
    ],
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="rounded-full bg-brand-muted text-brand-foreground hover:bg-brand-muted">
              {tStaff("count", { count: barbers.length })}
            </Badge>
            <Badge className="rounded-full" variant="outline">
              {tStaff("tenantScoped")}
            </Badge>
          </div>
          <p className="text-sm leading-6 text-muted-foreground">{tStaff("description")}</p>
        </div>
      </div>

      {problem ? <ProblemBanner problem={problem} /> : null}

      <DataTable
        columns={columns}
        data={barbers}
        emptyCta={
          canManageStaff ? (
            <Button className="rounded-full" onClick={openCreateBarber} type="button">
              {tStaff("newBarber")}
            </Button>
          ) : null
        }
        emptyDescription={query || activeFilter !== "all" || branchFilter !== "all" ? tStaff("searchEmptyDescription") : tStaff("emptyDescription")}
        emptyTitle={query || activeFilter !== "all" || branchFilter !== "all" ? tStaff("searchEmptyTitle") : tStaff("emptyTitle")}
        filtersSlot={(
          <div className="flex flex-wrap items-center gap-2">
            <Select
              onValueChange={(value: ActiveFilterValue) => {
                setIsLoading(true);
                setPagination((current) => ({ ...current, pageIndex: 0 }));
                setActiveFilter(value);
              }}
              value={activeFilter}
            >
              <SelectTrigger className="h-11 w-[170px] rounded-xl" data-testid="staff-active-filter">
                <SelectValue placeholder={tStaff("filters.active")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{tStaff("filters.all")}</SelectItem>
                <SelectItem value="true">{tStaff("filters.activeOnly")}</SelectItem>
                <SelectItem value="false">{tStaff("filters.inactiveOnly")}</SelectItem>
              </SelectContent>
            </Select>

            <Select
              onValueChange={(value) => {
                setIsLoading(true);
                setPagination((current) => ({ ...current, pageIndex: 0 }));
                setBranchFilter(value);
              }}
              value={branchFilter}
            >
              <SelectTrigger className="h-11 w-[220px] rounded-xl" data-testid="staff-branch-filter">
                <SelectValue placeholder={tStaff("filters.branch")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{tStaff("filters.allBranches")}</SelectItem>
                {branches.map((branch) => (
                  <SelectItem key={branch.id} value={branch.id}>
                    {branch.code} · {branch.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              className="rounded-xl"
              data-testid="staff-search-submit"
              disabled={isLoading}
              onClick={applySearch}
              type="button"
              variant="outline"
            >
              {tStaff("filters.apply")}
            </Button>
          </div>
        )}
        globalFilter={{
          value: queryInput,
          onChange: (value) => {
            setQueryInput(value);
            if (!value.trim() && query) {
              setIsLoading(true);
              setPagination((current) => ({ ...current, pageIndex: 0 }));
              setQuery("");
            }
          },
          onSubmit: applySearch,
          placeholder: tStaff("filters.searchPlaceholder"),
          testId: "staff-search",
        }}
        isLoading={isLoading}
        pagination={{
          mode: "client",
          pageIndex: pagination.pageIndex,
          pageSize: pagination.pageSize,
          totalItems: barbers.length,
          onPaginationChange: setPagination,
        }}
        rightSlot={
          canManageStaff ? (
            <Button className="rounded-xl" data-testid="staff-add" onClick={openCreateBarber} type="button">
              {tStaff("newBarber")}
            </Button>
          ) : null
        }
        rowId={(barber) => barber.id}
        rowTestId={(barber) => `staff-row-${toTestIdSegment(barber.fullName)}`}
        sorting={{
          sortingState: sorting,
          onSortingChange: setSorting,
        }}
        title={tStaff("listTitle")}
      />

      {sheetState.mode ? (
        <BarberForm
          branches={branches}
          defaultBranchIds={defaultBranchIds}
          focusPassword={sheetState.focusPassword}
          initialBarber={sheetState.barber}
          isServicesLoading={isServicesLoading}
          key={`${sheetState.mode}-${sheetState.barber?.id ?? "new-barber"}`}
          mode={sheetState.mode}
          onOpenChange={(open) => {
            if (!open) {
              setSheetState({
                mode: null,
                barber: null,
                focusPassword: false,
              });
            }
          }}
          onSuccess={async () => {
            await reloadBarbers();
            router.refresh();
          }}
          open
          serviceCatalogError={serviceCatalogError}
          services={services}
        />
      ) : null}
    </div>
  );
}
