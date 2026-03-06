"use client";

import { useMemo, useState } from "react";
import type { ColumnDef, SortingState } from "@tanstack/react-table";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { DataTable } from "@/components/data-table/data-table";
import { DataTableRowActions } from "@/components/data-table/data-table-row-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatMoneyUSD, formatMinutes } from "@/lib/format";

type DemoRow = {
  id: string;
  name: string;
  durationMinutes: number;
  price: number;
  active: boolean;
};

const DEMO_ROWS: DemoRow[] = [
  { id: "1", name: "Corte Signature", durationMinutes: 45, price: 18, active: true },
  { id: "2", name: "Fade Premium", durationMinutes: 35, price: 14, active: true },
  { id: "3", name: "Barba + Toalla", durationMinutes: 25, price: 9, active: false },
  { id: "4", name: "Paquete Ejecutivo", durationMinutes: 60, price: 24, active: true },
  { id: "5", name: "Quick Trim", durationMinutes: 15, price: 6, active: false },
];

export function DataTableDemo() {
  const locale = useLocale();
  const tCommon = useTranslations("common");
  const tServices = useTranslations("services");
  const [search, setSearch] = useState("");
  const [sorting, setSorting] = useState<SortingState>([]);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });

  const filteredRows = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase(locale);
    if (!normalizedSearch) {
      return DEMO_ROWS;
    }

    return DEMO_ROWS.filter((row) => row.name.toLocaleLowerCase(locale).includes(normalizedSearch));
  }, [locale, search]);

  const columns = useMemo<ColumnDef<DemoRow>[]>(
    () => [
      {
        accessorKey: "name",
        header: tServices("name"),
        enableSorting: true,
        cell: ({ row }) => (
          <div className="space-y-1">
            <p className="font-medium tracking-tight">{row.original.name}</p>
            <p className="text-xs text-muted-foreground">demo_{row.original.id}</p>
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
        cell: ({ row }) => formatMoneyUSD(row.original.price, locale === "en" ? "en-US" : "es-EC"),
      },
      {
        accessorKey: "active",
        header: tServices("active"),
        cell: ({ row }) => (
          <Badge className="rounded-full" variant={row.original.active ? "secondary" : "outline"}>
            {row.original.active ? tServices("rowActive") : tServices("rowInactive")}
          </Badge>
        ),
      },
      {
        id: "actions",
        header: tCommon("actions"),
        enableSorting: false,
        cell: ({ row }) => (
          <DataTableRowActions
                actions={[
                  {
                    label: tCommon("edit"),
                    onClick: () => {
                      toast.message("Edit action", {
                        description: `Would open ${row.original.name}.`,
                      });
                    },
                  },
                  {
                    label: row.original.active ? tCommon("deactivate") : tCommon("activate"),
                    onClick: () => {
                      toast.message("Status action", {
                        description: `Would toggle ${row.original.name}.`,
                      });
                    },
                    destructive: true,
                  },
                ]}
            triggerTestId="ui-kit-datatable-actions"
          />
        ),
      },
    ],
    [locale, tCommon, tServices],
  );

  return (
    <DataTable
      columns={columns}
      data={filteredRows}
      emptyDescription={tCommon("emptyDescription")}
      emptyTitle={tCommon("emptyTitle")}
      globalFilter={{
        value: search,
        onChange: (value) => {
          setPagination((current) => ({ ...current, pageIndex: 0 }));
          setSearch(value);
        },
        placeholder: tCommon("search"),
      }}
      pagination={{
        mode: "client",
        pageIndex: pagination.pageIndex,
        pageSize: pagination.pageSize,
        onPaginationChange: setPagination,
      }}
      rightSlot={
        <Button
          className="rounded-xl"
          onClick={() =>
            toast.success("New action", {
              description: "The DataTable kit is ready for create flows.",
            })
          }
          type="button"
        >
          {tCommon("new")}
        </Button>
      }
      sorting={{
        sortingState: sorting,
        onSortingChange: setSorting,
      }}
      title="DataTable demo"
    />
  );
}
