"use client";

import Link from "next/link";
import { BookOpenText, ChartNoAxesCombined, Mail, Workflow } from "lucide-react";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type SettingsIntegrationsProps = {
  showLocalShortcuts: boolean;
};

function ExternalLinkButton({ href, label }: { href: string; label: string }) {
  return (
    <Button asChild className="rounded-xl" size="sm" type="button" variant="outline">
      <a href={href} rel="noreferrer" target="_blank">
        {label}
      </a>
    </Button>
  );
}

export function SettingsIntegrations({ showLocalShortcuts }: SettingsIntegrationsProps) {
  const tSettings = useTranslations("settings");

  return (
    <div className="grid gap-6 xl:grid-cols-3">
      <Card className="rounded-[1.5rem] border-border/70 bg-card/85" data-testid="settings-integrations-email">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-2xl bg-brand-muted text-brand-foreground">
              <Mail className="size-4" />
            </div>
            <div className="space-y-1">
              <CardTitle>{tSettings("integrations.email")}</CardTitle>
              <CardDescription>{tSettings("integrations.emailDescription")}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Badge className="rounded-full" variant="secondary">
            {tSettings("integrations.available")}
          </Badge>
          <div className="flex flex-wrap gap-2">
            <Button asChild className="rounded-xl" size="sm" type="button">
              <Link href="/app/notifications">{tSettings("integrations.openNotifications")}</Link>
            </Button>
            {showLocalShortcuts ? (
              <ExternalLinkButton href="http://localhost:8025" label={tSettings("integrations.openMailhog")} />
            ) : null}
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-[1.5rem] border-border/70 bg-card/85">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-2xl bg-brand-muted text-brand-foreground">
              <ChartNoAxesCombined className="size-4" />
            </div>
            <div className="space-y-1">
              <CardTitle>{tSettings("integrations.observability")}</CardTitle>
              <CardDescription>{tSettings("integrations.observabilityDescription")}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Badge className="rounded-full" variant="secondary">
            {tSettings("integrations.available")}
          </Badge>
          {showLocalShortcuts ? (
            <div className="flex flex-wrap gap-2">
              <ExternalLinkButton href="http://localhost:9090" label={tSettings("integrations.openPrometheus")} />
              <ExternalLinkButton href="http://localhost:3001" label={tSettings("integrations.openGrafana")} />
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">{tSettings("integrations.observabilityHint")}</p>
          )}
        </CardContent>
      </Card>

      <Card className="rounded-[1.5rem] border-border/70 bg-card/85">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-2xl bg-brand-muted text-brand-foreground">
              <Workflow className="size-4" />
            </div>
            <div className="space-y-1">
              <CardTitle>{tSettings("integrations.docs")}</CardTitle>
              <CardDescription>{tSettings("integrations.docsDescription")}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Badge className="rounded-full" variant="outline">
            <BookOpenText className="size-3.5" />
            {tSettings("integrations.internalLinks")}
          </Badge>
          <div className="flex flex-wrap gap-2">
            <Button asChild className="rounded-xl" size="sm" type="button" variant="outline">
              <Link href="/features">{tSettings("integrations.openFeatures")}</Link>
            </Button>
            <Button asChild className="rounded-xl" size="sm" type="button" variant="outline">
              <Link href="/app/ui-kit">{tSettings("integrations.openUiKit")}</Link>
            </Button>
            <Button asChild className="rounded-xl" size="sm" type="button" variant="outline">
              <Link href="/app/reports">{tSettings("integrations.openReports")}</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
