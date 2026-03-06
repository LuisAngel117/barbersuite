"use client";

import { useMemo, useState } from "react";
import type { ColumnDef, PaginationState, SortingState } from "@tanstack/react-table";
import { useTranslations } from "next-intl";
import { formatMinutes } from "@/lib/format";
import type { BarberSummaryItem } from "@/lib/types/reports";
import { DataTable } from "@/components/data-table/data-table";

type BarbersSummaryTableProps = {
  items: BarberSummaryItem[];
  isLoading?: boolean;
};

export function BarbersSummaryTable({
  items,
  isLoading = false,
}: BarbersSummaryTableProps) {
  const tReports = useTranslations("reports");
  const [sorting, setSorting] = useState<SortingState>([]);
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });

  const columns = useMemo<ColumnDef<BarberSummaryItem>[]>(
    () => [
      {
        accessorKey: "barberName",
        header: tReports("tables.barber"),
        enableSorting: true,
      },
      {
        accessorKey: "appointmentsCount",
        header: tReports("tables.appointments"),
        enableSorting: true,
      },
      {
        accessorKey: "completedCount",
        header: tReports("tables.completed"),
        enableSorting: true,
      },
      {
        accessorKey: "noShowCount",
        header: tReports("tables.noShow"),
        enableSorting: true,
      },
      {
        accessorKey: "bookedMinutes",
        header: tReports("tables.bookedMinutes"),
        enableSorting: true,
        cell: ({ row }) => formatMinutes(row.original.bookedMinutes),
      },
    ],
    [tReports],
  );

  return (
    <div data-testid="reports-barbers-summary">
      <DataTable
        columns={columns}
        data={items}
        emptyDescription={tReports("empty.barbersDescription")}
        emptyTitle={tReports("empty.barbersTitle")}
        isLoading={isLoading}
        pagination={{
          mode: "client",
          pageIndex: pagination.pageIndex,
          pageSize: pagination.pageSize,
          onPaginationChange: setPagination,
          totalItems: items.length,
        }}
        rowId={(item) => item.barberId}
        sorting={{
          sortingState: sorting,
          onSortingChange: setSorting,
        }}
        title={tReports("barbersSummary")}
      />
    </div>
  );
}
