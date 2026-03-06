"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type ReportsFiltersProps = {
  from: string;
  to: string;
  isLoading?: boolean;
  onFromChange: (value: string) => void;
  onToChange: (value: string) => void;
  onApply: () => void;
};

export function ReportsFilters({
  from,
  to,
  isLoading = false,
  onFromChange,
  onToChange,
  onApply,
}: ReportsFiltersProps) {
  const tReports = useTranslations("reports");

  return (
    <div
      className="rounded-[1.5rem] border border-border/70 bg-card/80 p-5 shadow-lg shadow-black/5"
      data-testid="reports-filters"
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-2">
            <span className="text-sm font-medium text-foreground">
              {tReports("filters.from")}
            </span>
            <Input
              data-testid="reports-from"
              onChange={(event) => onFromChange(event.target.value)}
              type="date"
              value={from}
            />
          </label>
          <label className="grid gap-2">
            <span className="text-sm font-medium text-foreground">
              {tReports("filters.to")}
            </span>
            <Input
              data-testid="reports-to"
              onChange={(event) => onToChange(event.target.value)}
              type="date"
              value={to}
            />
          </label>
        </div>

        <Button
          className="rounded-xl"
          data-testid="reports-apply"
          disabled={isLoading}
          onClick={onApply}
          type="button"
        >
          {tReports("filters.apply")}
        </Button>
      </div>
    </div>
  );
}
