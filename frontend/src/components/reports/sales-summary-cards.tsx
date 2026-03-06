"use client";

import { useLocale, useTranslations } from "next-intl";
import { formatMoneyUSD } from "@/lib/format";
import type { SalesSummary } from "@/lib/types/reports";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

type SalesSummaryCardsProps = {
  summary: SalesSummary | null;
  isLoading?: boolean;
};

function SummaryMetricSkeleton() {
  return (
    <Card className="border-border/70 bg-card/80 shadow-sm">
      <CardHeader className="space-y-3">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-9 w-32" />
      </CardHeader>
    </Card>
  );
}

export function SalesSummaryCards({
  summary,
  isLoading = false,
}: SalesSummaryCardsProps) {
  const locale = useLocale();
  const tReports = useTranslations("reports");
  const localeTag = locale === "en" ? "en-US" : "es-EC";

  if (isLoading) {
    return (
      <div
        className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
        data-testid="reports-sales-summary"
      >
        {Array.from({ length: 6 }, (_, index) => (
          <SummaryMetricSkeleton key={`reports-sales-skeleton-${index + 1}`} />
        ))}
      </div>
    );
  }

  const cards = [
    {
      key: "grossSales",
      label: tReports("metrics.grossSales"),
      value: formatMoneyUSD(summary?.grossSales ?? 0, localeTag),
      tone: "text-foreground",
    },
    {
      key: "receiptsCount",
      label: tReports("metrics.receiptsCount"),
      value: String(summary?.receiptsCount ?? 0),
      tone: "text-foreground",
    },
    {
      key: "avgTicket",
      label: tReports("metrics.avgTicket"),
      value: formatMoneyUSD(summary?.avgTicket ?? 0, localeTag),
      tone: "text-foreground",
    },
    {
      key: "discountTotal",
      label: tReports("metrics.discountTotal"),
      value: formatMoneyUSD(summary?.discountTotal ?? 0, localeTag),
      tone: "text-muted-foreground",
    },
    {
      key: "taxTotal",
      label: tReports("metrics.taxTotal"),
      value: formatMoneyUSD(summary?.taxTotal ?? 0, localeTag),
      tone: "text-muted-foreground",
    },
    {
      key: "voidedCount",
      label: tReports("metrics.voidedCount"),
      value: String(summary?.voidedCount ?? 0),
      tone: "text-destructive",
    },
  ];

  return (
    <div
      className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
      data-testid="reports-sales-summary"
    >
      {cards.map((card) => (
        <Card className="border-border/70 bg-card/80 shadow-sm" key={card.key}>
          <CardHeader className="gap-3">
            <CardDescription>{card.label}</CardDescription>
            <CardTitle className={`text-3xl tracking-tight ${card.tone}`}>
              {card.value}
            </CardTitle>
          </CardHeader>
        </Card>
      ))}
    </div>
  );
}
