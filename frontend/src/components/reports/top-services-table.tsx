"use client";

import { useMemo, useState } from "react";
import type { ColumnDef, PaginationState, SortingState } from "@tanstack/react-table";
import { useLocale, useTranslations } from "next-intl";
import { formatMoneyUSD } from "@/lib/format";
import type { TopServiceItem } from "@/lib/types/reports";
import { DataTable } from "@/components/data-table/data-table";

type TopServicesTableProps = {
  items: TopServiceItem[];
  isLoading?: boolean;
};

export function TopServicesTable({
  items,
  isLoading = false,
}: TopServicesTableProps) {
  const locale = useLocale();
  const tReports = useTranslations("reports");
  const [sorting, setSorting] = useState<SortingState>([]);
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });

  const columns = useMemo<ColumnDef<TopServiceItem>[]>(
    () => [
      {
        accessorKey: "serviceName",
        header: tReports("tables.service"),
        enableSorting: true,
        cell: ({ row }) => (
          <div className="space-y-1">
            <p className="font-medium tracking-tight">{row.original.serviceName}</p>
            <p className="text-xs text-muted-foreground">{row.original.serviceId}</p>
          </div>
        ),
      },
      {
        accessorKey: "quantity",
        header: tReports("tables.quantity"),
        enableSorting: true,
      },
      {
        accessorKey: "revenue",
        header: tReports("tables.revenue"),
        enableSorting: true,
        cell: ({ row }) =>
          formatMoneyUSD(row.original.revenue, locale === "en" ? "en-US" : "es-EC"),
      },
    ],
    [locale, tReports],
  );

  return (
    <div data-testid="reports-top-services">
      <DataTable
        columns={columns}
        data={items}
        emptyDescription={tReports("empty.topServicesDescription")}
        emptyTitle={tReports("empty.topServicesTitle")}
        isLoading={isLoading}
        pagination={{
          mode: "client",
          pageIndex: pagination.pageIndex,
          pageSize: pagination.pageSize,
          onPaginationChange: setPagination,
          totalItems: items.length,
        }}
        rowId={(item) => item.serviceId}
        sorting={{
          sortingState: sorting,
          onSortingChange: setSorting,
        }}
        title={tReports("topServices")}
      />
    </div>
  );
}
