"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type DataTablePaginationProps = {
  pageIndex: number;
  pageSize: number;
  pageCount: number;
  totalItems?: number;
  onPaginationChange: (next: { pageIndex: number; pageSize: number }) => void;
};

const PAGE_SIZE_OPTIONS = [10, 20, 50];

export function DataTablePagination({
  pageIndex,
  pageSize,
  pageCount,
  totalItems,
  onPaginationChange,
}: DataTablePaginationProps) {
  const tCommon = useTranslations("common");
  const safePageCount = Math.max(pageCount, 1);
  const safePageIndex = Math.min(pageIndex, safePageCount - 1);

  return (
    <div className="flex flex-col gap-4 border-t border-border/70 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
        <span>
          {tCommon("page")} {safePageIndex + 1} {tCommon("of")} {safePageCount}
        </span>
        {typeof totalItems === "number" ? <span>{totalItems}</span> : null}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">{tCommon("rowsPerPage")}</span>
          <Select
            onValueChange={(value) =>
              onPaginationChange({
                pageIndex: 0,
                pageSize: Number(value),
              })
            }
            value={String(pageSize)}
          >
            <SelectTrigger className="w-[92px] rounded-xl border-border/70 bg-background">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PAGE_SIZE_OPTIONS.map((option) => (
                <SelectItem key={option} value={String(option)}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <Button
            className="rounded-xl"
            disabled={safePageIndex <= 0}
            onClick={() =>
              onPaginationChange({
                pageIndex: Math.max(safePageIndex - 1, 0),
                pageSize,
              })
            }
            type="button"
            variant="outline"
          >
            {tCommon("previous")}
          </Button>
          <Button
            className="rounded-xl"
            disabled={safePageIndex >= safePageCount - 1}
            onClick={() =>
              onPaginationChange({
                pageIndex: Math.min(safePageIndex + 1, safePageCount - 1),
                pageSize,
              })
            }
            type="button"
            variant="outline"
          >
            {tCommon("next")}
          </Button>
        </div>
      </div>
    </div>
  );
}
