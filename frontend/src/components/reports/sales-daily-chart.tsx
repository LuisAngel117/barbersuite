"use client";

import { useLocale, useTranslations } from "next-intl";
import { formatMoneyUSD } from "@/lib/format";
import type { SalesDaily } from "@/lib/types/reports";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

type SalesDailyChartProps = {
  daily: SalesDaily | null;
  isLoading?: boolean;
};

function parseDateLabel(date: string, locale: string) {
  const [year, month, day] = date.split("-").map(Number);
  const dateValue = new Date(Date.UTC(year, (month ?? 1) - 1, day ?? 1));

  return new Intl.DateTimeFormat(locale === "en" ? "en-US" : "es-EC", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(dateValue);
}

export function SalesDailyChart({
  daily,
  isLoading = false,
}: SalesDailyChartProps) {
  const locale = useLocale();
  const tReports = useTranslations("reports");
  const localeTag = locale === "en" ? "en-US" : "es-EC";

  if (isLoading) {
    return (
      <Card className="border-border/70 bg-card/80 shadow-sm" data-testid="reports-daily-chart">
        <CardHeader className="gap-3">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 md:grid-cols-7">
            {Array.from({ length: 7 }, (_, index) => (
              <div className="space-y-3" key={`reports-daily-skeleton-${index + 1}`}>
                <Skeleton className="h-4 w-14" />
                <Skeleton className="h-36 w-full rounded-2xl" />
                <Skeleton className="h-3 w-12" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const items = daily?.items ?? [];
  const maxValue = Math.max(...items.map((item) => item.grossSales), 0);

  return (
    <Card className="border-border/70 bg-card/80 shadow-sm" data-testid="reports-daily-chart">
      <CardHeader className="gap-2">
        <CardTitle>{tReports("dailySales")}</CardTitle>
        <CardDescription>{tReports("dailySalesDescription")}</CardDescription>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">{tReports("errors.noData")}</p>
        ) : (
          <div className="grid auto-cols-fr grid-flow-col gap-3 overflow-x-auto pb-1">
            {items.map((item) => {
              const height =
                maxValue <= 0 ? 8 : Math.max(8, Math.round((item.grossSales / maxValue) * 100));

              return (
                <div className="min-w-[80px] space-y-3" key={item.date}>
                  <div className="space-y-1">
                    <p className="text-sm font-semibold tracking-tight text-foreground">
                      {formatMoneyUSD(item.grossSales, localeTag)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {item.receiptsCount} {tReports("metrics.receiptsCount")}
                    </p>
                  </div>

                  <div className="flex h-44 items-end rounded-[1.25rem] border border-border/70 bg-muted/35 p-3">
                    <div
                      className="w-full rounded-xl bg-brand text-brand-foreground shadow-sm transition-all"
                      style={{ height: `${height}%` }}
                      title={`${item.date}: ${formatMoneyUSD(item.grossSales, localeTag)}`}
                    />
                  </div>

                  <p className="text-xs font-medium text-muted-foreground">
                    {parseDateLabel(item.date, locale)}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
