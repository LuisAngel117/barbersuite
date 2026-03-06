"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { ColumnDef, PaginationState } from "@tanstack/react-table";
import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { type ClientPagePayload, type ClientPayload } from "@/lib/backend";
import { apiFetch } from "@/lib/api-client";
import { hasAnyRole } from "@/lib/roles";
import {
  readApiResponse,
  toProblemBanner,
  type ProblemBannerState,
} from "@/lib/problem";
import { ClientForm } from "@/components/clients/client-form";
import { DataTable } from "@/components/data-table/data-table";
import { DataTableRowActions } from "@/components/data-table/data-table-row-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ProblemBanner } from "@/components/ui/problem-banner";

const DEFAULT_PAGE_SIZE = 20;

function toTestIdSegment(value: string) {
  return (
    value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "item"
  );
}

function formatDate(value: string, locale: string) {
  return new Intl.DateTimeFormat(locale === "en" ? "en-US" : "es-EC", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function ClientsTable({
  branchId,
  roles,
}: {
  branchId: string;
  roles: readonly string[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const locale = useLocale();
  const tClients = useTranslations("clients");
  const tCommon = useTranslations("common");
  const tConfirmations = useTranslations("confirmations");
  const tUi = useTranslations("ui");
  const [queryInput, setQueryInput] = useState("");
  const [query, setQuery] = useState("");
  const [clientPage, setClientPage] = useState<ClientPagePayload | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingClientId, setPendingClientId] = useState<string | null>(null);
  const [problem, setProblem] = useState<ProblemBannerState | null>(null);
  const [formMode, setFormMode] = useState<"create" | "edit" | null>(null);
  const [editingClient, setEditingClient] = useState<ClientPayload | null>(null);
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: DEFAULT_PAGE_SIZE,
  });

  const canCreateClients = true;
  const canEditClients = hasAnyRole(roles, ["ADMIN", "MANAGER", "RECEPTION"]);
  const isSheetOpen = formMode !== null;

  const fetchClients = useCallback(async () => {
    const params = new URLSearchParams({
      page: String(pagination.pageIndex),
      size: String(pagination.pageSize),
    });

    if (query) {
      params.set("q", query);
    }

    const response = await fetch(`/api/clients?${params.toString()}`, {
      cache: "no-store",
    });
    const result = await readApiResponse<ClientPagePayload>(response);

    if (!response.ok || !result.data) {
      setClientPage(null);
      setProblem(toProblemBanner(result.problem, tClients("loadFailed")));
      setIsLoading(false);
      return;
    }

    setClientPage(result.data);
    setProblem(null);
    setIsLoading(false);
  }, [pagination.pageIndex, pagination.pageSize, query, tClients]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void fetchClients();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [fetchClients]);

  useEffect(() => {
    if (searchParams.get("create") !== "1" || formMode !== null) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setEditingClient(null);
      setFormMode("create");
      setProblem(null);

      const nextParams = new URLSearchParams(searchParams.toString());
      nextParams.delete("create");
      const nextUrl = nextParams.size > 0 ? `${pathname}?${nextParams.toString()}` : pathname;
      router.replace(nextUrl, { scroll: false });
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [formMode, pathname, router, searchParams]);

  const reloadClients = useCallback(async () => {
    setIsLoading(true);
    await fetchClients();
  }, [fetchClients]);

  const openClientEditor = useCallback(
    async (clientId: string) => {
      setPendingClientId(clientId);
      setProblem(null);

      const response = await fetch(`/api/clients/${clientId}`, {
        cache: "no-store",
      });
      const result = await readApiResponse<ClientPayload>(response);

      setPendingClientId(null);
      if (!response.ok || !result.data) {
        setProblem(toProblemBanner(result.problem, tClients("loadOneFailed")));
        return;
      }

      setEditingClient(result.data);
      setFormMode("edit");
    },
    [tClients],
  );

  const handleToggleActive = useCallback(
    async (client: ClientPayload) => {
      setPendingClientId(client.id);
      setProblem(null);

      const response = await apiFetch(`/api/clients/${client.id}`, {
        method: "PATCH",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ active: !client.active }),
      });
      const result = await readApiResponse<ClientPayload>(response);

      setPendingClientId(null);
      if (!response.ok) {
        setProblem(toProblemBanner(result.problem, tClients("toggleFailed")));
        return;
      }

      toast.success(client.active ? tClients("deactivateSuccess") : tClients("activateSuccess"));
      await reloadClients();
      router.refresh();
    },
    [reloadClients, router, tClients],
  );

  function applySearch() {
    setProblem(null);
    setIsLoading(true);

    const nextQuery = queryInput.trim();
    if (pagination.pageIndex === 0 && nextQuery === query) {
      void fetchClients();
      return;
    }

    setPagination((current) => ({ ...current, pageIndex: 0 }));
    setQuery(nextQuery);
  }

  const columns = useMemo<ColumnDef<ClientPayload>[]>(
    () => {
      const baseColumns: ColumnDef<ClientPayload>[] = [
        {
          accessorKey: "fullName",
          header: tClients("name"),
          cell: ({ row }) => (
            <div className="space-y-1">
              <p className="font-medium tracking-tight">{row.original.fullName}</p>
              <p className="text-xs text-muted-foreground">
                {formatDate(row.original.createdAt, locale)}
              </p>
            </div>
          ),
        },
        {
          id: "contact",
          header: tClients("contact"),
          cell: ({ row }) => (
            <div className="space-y-1">
              <p>{row.original.phone || tClients("withoutPhone")}</p>
              <p className="text-xs text-muted-foreground">
                {row.original.email || tClients("withoutEmail")}
              </p>
            </div>
          ),
        },
        {
          accessorKey: "notes",
          header: tClients("notes"),
          cell: ({ row }) => row.original.notes || tClients("withoutNotes"),
        },
        {
          accessorKey: "active",
          header: tClients("active"),
          cell: ({ row }) => (
            <Badge
              className="rounded-full"
              variant={row.original.active ? "secondary" : "outline"}
            >
              {row.original.active ? tClients("rowActive") : tClients("rowInactive")}
            </Badge>
          ),
        },
      ];

      if (!canEditClients) {
        return baseColumns;
      }

      return [
        ...baseColumns,
        {
          id: "actions",
          header: tCommon("actions"),
          cell: ({ row }) => {
            const client = row.original;
            const segment = toTestIdSegment(client.fullName);
            const isPending = pendingClientId === client.id;

            return (
              <DataTableRowActions
                actions={[
                  {
                    label: isPending ? tClients("loading") : tClients("edit"),
                    onClick: () => openClientEditor(client.id),
                    disabled: isPending,
                    testId: `clients-edit-${segment}`,
                  },
                  {
                    label: isPending
                      ? tClients("saving")
                      : client.active
                        ? tClients("deactivate")
                        : tClients("activate"),
                    onClick: () => handleToggleActive(client),
                    destructive: true,
                    disabled: isPending,
                    confirmTitle: client.active
                      ? tConfirmations("deactivateTitle")
                      : tConfirmations("activateTitle"),
                    confirmDescription: client.active
                      ? tConfirmations("deactivateDescription")
                      : tConfirmations("activateDescription"),
                    confirmLabel: client.active
                      ? tClients("deactivate")
                      : tClients("activate"),
                    testId: `clients-toggle-${segment}`,
                  },
                ]}
                triggerTestId={`clients-actions-${segment}`}
              />
            );
          },
        },
      ];
    },
    [
      canEditClients,
      handleToggleActive,
      locale,
      openClientEditor,
      pendingClientId,
      tClients,
      tCommon,
      tConfirmations,
    ],
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="rounded-full bg-brand-muted text-brand-foreground hover:bg-brand-muted">
              {tUi("branchScoped")}
            </Badge>
            <Badge className="rounded-full" variant="outline">
              {branchId}
            </Badge>
          </div>
          <p className="text-sm leading-6 text-muted-foreground">{tClients("description")}</p>
        </div>
      </div>

      {problem ? <ProblemBanner problem={problem} /> : null}

      <DataTable
        columns={columns}
        data={clientPage?.items ?? []}
        emptyCta={
          canCreateClients ? (
            <Button
              className="rounded-full"
              onClick={() => {
                setEditingClient(null);
                setFormMode("create");
                setProblem(null);
              }}
              type="button"
            >
              {tClients("add")}
            </Button>
          ) : null
        }
        emptyDescription={query ? tClients("searchEmptyDescription") : tClients("emptyDescription")}
        emptyTitle={query ? tClients("searchEmptyTitle") : tClients("emptyTitle")}
        filtersSlot={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              className="rounded-xl"
              data-testid="clients-search-submit"
              disabled={isLoading}
              onClick={applySearch}
              type="button"
              variant="outline"
            >
              {tClients("searchSubmit")}
            </Button>
          </div>
        }
        globalFilter={{
          value: queryInput,
          onChange: setQueryInput,
          onSubmit: applySearch,
          placeholder: tClients("searchPlaceholder"),
          testId: "clients-search",
        }}
        isLoading={isLoading}
        pagination={{
          mode: "manual",
          pageCount: clientPage?.totalPages ?? 1,
          pageIndex: pagination.pageIndex,
          pageSize: pagination.pageSize,
          totalItems: clientPage?.totalItems,
          onPaginationChange: (next) => {
            setIsLoading(true);
            setPagination(next);
          },
        }}
        rightSlot={
          canCreateClients ? (
            <Button
              className="rounded-xl"
              data-testid="clients-add"
              onClick={() => {
                setEditingClient(null);
                setFormMode("create");
                setProblem(null);
              }}
              type="button"
            >
              {tClients("add")}
            </Button>
          ) : null
        }
        rowId={(client) => client.id}
        rowTestId={(client) => `clients-row-${toTestIdSegment(client.fullName)}`}
        title={tClients("listTitle")}
      />

      {isSheetOpen ? (
        <ClientForm
          initialClient={editingClient}
          key={`${formMode}-${editingClient?.id ?? "new-client"}`}
          mode={formMode === "edit" ? "edit" : "create"}
          onOpenChange={(open) => {
            if (!open) {
              setFormMode(null);
              setEditingClient(null);
            }
          }}
          onSuccess={async () => {
            await reloadClients();
            router.refresh();
          }}
          open
        />
      ) : null}
    </div>
  );
}
