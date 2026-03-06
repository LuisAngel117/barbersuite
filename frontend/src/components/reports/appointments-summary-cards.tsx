"use client";

import { useTranslations } from "next-intl";
import { formatMinutes } from "@/lib/format";
import type { AppointmentsSummary } from "@/lib/types/reports";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

type AppointmentsSummaryCardsProps = {
  summary: AppointmentsSummary | null;
  isLoading?: boolean;
};

function AppointmentsMetricSkeleton() {
  return (
    <Card className="border-border/70 bg-card/80 shadow-sm">
      <CardHeader className="space-y-3">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-8 w-20" />
      </CardHeader>
    </Card>
  );
}

export function AppointmentsSummaryCards({
  summary,
  isLoading = false,
}: AppointmentsSummaryCardsProps) {
  const tReports = useTranslations("reports");

  if (isLoading) {
    return (
      <div
        className="grid gap-4 sm:grid-cols-2"
        data-testid="reports-appointments-summary"
      >
        {Array.from({ length: 6 }, (_, index) => (
          <AppointmentsMetricSkeleton key={`reports-appointments-skeleton-${index + 1}`} />
        ))}
      </div>
    );
  }

  const cards = [
    {
      key: "scheduled",
      label: tReports("appointments.scheduled"),
      value: String(summary?.scheduledCount ?? 0),
    },
    {
      key: "checkedIn",
      label: tReports("appointments.checkedIn"),
      value: String(summary?.checkedInCount ?? 0),
    },
    {
      key: "completed",
      label: tReports("appointments.completed"),
      value: String(summary?.completedCount ?? 0),
    },
    {
      key: "cancelled",
      label: tReports("appointments.cancelled"),
      value: String(summary?.cancelledCount ?? 0),
    },
    {
      key: "noShow",
      label: tReports("appointments.noShow"),
      value: String(summary?.noShowCount ?? 0),
    },
    {
      key: "bookedMinutes",
      label: tReports("appointments.bookedMinutes"),
      value: formatMinutes(summary?.bookedMinutes ?? 0),
    },
  ];

  return (
    <div
      className="grid gap-4 sm:grid-cols-2"
      data-testid="reports-appointments-summary"
    >
      {cards.map((card) => (
        <Card className="border-border/70 bg-card/80 shadow-sm" key={card.key}>
          <CardHeader className="gap-3">
            <CardDescription>{card.label}</CardDescription>
            <CardTitle className="text-2xl tracking-tight">{card.value}</CardTitle>
          </CardHeader>
        </Card>
      ))}
    </div>
  );
}
