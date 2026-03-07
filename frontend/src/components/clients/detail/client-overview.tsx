"use client";

import { useLocale, useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatMoneyUSD } from "@/lib/format";
import type { ClientHistoryResponse } from "@/lib/types/client-history";

function formatDateTime(value: string, locale: string, timeZone: string) {
  return new Intl.DateTimeFormat(locale === "en" ? "en-US" : "es-EC", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone,
  }).format(new Date(value));
}

export function ClientOverview({
  history,
  branchTimeZone,
}: {
  history: ClientHistoryResponse;
  branchTimeZone: string;
}) {
  const locale = useLocale();
  const tClients = useTranslations("clients");
  const tCommon = useTranslations("common");
  const client = history.client;
  const latestAppointment = history.appointments[0] ?? null;
  const latestReceipt = history.receipts[0] ?? null;

  return (
    <div className="space-y-6" data-testid="client-overview">
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="rounded-[1.5rem] border-border/70 bg-card/80">
          <CardHeader className="pb-3">
            <CardDescription>{tClients("stats.totalVisits")}</CardDescription>
            <CardTitle className="text-3xl tracking-tight">
              {history.stats.totalVisits}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="rounded-[1.5rem] border-border/70 bg-card/80">
          <CardHeader className="pb-3">
            <CardDescription>{tClients("stats.noShows")}</CardDescription>
            <CardTitle className="text-3xl tracking-tight">
              {history.stats.noShows}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="rounded-[1.5rem] border-border/70 bg-card/80">
          <CardHeader className="pb-3">
            <CardDescription>{tClients("stats.totalSpend")}</CardDescription>
            <CardTitle className="text-3xl tracking-tight">
              {formatMoneyUSD(history.stats.totalSpend, locale === "en" ? "en-US" : "es-EC")}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <Card className="rounded-[1.5rem] border-border/70 bg-card/80">
          <CardHeader>
            <CardDescription>{tClients("detailTitle")}</CardDescription>
            <CardTitle className="text-2xl tracking-tight">{client.fullName}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                {tClients("contact")}
              </p>
              <p className="text-sm font-medium">{client.phone || tCommon("none")}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                {tClients("form.email")}
              </p>
              <p className="text-sm font-medium">{client.email || tCommon("none")}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                {tClients("active")}
              </p>
              <Badge className="rounded-full" variant={client.active ? "secondary" : "outline"}>
                {client.active ? tClients("rowActive") : tClients("rowInactive")}
              </Badge>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                {tClients("notes")}
              </p>
              <p className="text-sm font-medium">{client.notes || tCommon("none")}</p>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6">
          <Card className="rounded-[1.5rem] border-border/70 bg-card/80">
            <CardHeader>
              <CardDescription>{tClients("sections.recentAppointments")}</CardDescription>
              <CardTitle className="text-lg tracking-tight">
                {latestAppointment ? latestAppointment.serviceName : tCommon("none")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              {latestAppointment ? (
                <>
                  <p>{formatDateTime(latestAppointment.startAt, locale, branchTimeZone)}</p>
                  <p>{latestAppointment.barberName}</p>
                </>
              ) : (
                <p>{tClients("emptyAppointments")}</p>
              )}
            </CardContent>
          </Card>

          <Card className="rounded-[1.5rem] border-border/70 bg-card/80">
            <CardHeader>
              <CardDescription>{tClients("sections.recentReceipts")}</CardDescription>
              <CardTitle className="text-lg tracking-tight">
                {latestReceipt ? latestReceipt.number : tCommon("none")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              {latestReceipt ? (
                <>
                  <p>{formatDateTime(latestReceipt.issuedAt, locale, branchTimeZone)}</p>
                  <p>
                    {formatMoneyUSD(
                      latestReceipt.total,
                      locale === "en" ? "en-US" : "es-EC",
                    )}
                  </p>
                </>
              ) : (
                <p>{tClients("emptyReceipts")}</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
