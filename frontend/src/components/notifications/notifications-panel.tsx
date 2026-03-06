"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { OutboxTable } from "@/components/notifications/outbox-table";
import { TestEmailForm } from "@/components/notifications/test-email-form";
import { Badge } from "@/components/ui/badge";

export function NotificationsPanel() {
  const tNotifications = useTranslations("notifications");
  const [refreshToken, setRefreshToken] = useState(0);

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge className="rounded-full bg-brand-muted text-brand-foreground hover:bg-brand-muted">
            {tNotifications("tenantScoped")}
          </Badge>
          <Badge className="rounded-full" variant="outline">
            {tNotifications("outboxReady")}
          </Badge>
        </div>
        <p className="text-sm leading-6 text-muted-foreground">{tNotifications("description")}</p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[440px_minmax(0,1fr)]">
        <TestEmailForm onEnqueued={() => setRefreshToken((current) => current + 1)} />
        <OutboxTable refreshToken={refreshToken} />
      </div>
    </div>
  );
}
