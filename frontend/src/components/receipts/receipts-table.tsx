"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { ColumnDef, PaginationState } from "@tanstack/react-table";
import { useLocale, useTranslations } from "next-intl";
import type { ServicePayload } from "@/lib/backend";
import { formatMoneyUSD } from "@/lib/format";
import { hasAnyRole } from "@/lib/roles";
import { toProblemBanner, type ProblemBannerState } from "@/lib/problem";
import type { Receipt, ReceiptPage } from "@/lib/types/receipts";
import { DataTable } from "@/components/data-table/data-table";
import { DataTableRowActions } from "@/components/data-table/data-table-row-actions";
import { ReceiptDetail } from "@/components/receipts/receipt-detail";
import { ReceiptForm } from "@/components/receipts/receipt-form";
import { fetchReceiptServices, fetchReceipts } from "@/components/receipts/receipt-api";
import { VoidReceiptDialog } from "@/components/receipts/void-receipt-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/empty-state";
import { ProblemBanner } from "@/components/ui/problem-banner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const DEFAULT_PAGE_SIZE = 20;

type ReceiptsTableProps = {
  roles: readonly string[];
  branchId: string;
  branchTimeZone: string;
};

type StatusFilterValue = "all" | "issued" | "voided";

function toTestIdSegment(value: string) {
  return (
    value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "item"
  );
}

function formatReceiptDate(value: string, locale: string, timeZone: string) {
  return new Intl.DateTimeFormat(locale === "en" ? "en-US" : "es-EC", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone,
  }).format(new Date(value));
}

function ReceiptStatusBadge({
  status,
  issuedLabel,
  voidedLabel,
}: {
  status: Receipt["status"];
  issuedLabel: string;
  voidedLabel: string;
}) {
  return (
    <Badge className="rounded-full" variant={status === "issued" ? "secondary" : "destructive"}>
      {status === "issued" ? issuedLabel : voidedLabel}
    </Badge>
  );
}

