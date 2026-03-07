"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { ColumnDef, PaginationState } from "@tanstack/react-table";
import { useLocale, useTranslations } from "next-intl";
import { type ProblemBannerState, toProblemBanner } from "@/lib/problem";
import type {
  EmailKind,
  EmailOutboxItem,
  EmailOutboxStatus,
} from "@/lib/types/notifications";
import { fetchEmailOutbox } from "@/components/notifications/notifications-api";
import { OutboxDetailDialog } from "@/components/notifications/outbox-detail-dialog";
import { DataTable } from "@/components/data-table/data-table";
import { DataTableRowActions } from "@/components/data-table/data-table-row-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ProblemBanner } from "@/components/ui/problem-banner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

type OutboxTableProps = {
  refreshToken: number;
};

type FilterValue<T extends string> = "all" | T;

type OutboxFilters = {
  status: FilterValue<EmailOutboxStatus>;
  kind: FilterValue<EmailKind>;
  from: string;
  to: string;
};

const DEFAULT_FILTERS: OutboxFilters = {
  status: "all",
  kind: "all",
  from: "",
  to: "",
};

function getLocaleTag(locale: string) {
  return locale === "en" ? "en-US" : "es-EC";
}

function formatMaybeDate(formatter: Intl.DateTimeFormat, value: string | null) {
  if (!value) {
    return "—";
  }

  return formatter.format(new Date(value));
}

function formatLastError(value: string | null) {
  if (!value) {
    return "—";
  }

  return value.length > 70 ? `${value.slice(0, 67)}...` : value;
}

