"use client";

import Link from "next/link";
import { Building2, CalendarClock, Bell, ChartColumnBig, Scissors, UserRound } from "lucide-react";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { MePayload } from "@/lib/backend";

type SettingsWorkspaceProps = {
  tenant: MePayload["tenant"];
  branches: MePayload["branches"];
};

const featureIcons = {
  appointments: CalendarClock,
  services: Scissors,
  reports: ChartColumnBig,
  notifications: Bell,
} as const;

export function SettingsWorkspace({ tenant, branches }: SettingsWorkspaceProps) {
  const tSettings = useTranslations("settings");

  return (
    <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
      <Card className="rounded-[1.5rem] border-border/70 bg-card/85">
        <CardHeader>
          <CardTitle>{tSettings("workspace.title")}</CardTitle>
          <CardDescription>{tSettings("workspace.description")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-border/70 bg-muted/30 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                {tSettings("workspace.workspaceName")}
              </p>
              <p className="mt-2 text-lg font-semibold tracking-tight">{tenant.name}</p>
            </div>
            <div className="rounded-2xl border border-border/70 bg-muted/30 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                {tSettings("workspace.workspaceId")}
              </p>
              <p className="mt-2 break-all text-sm font-medium text-muted-foreground">{tenant.id}</p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-border/70 bg-muted/30 p-4">
              <div className="flex items-center gap-3">
                <Building2 className="size-4 text-brand" />
                <div>
                  <p className="font-medium">{tSettings("workspace.branches")}</p>
                  <p className="text-sm text-muted-foreground">
                    {tSettings("workspace.branchesCount", { count: branches.length })}
                  </p>
                </div>
              </div>
              <Button asChild className="mt-4 rounded-xl" size="sm" type="button" variant="outline">
                <Link href="/app/branches">{tSettings("workspace.openBranches")}</Link>
              </Button>
            </div>

            <div className="rounded-2xl border border-border/70 bg-muted/30 p-4">
              <div className="flex items-center gap-3">
                <UserRound className="size-4 text-brand" />
                <div>
                  <p className="font-medium">{tSettings("workspace.staff")}</p>
                  <p className="text-sm text-muted-foreground">{tSettings("workspace.staffDescription")}</p>
                </div>
              </div>
              <Button asChild className="mt-4 rounded-xl" size="sm" type="button" variant="outline">
                <Link href="/app/staff">{tSettings("workspace.openStaff")}</Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-[1.5rem] border-border/70 bg-card/85">
        <CardHeader>
          <CardTitle>{tSettings("workspace.featuresTitle")}</CardTitle>
          <CardDescription>{tSettings("workspace.featuresDescription")}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3">
          {(Object.keys(featureIcons) as Array<keyof typeof featureIcons>).map((featureKey) => {
            const Icon = featureIcons[featureKey];

            return (
              <div
                className="flex items-center justify-between rounded-2xl border border-border/70 bg-muted/30 px-4 py-3"
                key={featureKey}
              >
                <div className="flex items-center gap-3">
                  <div className="flex size-9 items-center justify-center rounded-2xl bg-brand-muted text-brand-foreground">
                    <Icon className="size-4" />
                  </div>
                  <span className="font-medium">{tSettings(`workspace.features.${featureKey}`)}</span>
                </div>
                <Badge className="rounded-full" variant="secondary">
                  {tSettings("workspace.available")}
                </Badge>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
