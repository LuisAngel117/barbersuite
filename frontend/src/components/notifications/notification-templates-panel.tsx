"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { type ProblemBannerState, toProblemBanner } from "@/lib/problem";
import {
  NOTIFICATION_EMAIL_TEMPLATE_KINDS,
  type NotificationEmailTemplate,
} from "@/lib/types/notification-templates";
import { fetchNotificationEmailTemplates } from "@/components/notifications/notifications-api";
import { NotificationTemplateForm } from "@/components/notifications/notification-template-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ProblemBanner } from "@/components/ui/problem-banner";
import { Skeleton } from "@/components/ui/skeleton";

function getLocaleTag(locale: string) {
  return locale === "en" ? "en-US" : "es-EC";
}

function truncateTemplate(value: string | null, fallback: string) {
  const normalized = value?.trim();
  if (!normalized) {
    return fallback;
  }

  return normalized.length > 140 ? `${normalized.slice(0, 137)}...` : normalized;
}

export function NotificationTemplatesPanel() {
  const locale = useLocale();
  const tCommon = useTranslations("common");
  const tNotifications = useTranslations("notifications");
  const [templates, setTemplates] = useState<NotificationEmailTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [problem, setProblem] = useState<ProblemBannerState | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<NotificationEmailTemplate | null>(null);

  const formatter = useMemo(
    () =>
      new Intl.DateTimeFormat(getLocaleTag(locale), {
        dateStyle: "medium",
        timeStyle: "short",
      }),
    [locale],
  );

  const orderedTemplates = useMemo(
    () =>
      NOTIFICATION_EMAIL_TEMPLATE_KINDS.map((kind) =>
        templates.find((template) => template.kind === kind),
      ).filter((template): template is NotificationEmailTemplate => Boolean(template)),
    [templates],
  );

  const loadTemplates = useCallback(async () => {
    setIsLoading(true);

    const response = await fetchNotificationEmailTemplates();
    if (!response.data) {
      setTemplates([]);
      setProblem(toProblemBanner(response.problem, tNotifications("templates.loadFailed")));
      setIsLoading(false);
      return;
    }

    setTemplates(response.data.items);
    setProblem(null);
    setIsLoading(false);
  }, [tNotifications]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadTemplates();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [loadTemplates]);

  return (
    <div className="space-y-4" data-testid="notifications-templates-panel">
      {problem ? <ProblemBanner problem={problem} /> : null}

      <Card className="rounded-[1.5rem] border-border/70 bg-card/80 shadow-lg shadow-black/5">
        <CardHeader className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <CardTitle>{tNotifications("templates.title")}</CardTitle>
            <Badge className="rounded-full" variant="outline">
              {orderedTemplates.length || NOTIFICATION_EMAIL_TEMPLATE_KINDS.length}
            </Badge>
          </div>
          <CardDescription>{tNotifications("templates.description")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <div className="grid gap-4 xl:grid-cols-2">
              {NOTIFICATION_EMAIL_TEMPLATE_KINDS.map((kind) => (
                <div
                  className="space-y-4 rounded-[1.25rem] border border-border/70 p-5"
                  key={kind}
                >
                  <div className="flex items-center justify-between gap-3">
                    <Skeleton className="h-5 w-40 rounded-full" />
                    <Skeleton className="h-9 w-20 rounded-xl" />
                  </div>
                  <Skeleton className="h-20 rounded-2xl" />
                  <div className="grid gap-3 md:grid-cols-2">
                    <Skeleton className="h-24 rounded-2xl" />
                    <Skeleton className="h-24 rounded-2xl" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid gap-4 xl:grid-cols-2">
              {orderedTemplates.map((template) => (
                <div
                  className="space-y-4 rounded-[1.25rem] border border-border/70 bg-background/70 p-5"
                  data-testid={`notification-template-card-${template.kind}`}
                  key={template.kind}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold tracking-tight">
                          {tNotifications(`templates.kinds.${template.kind}`)}
                        </h3>
                        <Badge
                          className="rounded-full"
                          variant={template.enabled ? "secondary" : "outline"}
                        >
                          {template.enabled
                            ? tNotifications("templates.stateEnabled")
                            : tNotifications("templates.stateDisabled")}
                        </Badge>
                      </div>
                      <p className="text-sm leading-6 text-muted-foreground">
                        {formatter.format(new Date(template.updatedAt))}
                      </p>
                    </div>
                    <Button
                      className="rounded-xl"
                      data-testid={`notification-template-edit-${template.kind}`}
                      onClick={() => setSelectedTemplate(template)}
                      type="button"
                      variant="outline"
                    >
                      {tNotifications("templates.edit")}
                    </Button>
                  </div>

                  <div className="rounded-2xl border border-border/70 bg-muted/20 p-4">
                    <span className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                      {tNotifications("templates.subject")}
                    </span>
                    <p className="mt-2 text-sm font-medium tracking-tight text-foreground">
                      {truncateTemplate(template.subjectTemplate, tCommon("none"))}
                    </p>
                  </div>

                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="rounded-2xl border border-border/70 bg-muted/20 p-4">
                      <span className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                        {tNotifications("templates.bodyText")}
                      </span>
                      <p className="mt-2 text-sm leading-6 text-foreground">
                        {truncateTemplate(
                          template.bodyTextTemplate,
                          tNotifications("templates.emptyBody"),
                        )}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-border/70 bg-muted/20 p-4">
                      <span className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                        {tNotifications("templates.bodyHtml")}
                      </span>
                      <p className="mt-2 text-sm leading-6 text-foreground">
                        {truncateTemplate(
                          template.bodyHtmlTemplate,
                          tNotifications("templates.emptyBody"),
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <NotificationTemplateForm
        onOpenChange={(open) => {
          if (!open) {
            setSelectedTemplate(null);
          }
        }}
        onSuccess={loadTemplates}
        open={Boolean(selectedTemplate)}
        template={selectedTemplate}
      />
    </div>
  );
}
