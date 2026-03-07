"use client";

import { useLocale, useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ClientHistoryAppointment } from "@/lib/types/client-history";

function formatDateTime(value: string, locale: string, timeZone: string) {
  return new Intl.DateTimeFormat(locale === "en" ? "en-US" : "es-EC", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone,
  }).format(new Date(value));
}

export function ClientAppointmentsList({
  appointments,
  branchTimeZone,
}: {
  appointments: ClientHistoryAppointment[];
  branchTimeZone: string;
}) {
  const locale = useLocale();
  const tClients = useTranslations("clients");
  const tAppointments = useTranslations("appointments");

  if (appointments.length === 0) {
    return (
      <Card className="rounded-[1.5rem] border-border/70 bg-card/80">
        <CardContent className="px-6 py-8 text-sm text-muted-foreground">
          {tClients("emptyAppointments")}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4" data-testid="client-appointments-list">
      {appointments.map((appointment) => (
        <Card className="rounded-[1.5rem] border-border/70 bg-card/80" key={appointment.id}>
          <CardHeader className="flex flex-row items-start justify-between gap-4 pb-3">
            <div className="space-y-1">
              <CardTitle className="text-lg tracking-tight">{appointment.serviceName}</CardTitle>
              <p className="text-sm text-muted-foreground">
                {appointment.barberName}
              </p>
            </div>
            <Badge className="rounded-full" variant="outline">
              {tAppointments(`statuses.${appointment.status}`)}
            </Badge>
          </CardHeader>
          <CardContent className="space-y-1 text-sm text-muted-foreground">
            <p>{formatDateTime(appointment.startAt, locale, branchTimeZone)}</p>
            <p>{formatDateTime(appointment.endAt, locale, branchTimeZone)}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
