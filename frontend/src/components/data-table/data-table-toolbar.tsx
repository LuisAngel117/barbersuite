"use client";

import { Search, X } from "lucide-react";
import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type DataTableToolbarProps = {
  title?: string;
  globalFilter?: {
    value: string;
    onChange: (value: string) => void;
    onSubmit?: () => void;
    placeholder?: string;
    testId?: string;
  };
  rightSlot?: ReactNode;
  filtersSlot?: ReactNode;
};

export function DataTableToolbar({
  title,
  globalFilter,
  rightSlot,
  filtersSlot,
}: DataTableToolbarProps) {
  const tCommon = useTranslations("common");

  return (
    <div className="flex flex-col gap-4 border-b border-border/70 px-6 py-5 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex min-w-0 flex-1 flex-col gap-3">
        {title ? <strong className="text-sm font-semibold tracking-tight">{title}</strong> : null}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          {globalFilter ? (
            <div className="relative w-full max-w-xl">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="h-11 rounded-xl border-border/70 bg-background pl-9 pr-10"
                data-testid={globalFilter.testId}
                onChange={(event) => globalFilter.onChange(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    globalFilter.onSubmit?.();
                  }
                }}
                placeholder={globalFilter.placeholder || tCommon("search")}
                value={globalFilter.value}
              />
              {globalFilter.value ? (
                <Button
                  aria-label={tCommon("clear")}
                  className="absolute right-1 top-1/2 size-8 -translate-y-1/2 rounded-lg"
                  onClick={() => globalFilter.onChange("")}
                  size="icon"
                  type="button"
                  variant="ghost"
                >
                  <X className="size-4" />
                </Button>
              ) : null}
            </div>
          ) : null}
          {filtersSlot ? <div className="flex flex-wrap items-center gap-2">{filtersSlot}</div> : null}
        </div>
      </div>

      {rightSlot ? <div className="flex shrink-0 items-center gap-2">{rightSlot}</div> : null}
    </div>
  );
}
