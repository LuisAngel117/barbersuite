"use client";

import type { ReactNode } from "react";
import type { ColumnDef, PaginationState, SortingState } from "@tanstack/react-table";
import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { useTranslations } from "next-intl";
import { DataTableEmpty } from "@/components/data-table/data-table-empty";
import { DataTablePagination } from "@/components/data-table/data-table-pagination";
import { DataTableSkeleton } from "@/components/data-table/data-table-skeleton";
import { DataTableToolbar } from "@/components/data-table/data-table-toolbar";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type DataTablePaginationConfig = {
  mode: "client" | "manual";
  pageIndex: number;
  pageSize: number;
  pageCount?: number;
  totalItems?: number;
  onPaginationChange: (next: PaginationState) => void;
};

type DataTableSortingConfig = {
  sortingState: SortingState;
  onSortingChange: (next: SortingState) => void;
  manualSorting?: boolean;
};

type DataTableGlobalFilterConfig = {
  value: string;
  onChange: (value: string) => void;
  onSubmit?: () => void;
  placeholder?: string;
  testId?: string;
};

type DataTableProps<TData, TValue> = {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  isLoading?: boolean;
  title?: string;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyCta?: ReactNode;
  rowId?: (row: TData) => string;
  rowTestId?: (row: TData) => string | undefined;
  pagination?: DataTablePaginationConfig;
  sorting?: DataTableSortingConfig;
  globalFilter?: DataTableGlobalFilterConfig;
  rightSlot?: ReactNode;
  filtersSlot?: ReactNode;
};

export function DataTable<TData, TValue>({
  columns,
  data,
  isLoading = false,
  title,
  emptyTitle,
  emptyDescription,
  emptyCta,
  rowId,
  rowTestId,
  pagination,
  sorting,
  globalFilter,
  rightSlot,
  filtersSlot,
}: DataTableProps<TData, TValue>) {
  const tCommon = useTranslations("common");
  const table = useReactTable({
    columns,
    data,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: pagination?.mode === "client" ? getPaginationRowModel() : undefined,
    getSortedRowModel:
      sorting && !sorting.manualSorting ? getSortedRowModel() : undefined,
    getRowId: rowId,
    manualPagination: pagination?.mode === "manual",
    manualSorting: sorting?.manualSorting ?? false,
    onPaginationChange: (updater) => {
      if (!pagination) {
        return;
      }

      const current = {
        pageIndex: pagination.pageIndex,
        pageSize: pagination.pageSize,
      };
      const next = typeof updater === "function" ? updater(current) : updater;
      pagination.onPaginationChange(next);
    },
    onSortingChange: (updater) => {
      if (!sorting) {
        return;
      }

      const next = typeof updater === "function" ? updater(sorting.sortingState) : updater;
      sorting.onSortingChange(next);
    },
    pageCount: pagination?.mode === "manual" ? pagination.pageCount : undefined,
    state: {
      pagination: pagination
        ? {
            pageIndex: pagination.pageIndex,
            pageSize: pagination.pageSize,
          }
        : undefined,
      sorting: sorting?.sortingState,
    },
  });

  const visibleColumnCount = Math.max(columns.length, 1);
  const hasRows = data.length > 0;
  const pageCount =
    pagination?.mode === "manual"
      ? pagination.pageCount ?? 1
      : pagination
        ? table.getPageCount()
        : 1;

  return (
    <div className="overflow-hidden rounded-[1.5rem] border border-border/70 bg-card/80 shadow-lg shadow-black/5">
      <DataTableToolbar
        filtersSlot={filtersSlot}
        globalFilter={globalFilter}
        rightSlot={rightSlot}
        title={title}
      />

      {isLoading ? (
        <DataTableSkeleton columns={visibleColumnCount} rows={5} />
      ) : !hasRows ? (
        <div className="px-6 py-6">
          <DataTableEmpty
            cta={emptyCta}
            description={emptyDescription || tCommon("emptyDescription")}
            title={emptyTitle || tCommon("emptyTitle")}
          />
        </div>
      ) : (
        <>
          <Table>
            <TableHeader className="bg-muted/35">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow className="hover:bg-transparent" key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead
                      className="h-12 px-4 text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground"
                      key={header.id}
                    >
                      {header.isPlaceholder ? null : header.column.getCanSort() ? (
                        <Button
                          className="-ml-3 h-auto rounded-lg px-3 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground hover:text-foreground"
                          onClick={header.column.getToggleSortingHandler()}
                          type="button"
                          variant="ghost"
                        >
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {header.column.getIsSorted() === "asc" ? (
                            <ArrowUp className="size-3.5" />
                          ) : header.column.getIsSorted() === "desc" ? (
                            <ArrowDown className="size-3.5" />
                          ) : (
                            <ArrowUpDown className="size-3.5 opacity-55" />
                          )}
                        </Button>
                      ) : (
                        flexRender(header.column.columnDef.header, header.getContext())
                      )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows.map((row) => (
                <TableRow
                  className="border-border/70"
                  data-testid={rowTestId?.(row.original)}
                  key={row.id}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell className="px-4 py-4 align-top" key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {pagination ? (
            <DataTablePagination
              onPaginationChange={pagination.onPaginationChange}
              pageCount={pageCount}
              pageIndex={pagination.pageIndex}
              pageSize={pagination.pageSize}
              totalItems={pagination.totalItems}
            />
          ) : null}
        </>
      )}
    </div>
  );
}