export function ReceiptsTable({
  roles,
  branchId,
  branchTimeZone,
}: ReceiptsTableProps) {
  const locale = useLocale();
  const tCommon = useTranslations("common");
  const tReceipts = useTranslations("receipts");
  const [queryInput, setQueryInput] = useState("");
  const [query, setQuery] = useState("");
  const [fromInput, setFromInput] = useState("");
  const [from, setFrom] = useState("");
  const [toInput, setToInput] = useState("");
  const [to, setTo] = useState("");
  const [statusInput, setStatusInput] = useState<StatusFilterValue>("all");
  const [status, setStatus] = useState<StatusFilterValue>("all");
  const [receiptPage, setReceiptPage] = useState<ReceiptPage | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [services, setServices] = useState<ServicePayload[]>([]);
  const [isServicesLoading, setIsServicesLoading] = useState(true);
  const [serviceCatalogError, setServiceCatalogError] = useState<string | null>(null);
  const [problem, setProblem] = useState<ProblemBannerState | null>(null);
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: DEFAULT_PAGE_SIZE,
  });
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [detailReceiptId, setDetailReceiptId] = useState<string | null>(null);
  const [voidTarget, setVoidTarget] = useState<Receipt | null>(null);

  const canAccessCash = hasAnyRole(roles, ["ADMIN", "MANAGER", "RECEPTION"]);
  const canVoidReceipts = hasAnyRole(roles, ["ADMIN", "MANAGER"]);

  const loadReceipts = useCallback(async () => {
    const params = new URLSearchParams({
      page: String(pagination.pageIndex),
      size: String(pagination.pageSize),
    });

    if (query) {
      params.set("q", query);
    }
    if (from) {
      params.set("from", from);
    }
    if (to) {
      params.set("to", to);
    }
    if (status !== "all") {
      params.set("status", status);
    }

    const response = await fetchReceipts(params);
    if (!response.data) {
      setReceiptPage(null);
      setProblem(toProblemBanner(response.problem, tReceipts("errors.listFailed")));
      setIsLoading(false);
      return;
    }

    setReceiptPage(response.data);
    setProblem(null);
    setIsLoading(false);
  }, [from, pagination.pageIndex, pagination.pageSize, query, status, tReceipts, to]);

  const loadServicesCatalog = useCallback(async () => {
    setIsServicesLoading(true);
    const response = await fetchReceiptServices();

    if (!response.data) {
      setServices([]);
      setServiceCatalogError(
        toProblemBanner(response.problem, tReceipts("errors.catalogLoadFailed")).detail,
      );
      setIsServicesLoading(false);
      return;
    }

    setServices(response.data);
    setServiceCatalogError(null);
    setIsServicesLoading(false);
  }, [tReceipts]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadReceipts();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [loadReceipts]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadServicesCatalog();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [loadServicesCatalog]);

  const reloadReceipts = useCallback(async () => {
    setIsLoading(true);
    await loadReceipts();
  }, [loadReceipts]);

  function applyFilters() {
    setProblem(null);
    setIsLoading(true);

    const nextQuery = queryInput.trim();
    const nextFrom = fromInput.trim();
    const nextTo = toInput.trim();
    const sameFilters =
      nextQuery === query &&
      nextFrom === from &&
      nextTo === to &&
      statusInput === status;

    if (pagination.pageIndex === 0 && sameFilters) {
      void loadReceipts();
      return;
    }

    setPagination((current) => ({ ...current, pageIndex: 0 }));
    setQuery(nextQuery);
    setFrom(nextFrom);
    setTo(nextTo);
    setStatus(statusInput);
  }

  const columns = useMemo<ColumnDef<Receipt>[]>(() => {
    const baseColumns: ColumnDef<Receipt>[] = [
      {
        accessorKey: "number",
        header: tReceipts("columns.number"),
        cell: ({ row }) => (
          <div className="space-y-1">
            <p className="font-medium tracking-tight">{row.original.number}</p>
            <p className="text-xs text-muted-foreground">{row.original.id}</p>
          </div>
        ),
      },
      {
        accessorKey: "issuedAt",
        header: tReceipts("columns.issuedAt"),
        cell: ({ row }) => formatReceiptDate(row.original.issuedAt, locale, branchTimeZone),
      },
      {
        accessorKey: "status",
        header: tReceipts("columns.status"),
        cell: ({ row }) => (
          <ReceiptStatusBadge
            issuedLabel={tReceipts("status.issued")}
            status={row.original.status}
            voidedLabel={tReceipts("status.voided")}
          />
        ),
      },
      {
        accessorKey: "total",
        header: tReceipts("columns.total"),
        cell: ({ row }) =>
          formatMoneyUSD(row.original.total, locale === "en" ? "en-US" : "es-EC"),
      },
      {
        id: "actions",
        header: tCommon("actions"),
        cell: ({ row }) => {
          const receipt = row.original;
          const segment = toTestIdSegment(receipt.number);
          const actions = [
            {
              label: tCommon("view"),
              onClick: () => setDetailReceiptId(receipt.id),
              testId: `receipts-view-${segment}`,
            },
          ];

          if (canVoidReceipts && receipt.status === "issued") {
            actions.push({
              label: tReceipts("voidReceipt"),
              onClick: () => setVoidTarget(receipt),
              testId: `receipts-void-${segment}`,
            });
          }

          return (
            <DataTableRowActions
              actions={actions}
              triggerTestId={`receipts-actions-${segment}`}
            />
          );
        },
      },
    ];

    return baseColumns;
  }, [branchTimeZone, canVoidReceipts, locale, tCommon, tReceipts]);

  if (!canAccessCash) {
    return (
      <EmptyState
        description={tReceipts("noAccessDescription")}
        title={tReceipts("noAccessTitle")}
        variant="warning"
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="rounded-full bg-brand-muted text-brand-foreground hover:bg-brand-muted">
              {tReceipts("branchScoped")}
            </Badge>
            <Badge className="rounded-full" variant="outline">
              {branchId}
            </Badge>
            <Badge className="rounded-full" variant="outline">
              {branchTimeZone}
            </Badge>
          </div>
          <p className="text-sm leading-6 text-muted-foreground">{tReceipts("description")}</p>
        </div>
      </div>

      {problem ? <ProblemBanner problem={problem} /> : null}

      <DataTable
        columns={columns}
        data={receiptPage?.items ?? []}
        emptyCta={(
          <Button
            className="rounded-full"
            onClick={() => {
              setIsCreateOpen(true);
              setProblem(null);
            }}
            type="button"
          >
            {tReceipts("newSale")}
          </Button>
        )}
        emptyDescription={query || from || to || status !== "all" ? tReceipts("searchEmptyDescription") : tReceipts("emptyDescription")}
        emptyTitle={query || from || to || status !== "all" ? tReceipts("searchEmptyTitle") : tReceipts("emptyTitle")}
        filtersSlot={(
          <div className="flex flex-wrap items-center gap-2">
            <input
              className="h-11 rounded-xl border border-border/70 bg-background px-3 text-sm outline-none ring-offset-background transition focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
              data-testid="receipts-from"
              onChange={(event) => setFromInput(event.target.value)}
              type="date"
              value={fromInput}
            />
            <input
              className="h-11 rounded-xl border border-border/70 bg-background px-3 text-sm outline-none ring-offset-background transition focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
              data-testid="receipts-to"
              onChange={(event) => setToInput(event.target.value)}
              type="date"
              value={toInput}
            />
            <Select onValueChange={(value: StatusFilterValue) => setStatusInput(value)} value={statusInput}>
              <SelectTrigger className="h-11 w-[180px] rounded-xl" data-testid="receipts-status-filter">
                <SelectValue placeholder={tReceipts("filters.status")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{tReceipts("filters.all")}</SelectItem>
                <SelectItem value="issued">{tReceipts("status.issued")}</SelectItem>
                <SelectItem value="voided">{tReceipts("status.voided")}</SelectItem>
              </SelectContent>
            </Select>
            <Button
              className="rounded-xl"
              data-testid="receipts-search-submit"
              disabled={isLoading}
              onClick={applyFilters}
              type="button"
              variant="outline"
            >
              {tReceipts("filters.apply")}
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
          onSubmit: applyFilters,
          placeholder: tReceipts("filters.searchPlaceholder"),
          testId: "receipts-search",
        }}
        isLoading={isLoading}
        pagination={{
          mode: "manual",
          pageCount: receiptPage?.totalPages ?? 1,
          pageIndex: pagination.pageIndex,
          pageSize: pagination.pageSize,
          totalItems: receiptPage?.totalItems,
          onPaginationChange: (next) => {
            setIsLoading(true);
            setPagination(next);
          },
        }}
        rightSlot={(
          <Button
            className="rounded-xl"
            data-testid="receipts-add"
            onClick={() => {
              setIsCreateOpen(true);
              setProblem(null);
            }}
            type="button"
          >
            {tReceipts("newSale")}
          </Button>
        )}
        rowId={(receipt) => receipt.id}
        rowTestId={(receipt) => `receipts-row-${toTestIdSegment(receipt.number)}`}
        title={tReceipts("listTitle")}
      />

      {isCreateOpen ? (
        <ReceiptForm
          isServicesLoading={isServicesLoading}
          onOpenChange={setIsCreateOpen}
          onSuccess={async () => {
            await reloadReceipts();
          }}
          open={isCreateOpen}
          serviceCatalogError={serviceCatalogError}
          services={services}
        />
      ) : null}

      <ReceiptDetail
        onOpenChange={(open) => {
          if (!open) {
            setDetailReceiptId(null);
          }
        }}
        open={Boolean(detailReceiptId)}
        receiptId={detailReceiptId}
        timeZone={branchTimeZone}
      />

      <VoidReceiptDialog
        onOpenChange={(open) => {
          if (!open) {
            setVoidTarget(null);
          }
        }}
        onSuccess={async () => {
          await reloadReceipts();
        }}
        open={Boolean(voidTarget)}
        receipt={voidTarget}
      />
    </div>
  );
}
