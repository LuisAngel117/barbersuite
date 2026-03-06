"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { ProblemBanner } from "@/components/ui/problem-banner";
import { type ProblemBannerState, toProblemBanner } from "@/lib/problem";
import type {
  AppointmentsSummary,
  BarbersSummary,
  SalesDaily,
  SalesSummary,
  TopServices,
} from "@/lib/types/reports";
import {
  fetchAppointmentsSummary,
  fetchBarbersSummary,
  fetchSalesDaily,
  fetchSalesSummary,
  fetchTopServices,
} from "@/components/reports/reports-api";
import { AppointmentsSummaryCards } from "@/components/reports/appointments-summary-cards";
import { BarbersSummaryTable } from "@/components/reports/barbers-summary-table";
import { ReportsFilters } from "@/components/reports/reports-filters";
import { SalesDailyChart } from "@/components/reports/sales-daily-chart";
import { SalesSummaryCards } from "@/components/reports/sales-summary-cards";
import { TopServicesTable } from "@/components/reports/top-services-table";

type ReportsDashboardProps = {
  branchCode: string;
  branchName: string;
  branchTimeZone: string;
  initialFrom: string;
  initialTo: string;
};

type ReportsState = {
  salesSummary: SalesSummary | null;
  salesDaily: SalesDaily | null;
  topServices: TopServices | null;
  appointmentsSummary: AppointmentsSummary | null;
  barbersSummary: BarbersSummary | null;
};

const EMPTY_REPORTS_STATE: ReportsState = {
  salesSummary: null,
  salesDaily: null,
  topServices: null,
  appointmentsSummary: null,
  barbersSummary: null,
};

export function ReportsDashboard({
  branchCode,
  branchName,
  branchTimeZone,
  initialFrom,
  initialTo,
}: ReportsDashboardProps) {
  const tReports = useTranslations("reports");
  const [draftFrom, setDraftFrom] = useState(initialFrom);
  const [draftTo, setDraftTo] = useState(initialTo);
  const [filters, setFilters] = useState({
    from: initialFrom,
    to: initialTo,
  });
  const [reports, setReports] = useState<ReportsState>(EMPTY_REPORTS_STATE);
  const [isLoading, setIsLoading] = useState(true);
  const [problem, setProblem] = useState<ProblemBannerState | null>(null);

  const loadReports = useCallback(async () => {
    setIsLoading(true);

    const commonParams = new URLSearchParams({
      from: filters.from,
      to: filters.to,
    });
    const topServicesParams = new URLSearchParams(commonParams);
    topServicesParams.set("limit", "10");

    const [
      salesSummaryResult,
      salesDailyResult,
      topServicesResult,
      appointmentsSummaryResult,
      barbersSummaryResult,
    ] = await Promise.all([
      fetchSalesSummary(commonParams),
      fetchSalesDaily(commonParams),
      fetchTopServices(topServicesParams),
      fetchAppointmentsSummary(commonParams),
      fetchBarbersSummary(commonParams),
    ]);

    setReports({
      salesSummary: salesSummaryResult.data,
      salesDaily: salesDailyResult.data,
      topServices: topServicesResult.data,
      appointmentsSummary: appointmentsSummaryResult.data,
      barbersSummary: barbersSummaryResult.data,
    });

    const firstProblem =
      salesSummaryResult.problem ??
      salesDailyResult.problem ??
      topServicesResult.problem ??
      appointmentsSummaryResult.problem ??
      barbersSummaryResult.problem;

    setProblem(firstProblem ? toProblemBanner(firstProblem, tReports("errors.loadFailed")) : null);
    setIsLoading(false);
  }, [filters.from, filters.to, tReports]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadReports();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [loadReports]);

  function applyFilters() {
    if (!draftFrom || !draftTo) {
      setProblem({
        title: tReports("errors.validationTitle"),
        detail: tReports("errors.rangeRequired"),
        code: "VALIDATION_ERROR",
      });
      return;
    }

    if (draftFrom > draftTo) {
      setProblem({
        title: tReports("errors.validationTitle"),
        detail: tReports("errors.invalidRange"),
        code: "VALIDATION_ERROR",
      });
      return;
    }

    if (draftFrom === filters.from && draftTo === filters.to) {
      void loadReports();
      return;
    }

    setProblem(null);
    setFilters({
      from: draftFrom,
      to: draftTo,
    });
  }

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge className="rounded-full bg-brand-muted text-brand-foreground hover:bg-brand-muted">
            {tReports("branchScoped")}
          </Badge>
          <Badge className="rounded-full" variant="outline">
            {branchCode}
          </Badge>
          <Badge className="rounded-full" variant="outline">
            {branchName}
          </Badge>
          <Badge className="rounded-full" variant="outline">
            {branchTimeZone}
          </Badge>
        </div>
        <p className="text-sm leading-6 text-muted-foreground">{tReports("description")}</p>
      </div>

      <ReportsFilters
        from={draftFrom}
        isLoading={isLoading}
        onApply={applyFilters}
        onFromChange={setDraftFrom}
        onToChange={setDraftTo}
        to={draftTo}
      />

      {problem ? <ProblemBanner problem={problem} /> : null}

      <SalesSummaryCards isLoading={isLoading} summary={reports.salesSummary} />

      <div className="grid gap-6 xl:grid-cols-[1.35fr_1fr]">
        <SalesDailyChart daily={reports.salesDaily} isLoading={isLoading} />
        <AppointmentsSummaryCards
          isLoading={isLoading}
          summary={reports.appointmentsSummary}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <TopServicesTable isLoading={isLoading} items={reports.topServices?.items ?? []} />
        <BarbersSummaryTable
          isLoading={isLoading}
          items={reports.barbersSummary?.items ?? []}
        />
      </div>
    </div>
  );
}
