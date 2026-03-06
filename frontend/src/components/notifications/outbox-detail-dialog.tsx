"use client";

import { useMemo } from "react";
import { useLocale, useTranslations } from "next-intl";
import type { EmailOutboxItem } from "@/lib/types/notifications";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type OutboxDetailDialogProps = {
  item: EmailOutboxItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

function getLocaleTag(locale: string) {
  return locale === "en" ? "en-US" : "es-EC";
}

export function OutboxDetailDialog({
  item,
  open,
  onOpenChange,
}: OutboxDetailDialogProps) {
  const locale = useLocale();
  const tNotifications = useTranslations("notifications");

  const formatter = useMemo(
    () =>
      new Intl.DateTimeFormat(getLocaleTag(locale), {
        dateStyle: "medium",
        timeStyle: "short",
      }),
    [locale],
  );

  function formatDate(value: string | null) {
    if (!value) {
      return "—";
    }

    return formatter.format(new Date(value));
  }

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="max-w-2xl rounded-[1.5rem] border-border/70 p-0 sm:max-w-2xl">
        <div className="space-y-6 p-6">
          <DialogHeader className="space-y-3 text-left">
            <div className="flex flex-wrap items-center gap-2">
              {item ? (
                <>
                  <Badge className="rounded-full" variant="outline">
                    {tNotifications(`kind.${item.kind}`)}
                  </Badge>
                  <Badge
                    className="rounded-full"
                    variant={item.status === "failed" ? "destructive" : "secondary"}
                  >
                    {tNotifications(`status.${item.status}`)}
                  </Badge>
                </>
              ) : null}
            </div>
            <DialogTitle>{tNotifications("actions.viewDetails")}</DialogTitle>
            <DialogDescription>{tNotifications("detailDescription")}</DialogDescription>
          </DialogHeader>

          {item ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1 rounded-2xl border border-border/70 bg-card/70 px-4 py-4">
                <span className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                  {tNotifications("table.to")}
                </span>
                <p className="text-sm font-medium tracking-tight">{item.toEmail}</p>
              </div>
              <div className="space-y-1 rounded-2xl border border-border/70 bg-card/70 px-4 py-4">
                <span className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                  {tNotifications("table.subject")}
                </span>
                <p className="text-sm font-medium tracking-tight">{item.subject}</p>
              </div>
              <div className="space-y-1 rounded-2xl border border-border/70 bg-card/70 px-4 py-4">
                <span className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                  {tNotifications("table.createdAt")}
                </span>
                <p className="text-sm text-foreground">{formatDate(item.createdAt)}</p>
              </div>
              <div className="space-y-1 rounded-2xl border border-border/70 bg-card/70 px-4 py-4">
                <span className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                  {tNotifications("table.scheduledAt")}
                </span>
                <p className="text-sm text-foreground">{formatDate(item.scheduledAt)}</p>
              </div>
              <div className="space-y-1 rounded-2xl border border-border/70 bg-card/70 px-4 py-4">
                <span className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                  {tNotifications("table.sentAt")}
                </span>
                <p className="text-sm text-foreground">{formatDate(item.sentAt)}</p>
              </div>
              <div className="space-y-1 rounded-2xl border border-border/70 bg-card/70 px-4 py-4">
                <span className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                  {tNotifications("table.attempts")}
                </span>
                <p className="text-sm text-foreground">{item.attempts}</p>
              </div>
              <div className="space-y-1 rounded-2xl border border-border/70 bg-card/70 px-4 py-4 sm:col-span-2">
                <span className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                  {tNotifications("table.lastError")}
                </span>
                <p className="text-sm leading-6 text-foreground">
                  {item.lastError || tNotifications("table.noError")}
                </p>
              </div>
            </div>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