export function OutboxTable({ refreshToken }: OutboxTableProps) {
  const locale = useLocale();
  const tCommon = useTranslations("common");
  const tNotifications = useTranslations("notifications");
  const [draftFilters, setDraftFilters] = useState<OutboxFilters>(DEFAULT_FILTERS);
  const [filters, setFilters] = useState<OutboxFilters>(DEFAULT_FILTERS);
  const [items, setItems] = useState<EmailOutboxItem[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [pageCount, setPageCount] = useState(1);
  const [problem, setProblem] = useState<ProblemBannerState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [selectedItem, setSelectedItem] = useState<EmailOutboxItem | null>(null);
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });

  const formatter = useMemo(
    () =>
      new Intl.DateTimeFormat(getLocaleTag(locale), {
        dateStyle: "medium",
        timeStyle: "short",
      }),
    [locale],
  );

  const loadOutbox = useCallback(async () => {
    setIsLoading(true);

    const params = new URLSearchParams({
      page: String(pagination.pageIndex),
      size: String(pagination.pageSize),
    });

    if (filters.status !== "all") {
      params.set("status", filters.status);
    }
    if (filters.kind !== "all") {
      params.set("kind", filters.kind);
    }
    if (filters.from) {
      params.set("from", filters.from);
    }
    if (filters.to) {
      params.set("to", filters.to);
    }

    const result = await fetchEmailOutbox(params);
    if (!result.data) {
      setItems([]);
      setTotalItems(0);
      setPageCount(1);
      setProblem(toProblemBanner(result.problem, tNotifications("errors.loadFailed")));
      setIsLoading(false);
      return;
    }

    setItems(result.data.items);
    setTotalItems(result.data.totalItems);
    setPageCount(Math.max(result.data.totalPages, 1));
    setProblem(null);
    setIsLoading(false);
  }, [
    filters.from,
    filters.kind,
    filters.status,
    filters.to,
    pagination.pageIndex,
    pagination.pageSize,
    tNotifications,
  ]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadOutbox();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [loadOutbox, refreshToken]);

  useEffect(() => {
    if (!autoRefresh) {
      return;
    }

    const intervalId = window.setInterval(() => {
      void loadOutbox();
    }, 5_000);

    return () => window.clearInterval(intervalId);
  }, [autoRefresh, loadOutbox]);

  function applyFilters() {
    if (draftFilters.from && draftFilters.to && draftFilters.from > draftFilters.to) {
      setProblem({
        title: tNotifications("errors.validationTitle"),
        detail: tNotifications("errors.invalidRange"),
        code: "VALIDATION_ERROR",
      });
      return;
    }

    setProblem(null);

    const filtersChanged =
      draftFilters.status !== filters.status ||
      draftFilters.kind !== filters.kind ||
      draftFilters.from !== filters.from ||
      draftFilters.to !== filters.to;

    if (!filtersChanged && pagination.pageIndex === 0) {
      void loadOutbox();
      return;
    }

    setPagination((current) => ({ ...current, pageIndex: 0 }));
    setFilters(draftFilters);
  }

  const columns = useMemo<ColumnDef<EmailOutboxItem>[]>(
    () => [
      {
        accessorKey: "createdAt",
        header: tNotifications("table.createdAt"),
        cell: ({ row }) => formatMaybeDate(formatter, row.original.createdAt),
      },
      {
        accessorKey: "kind",
        header: tNotifications("table.kind"),
        cell: ({ row }) => (
          <Badge className="rounded-full" variant="outline">
            {tNotifications(`kind.${row.original.kind}`)}
          </Badge>
        ),
      },
      {
        accessorKey: "status",
        header: tNotifications("table.status"),
        cell: ({ row }) => (
          <Badge
            className="rounded-full"
            variant={row.original.status === "failed" ? "destructive" : "secondary"}
          >
            {tNotifications(`status.${row.original.status}`)}
          </Badge>
        ),
      },
      {
        accessorKey: "toEmail",
        header: tNotifications("table.to"),
      },
      {
        accessorKey: "subject",
        header: tNotifications("table.subject"),
        cell: ({ row }) => (
          <div className="max-w-[280px]">
            <p className="truncate font-medium tracking-tight">{row.original.subject}</p>
          </div>
        ),
      },
      {
        accessorKey: "attempts",
        header: tNotifications("table.attempts"),
      },
      {
        accessorKey: "scheduledAt",
        header: tNotifications("table.scheduledAt"),
        cell: ({ row }) => formatMaybeDate(formatter, row.original.scheduledAt),
      },
      {
        accessorKey: "sentAt",
        header: tNotifications("table.sentAt"),
        cell: ({ row }) => formatMaybeDate(formatter, row.original.sentAt),
      },
      {
        accessorKey: "lastError",
        header: tNotifications("table.lastError"),
        cell: ({ row }) => (
          <div className="max-w-[220px]" title={row.original.lastError || undefined}>
            <p className="truncate text-sm leading-6 text-muted-foreground">
              {formatLastError(row.original.lastError)}
            </p>
          </div>
        ),
      },
      {
        id: "actions",
        header: tCommon("actions"),
        cell: ({ row }) => (
          <DataTableRowActions
            actions={[
              {
                label: tNotifications("actions.viewDetails"),
                onClick: () => setSelectedItem(row.original),
                testId: `notifications-view-${row.original.id}`,
              },
            ]}
            triggerTestId={`notifications-actions-${row.original.id}`}
          />
        ),
      },
    ],
    [formatter, tCommon, tNotifications],
  );

  return (
    <div className="space-y-4">
      {problem ? <ProblemBanner problem={problem} /> : null}

      <div data-testid="notifications-outbox-table">
        <DataTable
          columns={columns}
          data={items}
          emptyDescription={tNotifications("emptyDescription")}
          emptyTitle={tNotifications("emptyTitle")}
          filtersSlot={(
            <>
              <Select
                onValueChange={(value: FilterValue<EmailOutboxStatus>) =>
                  setDraftFilters((current) => ({ ...current, status: value }))
                }
                value={draftFilters.status}
              >
                <SelectTrigger className="h-11 w-[170px] rounded-xl">
                  <SelectValue placeholder={tNotifications("filters.status")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{tNotifications("filters.all")}</SelectItem>
                  <SelectItem value="pending">{tNotifications("status.pending")}</SelectItem>
                  <SelectItem value="sent">{tNotifications("status.sent")}</SelectItem>
                  <SelectItem value="failed">{tNotifications("status.failed")}</SelectItem>
                  <SelectItem value="cancelled">{tNotifications("status.cancelled")}</SelectItem>
                </SelectContent>
              </Select>

              <Select
                onValueChange={(value: FilterValue<EmailKind>) =>
                  setDraftFilters((current) => ({ ...current, kind: value }))
                }
                value={draftFilters.kind}
              >
                <SelectTrigger className="h-11 w-[220px] rounded-xl">
                  <SelectValue placeholder={tNotifications("filters.kind")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{tNotifications("filters.all")}</SelectItem>
                  <SelectItem value="appointment_confirmation">
                    {tNotifications("kind.appointment_confirmation")}
                  </SelectItem>
                  <SelectItem value="appointment_reminder">
                    {tNotifications("kind.appointment_reminder")}
                  </SelectItem>
                  <SelectItem value="appointment_rescheduled">
                    {tNotifications("kind.appointment_rescheduled")}
                  </SelectItem>
                  <SelectItem value="appointment_cancelled">
                    {tNotifications("kind.appointment_cancelled")}
                  </SelectItem>
                </SelectContent>
              </Select>

              <Input
                className="h-11 w-[170px] rounded-xl"
                onChange={(event) =>
                  setDraftFilters((current) => ({ ...current, from: event.target.value }))
                }
                type="date"
                value={draftFilters.from}
              />
              <Input
                className="h-11 w-[170px] rounded-xl"
                onChange={(event) =>
                  setDraftFilters((current) => ({ ...current, to: event.target.value }))
                }
                type="date"
                value={draftFilters.to}
              />
              <Button
                className="rounded-xl"
                disabled={isLoading}
                onClick={applyFilters}
                type="button"
                variant="outline"
              >
                {tNotifications("actions.applyFilters")}
              </Button>
            </>
          )}
          isLoading={isLoading}
          pagination={{
            mode: "manual",
            pageIndex: pagination.pageIndex,
            pageSize: pagination.pageSize,
            pageCount,
            totalItems,
            onPaginationChange: setPagination,
          }}
          rightSlot={(
            <div className="flex flex-wrap items-center justify-end gap-2">
              {autoRefresh ? (
                <Badge className="rounded-full bg-brand-muted text-brand-foreground hover:bg-brand-muted">
                  {tNotifications("actions.live")}
                </Badge>
              ) : null}
              <label className="flex items-center gap-3 rounded-xl border border-border/70 bg-background/80 px-3 py-2 text-sm">
                <Switch checked={autoRefresh} onCheckedChange={setAutoRefresh} size="sm" />
                <span>{tNotifications("actions.autoRefresh")}</span>
              </label>
            </div>
          )}
          rowId={(item) => item.id}
          rowTestId={(item) => `notifications-row-${item.id}`}
          title={tNotifications("outboxTitle")}
        />
      </div>

      <OutboxDetailDialog
        item={selectedItem}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedItem(null);
          }
        }}
        open={Boolean(selectedItem)}
      />
    </div>
  );
}
